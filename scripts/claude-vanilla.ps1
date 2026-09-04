# Launch Vanilla Claude Code (Standard Subscription)
# Clears environment overrides to force standard Anthropic oauth credentials.

$env:ANTHROPIC_BASE_URL = ""
$env:ANTHROPIC_AUTH_TOKEN = ""
$env:ANTHROPIC_API_KEY = ""
$env:ANTHROPIC_MODEL = ""

Write-Host "Launching Vanilla Claude Code..." -ForegroundColor Green
claude @args
