@echo off
:: ============================================================
:: update.bat — Session sonu tek komut güncelleyici
:: Kullanim: update.bat
:: Claude bu dosyayi calistirip ciktiyi okur, commit mesajlari
:: ve log icerigini konusmadan otomatik halleder.
:: ============================================================

setlocal enabledelayedexpansion

set ECOM_DIR=C:\PROJECTS\DOTNET\ECOM
set DOCS_DIR=C:\PROJECTS\DOTNET\dotnet-ecom-docs

echo.
echo ===== ECOM REPO =====
cd /d "%ECOM_DIR%"
git status --short
git log --oneline -5

echo.
echo ===== DOCS REPO =====
cd /d "%DOCS_DIR%"
git status --short
git log --oneline -5

echo.
echo ===== SON COMMIT HASH =====
cd /d "%ECOM_DIR%"
git rev-parse HEAD

echo.
echo [HAZIR] Claude commit mesajlarini ve log icerigini belirleyip guncellemeleri yapacak.
