# Araç kategorilerine imagin.studio resim URL'si ekler
# Marka (root) + Model (subcategory) kategorilerini günceller
# Calistir: pwsh tools/seed-vehicle-images.ps1

$server   = "(localdb)\mssqllocaldb"
$database = "EcomDb"

# ─── imagin.studio slug haritasi (SparePartsBrandNav ile aynı) ───────────────
$MAKE_SLUG = @{
    "mercedes-benz" = "mercedes-benz"
    "land-rover"    = "land-rover"
    "alfa-romeo"    = "alfa-romeo"
    "tofas"         = "fiat"
}

$PAINT_CYCLE = @(
    "color-red","color-blue","color-midnight-blue","color-silver",
    "color-forest-green","color-white","color-grey","color-orange"
)

# ─── getModelFamily: generation kodu soy, base slug uret ─────────────────────
function GetModelFamily($brandKey, $modelName) {
    $m     = $modelName.Trim()
    $lower = $m.ToLower()

    # BMW: "3 Serisi E30" → "3-series"
    if ($lower -match '^(\d)\s+serisi?') { return "$($Matches[1])-series" }

    # Mercedes: "C Serisi W204" → "c-class"
    if ($lower -match '^([a-z])\s+serisi?' -and $brandKey -eq "mercedes-benz") {
        return "$($Matches[1])-class"
    }

    # Generation / kasa kodlarini soy (sondan)
    $s = $m
    $s = [regex]::Replace($s, '\s+Mk\s*\d+\s*$', '', 'IgnoreCase')
    $s = [regex]::Replace($s, '\s+[A-Z]\d+[A-Za-z]?\s*$', '')   # E30 F30 B8 G20
    $s = [regex]::Replace($s, '\s+[A-Z]{2,4}\s*$', '')            # YS3D GE BJ
    $s = [regex]::Replace($s, '\s+[IVXLC]{1,4}\s*$', '')          # VI III IX
    $s = [regex]::Replace($s, '\s+[A-Z]\s*$', '')                  # tek harf: H

    $s = $s.Trim().ToLower()
    $s = $s -replace 'ğ','g' -replace 'ü','u' -replace 'ş','s' `
            -replace 'ı','i' -replace 'ö','o' -replace 'ç','c'
    $s = $s -replace '\s+','-'
    $s = $s -replace '[^a-z0-9-]',''

    if ($s) { return $s }
    return $lower -replace '\s+','-' -replace '[^a-z0-9-]',''
}

function GetMake($brandSlug) {
    if ($MAKE_SLUG.ContainsKey($brandSlug)) { return $MAKE_SLUG[$brandSlug] }
    return $brandSlug
}

function GetModelImageUrl($brandSlug, $modelName, $idx) {
    $make   = GetMake $brandSlug
    $family = GetModelFamily $brandSlug $modelName
    $paint  = $PAINT_CYCLE[$idx % $PAINT_CYCLE.Count]
    return "https://cdn.imagin.studio/getimage?customer=img&make=$make&modelFamily=$family&angle=23&width=500&zoomType=fullscreen&paintId=$paint"
}

function GetBrandImageUrl($brandSlug) {
    $make = GetMake $brandSlug
    return "https://cdn.imagin.studio/getimage?customer=img&make=$make&angle=23&width=800&zoomType=fullscreen"
}

# ─── DB'den araç kategorilerini cek ─────────────────────────────────────────
Write-Host "Kategoriler okunuyor..." -ForegroundColor Cyan

$queryBrands = @"
SELECT Id, Name, Slug
FROM Categories
WHERE ShowInVehicleNav = 1 AND IsDeleted = 0 AND ParentCategoryId IS NULL
ORDER BY SortOrder
"@

$queryModels = @"
SELECT c.Id, c.Name, c.Slug, p.Slug AS ParentSlug, c.SortOrder
FROM Categories c
JOIN Categories p ON c.ParentCategoryId = p.Id
WHERE p.ShowInVehicleNav = 1 AND c.IsDeleted = 0 AND p.IsDeleted = 0
ORDER BY p.SortOrder, c.SortOrder
"@

# sqlcmd CSV modunda calistir
$brands = sqlcmd -S $server -d $database -Q $queryBrands -s "|" -W -h -1 2>&1 |
    Where-Object { $_ -match '\|' } |
    ForEach-Object {
        $parts = $_ -split '\|'
        [PSCustomObject]@{ Id = $parts[0].Trim(); Name = $parts[1].Trim(); Slug = $parts[2].Trim() }
    }

$models = sqlcmd -S $server -d $database -Q $queryModels -s "|" -W -h -1 2>&1 |
    Where-Object { $_ -match '\|' } |
    ForEach-Object {
        $parts = $_ -split '\|'
        [PSCustomObject]@{
            Id         = $parts[0].Trim()
            Name       = $parts[1].Trim()
            Slug       = $parts[2].Trim()
            ParentSlug = $parts[3].Trim()
            SortOrder  = [int]($parts[4].Trim())
        }
    }

Write-Host "  Marka kategorisi: $($brands.Count)" -ForegroundColor White
Write-Host "  Model kategorisi: $($models.Count)" -ForegroundColor White

# ─── UPDATE SQL olustur ───────────────────────────────────────────────────────
$sqlLines = @()

# Marka resimleri
foreach ($b in $brands) {
    $url = GetBrandImageUrl $b.Slug
    $sqlLines += "UPDATE Categories SET ImageUrl = '$url' WHERE Id = '$($b.Id)';"
    Write-Host "  [MARKA] $($b.Name) → $($b.Slug)" -ForegroundColor DarkCyan
}

# Model resimleri
$modelsByParent = $models | Group-Object ParentSlug
foreach ($group in $modelsByParent) {
    $brandSlug = $group.Name
    $idx = 0
    foreach ($m in $group.Group) {
        $url = GetModelImageUrl $brandSlug $m.Name $idx
        $sqlLines += "UPDATE Categories SET ImageUrl = '$url' WHERE Id = '$($m.Id)';"
        $idx++
    }
    Write-Host "  [MODELLER] $brandSlug : $($group.Group.Count) model guncellendi" -ForegroundColor DarkGray
}

# SQL dosyasina yaz ve calistir
$sqlFile = "$PSScriptRoot\seed-vehicle-images.sql"
($sqlLines -join "`n") | Out-File -FilePath $sqlFile -Encoding UTF8

Write-Host "`nSQL calistiriliyor ($($sqlLines.Count) UPDATE)..." -ForegroundColor Yellow
$out = sqlcmd -S $server -d $database -i $sqlFile 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Basariyla tamamlandi!" -ForegroundColor Green

    # Dogrula
    $check = sqlcmd -S $server -d $database -Q `
        "SELECT COUNT(*) FROM Categories WHERE ImageUrl LIKE '%imagin.studio%' AND IsDeleted = 0" `
        -h -1 -W 2>&1 | Where-Object { $_ -match '^\d+$' } | Select-Object -First 1
    Write-Host "Imagin.studio URL'li kategori sayisi: $($check.Trim())" -ForegroundColor Green
} else {
    Write-Host "HATA:" -ForegroundColor Red
    $out | Write-Host
}
