Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("c:\xampp3\htdocs\anivex\public\sana-loading.lottie")
$entry = $zip.Entries[0]
$sr = New-Object System.IO.StreamReader($entry.Open())
$content = $sr.ReadToEnd()
$sr.Close()
$zip.Dispose()
[System.IO.File]::WriteAllText("c:\xampp3\htdocs\anivex\public\sana-loading.json", $content)
Write-Host "Extraido OK"
