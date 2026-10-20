@echo off
setlocal EnableDelayedExpansion

set "SRC=D:\01_ATOM_ENGINE"
set "DEST=D:\01_ATOM_ENGINE_BACKUP\00_Backup"

:: Trouver le NUMERO MAXIMUM parmi tous les dossiers VXXXX* (V suivi de 4+ chiffres)
set "MAXNUM=0"
for /d %%D in ("%DEST%\V????*") do (
    set "FNAME=%%~nxD"
    set "FNAME=!FNAME:V=!"
    set "FNAME=!FNAME:~0,4!"
    if !FNAME! GTR !MAXNUM! set "MAXNUM=!FNAME!"
)

:: Incrémenter (set /a traite 0050 en octal ! on convertit d'abord)
set /a "NUM=1!MAXNUM! - 10000 + 1"

:: Formater sur 4 chiffres
if %NUM% LSS 10 (set "NUM=000%NUM%") else if %NUM% LSS 100 (set "NUM=00%NUM%") else if %NUM% LSS 1000 (set "NUM=0%NUM%")

set "FOLDER=V%NUM%"

echo Backup : %FOLDER%
xcopy "%SRC%" "%DEST%\%FOLDER%" /E /I /Q /H /Y >nul 2>&1
echo Termine : %DEST%\%FOLDER%
