[CmdletBinding()]
param(
  [string]$DistributionId = "E231SUU13SS6IL",
  [string]$Bucket = "www.tierswithfriends.com"
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

Write-Host "CloudFront distribution:"
aws cloudfront get-distribution `
  --id $DistributionId `
  --query "Distribution.{Id:Id,Status:Status,Enabled:DistributionConfig.Enabled,Domain:DomainName,Aliases:DistributionConfig.Aliases.Items}" `
  --output table
if ($LASTEXITCODE -ne 0) {
  throw "aws cloudfront get-distribution failed."
}

Write-Host ""
Write-Host "S3 bucket object summary:"
aws s3 ls "s3://$Bucket" --recursive --summarize
if ($LASTEXITCODE -ne 0) {
  throw "aws s3 ls failed."
}
