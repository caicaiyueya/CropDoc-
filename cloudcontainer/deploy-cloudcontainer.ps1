# 打包云托管部署 zip（PowerShell，Windows 推荐）
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Build-Zip {
    param(
        [string]$DockerfileName,
        [string[]]$ExtraFiles,
        [string]$OutName
    )

    $stage = Join-Path $env:TEMP ("yunnong-ai-" + [Guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $stage | Out-Null

    try {
        Copy-Item (Join-Path $Root 'app.py') $stage
        Copy-Item (Join-Path $Root 'download_model.py') $stage
        Copy-Item (Join-Path $Root 'disease-class-map.json') $stage
        Copy-Item (Join-Path $Root $DockerfileName) (Join-Path $stage 'Dockerfile')

        if ($DockerfileName -eq 'Dockerfile.mock') {
            Copy-Item (Join-Path $Root 'requirements-mock.txt') (Join-Path $stage 'requirements.txt')
        } else {
            Copy-Item (Join-Path $Root 'requirements.txt') $stage
        }

        foreach ($file in $ExtraFiles) {
            Copy-Item (Join-Path $Root $file) $stage
        }

        $out = Join-Path $Root $OutName
        if (Test-Path $out) { Remove-Item $out -Force }
        Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $out -Force
        Write-Host "OK: $out"
    } finally {
        Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Build-Zip -DockerfileName 'Dockerfile.mock' -ExtraFiles @() -OutName 'ai-service-mock.zip'
Build-Zip -DockerfileName 'Dockerfile' -ExtraFiles @() -OutName 'ai-service.zip'

Write-Host ''
Write-Host 'Next: upload ai-service-mock.zip first (MOCK_MODE=true), then ai-service.zip for real model.'
Write-Host 'See DEPLOY-cloudrun.md'
