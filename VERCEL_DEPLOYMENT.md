# Vercel Deployment Guide

## Prerequisites
1. Vercel account
2. Google Service Account credentials JSON file
3. Google Sheets ID

## Environment Variables

Set these in your Vercel project settings:

```bash
# Google Sheets Configuration
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_SHEETS_RANGE=DailyTop!A1
GOOGLE_SHEETS_CATEGORY_RANGE=CategoryTop!A1

# Google Service Account Credentials (IMPORTANT!)
# Copy the ENTIRE contents of your credentials.json file as a single-line JSON string
GOOGLE_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key":"..."}

# Pipeline Configuration
PIPELINE_MIN_RATE=10
PIPELINE_MIN_COMMISSION=60
PIPELINE_TOP=100
PIPELINE_LIMIT=50
PIPELINE_MAX_PAGES=5
PIPELINE_HISTORY_LIMIT=1000
PIPELINE_CATEGORY_TOP_LIMIT=5
PIPELINE_CATEGORY_TAB_LIMIT=20

# Optional: Cron Secret for security
CRON_SECRET=your_random_secret_here
```

## Setting Up Google Credentials in Vercel

**Method 1: Copy JSON as Environment Variable (Recommended)**

1. Open your `credentials.json` file
2. Copy the ENTIRE contents (it should be a single line or minified JSON)
3. In Vercel Dashboard → Your Project → Settings → Environment Variables
4. Add new variable:
   - **Name**: `GOOGLE_CREDENTIALS_JSON`
   - **Value**: Paste the entire JSON content
   - Make sure it's valid JSON (starts with `{` and ends with `}`)

**Method 2: Minify JSON First**

If your credentials file is multi-line, minify it first:
```bash
# On Windows PowerShell:
Get-Content credentials.json | ConvertFrom-Json | ConvertTo-Json -Compress

# Or use an online JSON minifier
```

Then paste the minified result into Vercel.

## Deployment Steps

1. **Push to GitHub** (if not done):
   ```bash
   git add .
   git commit -m "Update for Vercel deployment"
   git push
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**:
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add all variables listed above
   - **IMPORTANT**: Add `GOOGLE_CREDENTIALS_JSON` with your service account JSON

4. **Redeploy** (after adding env vars):
   ```bash
   vercel --prod
   ```

## Testing the Cron Endpoint

Test manually:

```bash
curl https://your-project.vercel.app/api/cron
```

Expected success response:
```json
{
  "message": "Success",
  "fetched": 495,
  "filtered": 100
}
```

## Troubleshooting

### Error: "ENOENT: no such file or directory, open '/var/task/service-account.json'"
**Solution**: You need to set `GOOGLE_CREDENTIALS_JSON` environment variable in Vercel.

### Error: "Failed to parse GOOGLE_CREDENTIALS_JSON"
**Solution**: Make sure the JSON is valid and properly escaped. It should be a single-line JSON string.

### Function Timeout
**Solution**: Reduce `PIPELINE_MAX_PAGES` to 3 or lower in environment variables.

### No Products Fetched
**Solution**: 
- Check Shopee API credentials in `shopeeApi.js`
- Verify the API is accessible from Vercel's servers
- Check function logs in Vercel dashboard

## Cron Schedule

The cron runs at **midnight UTC** daily. To change:

Edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 17 * * *"  // 5 PM UTC = Midnight Bangkok (UTC+7)
    }
  ]
}
```

## Monitoring

View execution logs:
1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs" or "Functions"
4. Filter by `/api/cron`

## Important Notes

- Vercel free tier: 60-second timeout
- Cron jobs on free tier: Limited invocations
- Consider upgrading for production use
