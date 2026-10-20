$src = 'D:\01_ATOM_ENGINE'
$files = Get-ChildItem -Path $src -Recurse -File | Select-Object -ExpandProperty Name
$dupes = $files | Group-Object | Where-Object { $_.Count -gt 1 }

if ($dupes.Count -gt 0) {
    Write-Host ''
    Write-Host "!! ATTENTION : $($dupes.Count) FICHIER(S) AVEC DES NOMS IDENTIQUES !!"
    Write-Host '   Les fichiers du meme nom seront ECRASES (le dernier gagne).'
    Write-Host ''
    Write-Host 'Doublons :'
    $dupes | ForEach-Object { Write-Host "   - $($_.Name) (x$($_.Count))" }
    Write-Host ''
    Read-Host 'Appuie sur Entree pour continuer'
} else {
    Write-Host '   Aucun doublon detecte.'
}
