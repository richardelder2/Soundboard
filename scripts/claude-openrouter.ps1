# Launch Claude Code configured for OpenRouter
# Loads configurations directly from your local .env file.

$envPath = Join-Path (Get-Location) ".env"
$orKey = ""
$orModel = "anthropic/claude-3.5-sonnet"

if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^\s*OPENROUTER_API_KEY\s*=\s*(.*)\s*$') {
            $orKey = $Matches[1].Trim("`"").Trim("'")
        }
        if ($_ -match '^\s*OPENROUTER_MODEL\s*=\s*(.*)\s*$') {
            $orModel = $Matches[1].Trim("`"").Trim("'")
        }
    }
}

if ([string]::IsNullOrEmpty($orKey)) {
    # Fallback to system env if .env is missing
    $orKey = $env:OPENROUTER_API_KEY
}

if ([string]::IsNullOrEmpty($orKey)) {
    Write-Error "Error: OPENROUTER_API_KEY not found in .env or system environment variables."
    exit 1
}

$env:ANTHROPIC_BASE_URL = "https://openrouter.ai/api"
$env:ANTHROPIC_AUTH_TOKEN = $orKey
$env:ANTHROPIC_API_KEY = ""
$env:ANTHROPIC_MODEL = $orModel

Write-Host "Launching Claude Code on OpenRouter (${orModel})..." -ForegroundColor Cyan
claude @args
