[CmdletBinding()]
param(
  [string]$DistributionId = "E231SUU13SS6IL",
  [switch]$Wait
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Command {
  param([Parameter(Mandatory = $true)][string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found on PATH."
  }
}

Assert-Command "aws"

Write-Host "Reading CloudFront distribution '$DistributionId'..."
$distributionConfigJson = aws cloudfront get-distribution-config `
  --id $DistributionId `
  --output json
if ($LASTEXITCODE -ne 0) {
  throw "aws cloudfront get-distribution-config failed."
}

$distributionConfigResponse = $distributionConfigJson | ConvertFrom-Json
if ($distributionConfigResponse.DistributionConfig.Enabled) {
  Write-Host "CloudFront distribution is already enabled."
  exit 0
}

$distributionConfigResponse.DistributionConfig.Enabled = $true
$updateConfigPath = Join-Path $env:TEMP "twf-cloudfront-enable-$DistributionId.json"
$updateConfigJson = $distributionConfigResponse.DistributionConfig | ConvertTo-Json -Depth 100
[System.IO.File]::WriteAllText(
  $updateConfigPath,
  $updateConfigJson,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Enabling CloudFront distribution '$DistributionId'..."
aws cloudfront update-distribution `
  --id $DistributionId `
  --if-match $distributionConfigResponse.ETag `
  --distribution-config "file://$updateConfigPath" `
  --query "Distribution.{Id:Id,Status:Status,Enabled:DistributionConfig.Enabled,Domain:DomainName}" `
  --output table
if ($LASTEXITCODE -ne 0) {
  throw "aws cloudfront update-distribution failed."
}

if ($Wait) {
  Write-Host "Waiting for CloudFront enablement to deploy..."
  aws cloudfront wait distribution-deployed --id $DistributionId
  if ($LASTEXITCODE -ne 0) {
    throw "aws cloudfront wait distribution-deployed failed."
  }
}

Write-Host ""
Write-Host "Frontend CloudFront distribution is enabling."
