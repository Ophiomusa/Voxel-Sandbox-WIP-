@echo off
setlocal

set "SRC=D:\01_ATOM_ENGINE"
set "DEST=D:\01_ATOM_ENGINE_XECHANGE"

:: Trouver le prochain numero via powershell (fiable)
for /f %%N in ('powershell -NoProfile -Command "($dirs = Get-ChildItem -Path '%DEST%' -Directory -Filter 'V*' | ForEach-Object { [int]($_.Name -replace '^V','') }); if($dirs){ ($dirs | Measure-Object -Maximum).Maximum + 1 } else { 1 }"') do set "NUM=%%N"
if %NUM% LSS 10 (set "NUM=00%NUM%") else if %NUM% LSS 100 (set "NUM=0%NUM%")
set "FOLDER=V%NUM%"
set "OUT=%DEST%\%FOLDER%"

echo.
echo ==========================================
echo  ECHANGE FLAT : %FOLDER%
echo ==========================================
echo.

:: --- PHASE 1 : Detection des doublons ---
echo Scan des fichiers...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0check_dupes.ps1"
if errorlevel 1 (
    echo Abandon.
    exit /b 1
)

:: --- PHASE 2 : Copie plate ---
mkdir "%OUT%" 2>nul

echo.
echo Copie de tous les fichiers...
set "COUNT=0"
for /r "%SRC%" %%F in (*) do (
    copy /Y "%%F" "%OUT%\%%~nxF" >nul 2>&1
    set /a COUNT+=1
)

echo.
echo Termine : %OUT%
echo    %COUNT% fichiers copies (mode plat, sous-dossiers fusionnes)
echo.
