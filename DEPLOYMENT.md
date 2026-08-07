# Frontend Deployment

This file documents the current production deployment for the Tiers! With Friends frontend and the exact steps to publish updates.

## Current Production Setup

- App URL: `https://www.tierswithfriends.com`
- CDN: AWS CloudFront
- CloudFront distribution ID: `E231SUU13SS6IL`
- CloudFront domain: `d11vpjj7tww6sz.cloudfront.net`
- Origin bucket: `s3://www.tierswithfriends.com`
- Region for the bucket: `us-east-1`

The frontend is built as a static Vite app, uploaded to S3, and served through CloudFront with the custom domain `www.tierswithfriends.com`.

## Production Build Inputs

The production build currently expects:

- `VITE_SOCKET_URL=https://api.tierswithfriends.com`
- `VITE_ENABLE_DEBUG_CONTROLS=false`
- `VITE_SITE_URL=https://www.tierswithfriends.com`

These values are injected at build time before running `npm run build`.

## Deploy A Frontend Update

<b>Preferred command:</b>

```powershell
npm run deploy:frontend
```

Equivalent manual commands (do not need to run this if the above command succeeded) run these commands from the `client` repo root:

```powershell
$env:VITE_SOCKET_URL = "https://api.tierswithfriends.com"
$env:VITE_ENABLE_DEBUG_CONTROLS = "false"
$env:VITE_SITE_URL = "https://www.tierswithfriends.com"

npm run build

aws s3 sync dist s3://www.tierswithfriends.com --delete

aws cloudfront create-invalidation `
  --distribution-id E231SUU13SS6IL `
  --paths "/*"
```

What this does:

- builds the production bundle
- uploads the new files to the S3 origin bucket
- removes old hashed assets that are no longer needed
- clears the CloudFront cache so browsers get the new build quickly

## When The Frontend Deployment Needs A Backend Change

If a frontend release changes the site origin or the API host, the backend may also need to be updated.

Examples:

- If `www.tierswithfriends.com` changes, update the backend `CLIENT_ORIGINS`
- If the API domain changes, rebuild the frontend with a new `VITE_SOCKET_URL`

## Verification

After deployment:

1. Open `https://www.tierswithfriends.com`
2. Hard refresh once after the invalidation starts propagating
3. Confirm the app loads with the expected styling
4. Confirm creating and joining a room still works

## Notes

- The apex domain `tierswithfriends.com` is not the primary frontend host in the current setup.
- The production frontend should be treated as `https://www.tierswithfriends.com`.

## Pause Or Resume The Frontend CDN

When the project is parked, disable CloudFront instead of deleting the S3 bucket. This takes the public frontend offline while keeping the built assets and deployment configuration available.

To disable the frontend CDN:

```powershell
npm run cloudfront:stop
```

To turn it back on:

```powershell
npm run cloudfront:start
```

To check the current frontend deployment state:

```powershell
npm run cloudfront:status
```

What this keeps:

- the S3 bucket `s3://www.tierswithfriends.com`
- the deployed frontend files
- the CloudFront distribution configuration
- Route 53 records and ACM certificate validation records

Disabling CloudFront is reversible, but it can take several minutes to fully deploy globally.
