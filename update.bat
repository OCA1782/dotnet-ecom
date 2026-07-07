@echo off
:: ============================================================
:: update.bat — Session sonu tek komut dokuman guncelleyici
:: Kullanim: update
:: Claude bu ciktiya bakarak CHANGELOG, BUGS, DAILY_PROGRESS,
:: TODO_PENDING, TODO_DONE, PROGRESS, DECISIONS dosyalarini
:: otomatik gunceller ve her iki repoyu push eder.
:: ============================================================

set ECOM=C:\PROJECTS\DOTNET\ECOM
set DOCS=C:\PROJECTS\DOTNET\dotnet-ecom-docs

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║              ECOM REPO — DEGISIKLIKLER               ║
echo ╚══════════════════════════════════════════════════════╝
cd /d "%ECOM%"
echo.
echo [git status]
git status --short
echo.
echo [Son 10 commit]
git log --oneline -10
echo.
echo [Son commit hash]
git rev-parse HEAD

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║              DOCS REPO — MEVCUT DURUM                ║
echo ╚══════════════════════════════════════════════════════╝
cd /d "%DOCS%"
echo.
echo [git status]
git status --short
echo.
echo [Son 5 commit]
git log --oneline -5

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║              DOCS — GUNCELLENMESI GEREKENLER         ║
echo ╚══════════════════════════════════════════════════════╝
echo.
echo [CHANGELOG.md — son versiyon]
findstr /r "^\#\# \[" "%DOCS%\CHANGELOG.md" 2>nul | head /n 3 2>nul || (
  for /f "tokens=*" %%a in ('findstr /r "^\#\# " "%DOCS%\CHANGELOG.md"') do (
    echo %%a
    goto :changelog_done
  )
)
:changelog_done

echo.
echo [BUGS.md — acik buglar]
findstr /c:"🔴 Open" "%DOCS%\BUGS.md" 2>nul | find /c "🔴" > nul 2>&1
findstr "🔴" "%DOCS%\BUGS.md" 2>nul

echo.
echo [TODO_PENDING.md (docs) — bekleyenler]
findstr /v "^>" "%DOCS%\TODO_PENDING.md" 2>nul | findstr "\[ \]"

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║  HAZIR — Claude asagidaki dosyalari guncelleyecek:   ║
echo ║  DAILY_PROGRESS / CHANGELOG / BUGS / TODO_PENDING   ║
echo ║  TODO_DONE / PROGRESS / DECISIONS (gerekirse)       ║
echo ╚══════════════════════════════════════════════════════╝
echo.
