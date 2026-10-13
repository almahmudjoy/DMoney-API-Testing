$ErrorActionPreference = 'Stop'
$envPath = Join-Path $PSScriptRoot '.env'

if (-not (Test-Path $envPath)) {
    throw 'Missing .env. Copy .env.example to .env and configure the test accounts.'
}

Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) {
        return
    }

    $parts = $line -split '=', 2
    if ($parts.Count -eq 2) {
        [Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), 'Process')
    }
}

$partnerKey = [Environment]::GetEnvironmentVariable('PARTNER_KEY', 'Process')
$apiEnvPath = Join-Path $PSScriptRoot '..\dmoney-transaction-api\.env'
if (-not $partnerKey -and (Test-Path $apiEnvPath)) {
    Get-Content $apiEnvPath | ForEach-Object {
        $line = $_.Trim()
        if ($line.StartsWith('PARTNER_KEY=')) {
            $partnerKey = $line.Substring('PARTNER_KEY='.Length).Trim()
        }
    }
    if ($partnerKey) {
        [Environment]::SetEnvironmentVariable('PARTNER_KEY', $partnerKey, 'Process')
    }
}

$requiredKeys = @(
    'BASE_URL', 'PARTNER_KEY', 'DEFAULT_OTP',
    'AGENT1_IDENTIFIER', 'AGENT1_PASSWORD', 'AGENT1_PHONE',
    'AGENT2_IDENTIFIER', 'AGENT2_PASSWORD', 'AGENT2_PHONE',
    'CUSTOMER1_IDENTIFIER', 'CUSTOMER1_PASSWORD', 'CUSTOMER1_PHONE',
    'CUSTOMER2_IDENTIFIER', 'CUSTOMER2_PASSWORD', 'CUSTOMER2_PHONE',
    'MERCHANT1_IDENTIFIER', 'MERCHANT1_PASSWORD', 'MERCHANT1_PHONE',
    'MERCHANT2_IDENTIFIER', 'MERCHANT2_PASSWORD', 'MERCHANT2_PHONE'
)
$missingKeys = @($requiredKeys | Where-Object { -not [Environment]::GetEnvironmentVariable($_, 'Process') })
if ($missingKeys.Count -gt 0) {
    Write-Output ("Configure these values in .env before running k6: " + ($missingKeys -join ', '))
    exit 1
}

New-Item -ItemType Directory -Path (Join-Path $PSScriptRoot 'reports') -Force | Out-Null

Push-Location $PSScriptRoot
try {
    & k6 run '.\dmoney-transactions.js'
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}