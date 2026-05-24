# Servidor estático simple en PowerShell usando HttpListener
param()

$root = $PSScriptRoot
if (!(Test-Path $root)) {
  Write-Error "Root path not found: $root"
  exit 1
}

$port = 5500
$prefix = "http://127.0.0.1:$port/"

try {
  $listener = New-Object System.Net.HttpListener
  $listener.Prefixes.Add($prefix)
  $listener.Start()
Write-Host "[StaticServer] Serving on http://localhost:$port/" -ForegroundColor Green
} catch {
  Write-Error "Failed to start server: $_"
  exit 1
}

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
  } catch {
    break
  }
  $req = $ctx.Request
  $res = $ctx.Response
  $relPath = if ($req.Url.AbsolutePath -eq "/") { "/index.html" } else { $req.Url.AbsolutePath }
  # Map to filesystem (ignore leading slash, convert / to \)
  $relative = $relPath.TrimStart('/') -replace '/', '\\'
  $file = Join-Path $root $relative
  if (Test-Path $file) {
    $ext = [IO.Path]::GetExtension($file)
    $ctype = switch ($ext) {
      ".html" { "text/html" }
      ".css"  { "text/css" }
      ".js"   { "application/javascript" }
      ".png"  { "image/png" }
      ".jpg"  { "image/jpeg" }
      ".jpeg" { "image/jpeg" }
      ".svg"  { "image/svg+xml" }
      ".gif"  { "image/gif" }
      ".ico"  { "image/x-icon" }
      default  { "application/octet-stream" }
    }
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $res.ContentType = $ctype
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
    $res.OutputStream.Close()
  } else {
    $res.StatusCode = 404
    $res.StatusDescription = "Not Found"
    $res.Close()
  }
}
