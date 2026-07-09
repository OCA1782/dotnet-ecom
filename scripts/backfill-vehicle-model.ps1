#!/usr/bin/env pwsh
# Backfills Product.VehicleModel from product names using vehicle nav category data.
# Products with "|" in name format: "CODE | [Brand] Model Year+ Description"
# Two-pass strategy:
#   Pass 1: Exact brand+model prefix match (fast, high precision)
#   Pass 2: Alias + chassis-code matching for Mercedes/Benz products

param(
    [int]$BatchSize = 5000,
    [switch]$DryRun = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Data

$connStr = "Server=(localdb)\MSSQLLocalDB;Database=EcomDB;Trusted_Connection=True;Connect Timeout=30;"

# Arabic → Roman numeral map (1-10 covers all VW Golf I-VIII etc.)
$arabicToRoman = @{
    " 1 " = " I "; " 2 " = " II "; " 3 " = " III "; " 4 " = " IV "
    " 5 " = " V "; " 6 " = " VI "; " 7 " = " VII "; " 8 " = " VIII "
    " 9 " = " IX "; " 10 " = " X "
    " 1$" = " I"; " 2$" = " II"; " 3$" = " III"; " 4$" = " IV"
    " 5$" = " V"; " 6$" = " VI"; " 7$" = " VII"; " 8$" = " VIII"
}

# Brand aliases: product text prefix → canonical nav brand name
$brandAliases = @{
    "benz "         = "Mercedes-Benz"
    "mercedes "     = "Mercedes-Benz"
    "vw "           = "Volkswagen"
}

function Normalize-Text([string]$text) {
    # Normalize arabic numerals to roman for VW-style model names (e.g. "Golf 6" → "Golf VI")
    # Only apply inside word boundaries using simple trailing-number replacement
    $t = $text
    $t = [regex]::Replace($t, '(\b)([IVX]+)(\s+)([0-9]+)(\s|$)', '$1$2$3$4$5') # keep roman as-is
    # Replace trailing/inline arabic numbers adjacent to space
    $t = [regex]::Replace($t, '\s+8(\s|$)', ' VIII$1')
    $t = [regex]::Replace($t, '\s+7(\s|$)', ' VII$1')
    $t = [regex]::Replace($t, '\s+6(\s|$)', ' VI$1')
    $t = [regex]::Replace($t, '\s+5(\s|$)', ' V$1')
    $t = [regex]::Replace($t, '\s+4(\s|$)', ' IV$1')
    $t = [regex]::Replace($t, '\s+3(\s|$)', ' III$1')
    $t = [regex]::Replace($t, '\s+2(\s|$)', ' II$1')
    $t = [regex]::Replace($t, '\s+1(\s|$)', ' I$1')
    return $t
}

function Find-Model([string]$afterPipe, [hashtable]$brandModels, [string[]]$brandNames) {
    # Pass 1: Direct brand prefix match
    foreach ($brand in $brandNames) {
        if (-not $afterPipe.StartsWith($brand, [System.StringComparison]::OrdinalIgnoreCase)) { continue }
        $mList = $brandModels[$brand]
        foreach ($m in $mList) {
            if ($afterPipe.StartsWith($m.Full, [System.StringComparison]::OrdinalIgnoreCase)) {
                return $m.Model
            }
        }
        # Brand matched but no generation-specific model — try normalized text (arabic → roman)
        $norm = Normalize-Text $afterPipe
        if ($norm -ne $afterPipe) {
            foreach ($m in $mList) {
                if ($norm.StartsWith($m.Full, [System.StringComparison]::OrdinalIgnoreCase)) {
                    return $m.Model
                }
            }
        }
        break  # Brand found, stop checking others (avoid false alias matches)
    }

    # Pass 2: Alias matching (e.g. "Benz C Serisi W205" → "Mercedes-Benz" + "C Serisi W205")
    $lower = $afterPipe.ToLower()
    foreach ($alias in $brandAliases.Keys) {
        if (-not $lower.StartsWith($alias)) { continue }
        $canonBrand = $brandAliases[$alias]
        $textAfterAlias = $afterPipe.Substring($alias.Length).TrimStart()
        $mList = $brandModels[$canonBrand]
        if ($null -eq $mList) { continue }
        foreach ($m in $mList) {
            if ($textAfterAlias.StartsWith($m.Model, [System.StringComparison]::OrdinalIgnoreCase)) {
                return $m.Model
            }
        }
        break
    }

    return $null
}

Write-Host "[1/4] Loading vehicle nav models from DB..."
$conn = New-Object System.Data.SqlClient.SqlConnection $connStr
$conn.Open()

$cmd = $conn.CreateCommand()
$cmd.CommandText = @"
SELECT brand.Name as BrandName, model.Name as ModelName
FROM Categories brand
JOIN Categories model ON model.ParentCategoryId=brand.Id
WHERE brand.ShowInVehicleNav=1 AND brand.IsDeleted=0 AND model.IsDeleted=0
ORDER BY LEN(brand.Name + ' ' + model.Name) DESC
"@
$reader = $cmd.ExecuteReader()
$allModels = [System.Collections.Generic.List[object]]::new()
while ($reader.Read()) {
    $allModels.Add([PSCustomObject]@{
        Brand = [string]$reader["BrandName"]
        Model = [string]$reader["ModelName"]
        Full  = "$($reader["BrandName"]) $($reader["ModelName"])"
    })
}
$reader.Close()
Write-Host "  Loaded $($allModels.Count) models across $(($allModels | Select-Object -ExpandProperty Brand -Unique).Count) brands"

# Build brand → sorted-models lookup (case-insensitive keys)
$brandModels = [System.Collections.Generic.Dictionary[string, object[]]]::new(
    [System.StringComparer]::OrdinalIgnoreCase)
foreach ($m in $allModels) {
    if (-not $brandModels.ContainsKey($m.Brand)) {
        $brandModels[$m.Brand] = @()
    }
    $brandModels[$m.Brand] = $brandModels[$m.Brand] + $m
}
# Also add canonical brand entries for alias lookups
foreach ($alias in $brandAliases.Values | Select-Object -Unique) {
    if (-not $brandModels.ContainsKey($alias)) {
        Write-Host "  WARNING: Alias target '$alias' not in nav brands"
    }
}

# Brand names sorted by length DESC (longest first: "Land Rover" before "Land")
$brandNames = @($brandModels.Keys | Sort-Object { $_.Length } -Descending)

Write-Host "[2/4] Loading products needing backfill..."
$cmd2 = $conn.CreateCommand()
$cmd2.CommandTimeout = 120
$cmd2.CommandText = "SELECT Id, Name FROM Products WHERE IsDeleted=0 AND VehicleModel IS NULL AND CHARINDEX('|', Name)>0"
$reader2 = $cmd2.ExecuteReader()
$products = [System.Collections.Generic.List[object]]::new()
while ($reader2.Read()) {
    $products.Add([PSCustomObject]@{
        Id   = $reader2["Id"].ToString()
        Name = [string]$reader2["Name"]
    })
}
$reader2.Close()
$conn.Close()
Write-Host "  Loaded $($products.Count) products to process"

Write-Host "[3/4] Matching products to vehicle models..."
$matches = [System.Collections.Generic.List[object]]::new()
$noMatch = 0

foreach ($p in $products) {
    $pipeIdx = $p.Name.IndexOf('|')
    if ($pipeIdx -lt 0) { continue }
    $afterPipe = $p.Name.Substring($pipeIdx + 1).TrimStart().TrimStart('|').TrimStart()

    $model = Find-Model $afterPipe $brandModels $brandNames
    if ($null -ne $model) {
        $matches.Add([PSCustomObject]@{ Id = $p.Id; Model = $model })
    } else {
        $noMatch++
    }
}

Write-Host "  Matched: $($matches.Count) products"
Write-Host "  Unmatched: $noMatch products"
Write-Host "  Match rate: $([Math]::Round($matches.Count / $products.Count * 100, 1))%"

if ($DryRun) {
    Write-Host "[DRY RUN] Sample matches:"
    $matches | Select-Object -First 15 | Format-Table -AutoSize
    Write-Host ""
    Write-Host "Sample unmatched (for debugging):"
    $unmatchedSample = $products | Where-Object {
        $pipeIdx = $_.Name.IndexOf('|')
        $afterPipe = $_.Name.Substring($pipeIdx + 1).TrimStart().TrimStart('|').TrimStart()
        $null -eq (Find-Model $afterPipe $brandModels $brandNames)
    } | Select-Object -First 8 | ForEach-Object {
        $pipeIdx = $_.Name.IndexOf('|')
        $_.Name.Substring($pipeIdx + 1).TrimStart().TrimStart('|').TrimStart() | Select-Object -First 80
    }
    $unmatchedSample | ForEach-Object { Write-Host "  $_" }
    exit 0
}

Write-Host "[4/4] Updating DB in batches of $BatchSize..."
$conn2 = New-Object System.Data.SqlClient.SqlConnection $connStr
$conn2.Open()
$totalUpdated = 0
$batchNum = 0
$list = $matches.ToArray()

for ($i = 0; $i -lt $list.Count; $i += $BatchSize) {
    $batchNum++
    $batch = $list[$i..([Math]::Min($i + $BatchSize - 1, $list.Count - 1))]

    $values = ($batch | ForEach-Object { "('$($_.Id)', '$($_.Model -replace "'","''")')" }) -join ","

    $updateCmd = $conn2.CreateCommand()
    $updateCmd.CommandTimeout = 120
    $updateCmd.CommandText = @"
CREATE TABLE #BatchUpdate (ProductId UNIQUEIDENTIFIER, ModelName NVARCHAR(300));
INSERT INTO #BatchUpdate VALUES $values;
UPDATE p SET p.VehicleModel = b.ModelName
FROM Products p JOIN #BatchUpdate b ON p.Id = b.ProductId
WHERE p.VehicleModel IS NULL;
DROP TABLE #BatchUpdate;
"@
    $null = $updateCmd.ExecuteNonQuery()
    $totalUpdated += $batch.Count
    Write-Host "  Batch ${batchNum}: $($batch.Count) rows (total: $totalUpdated)"
}

$conn2.Close()
Write-Host ""
Write-Host "Done! Updated $totalUpdated products with VehicleModel."
Write-Host "Remaining unmatched: $noMatch"
