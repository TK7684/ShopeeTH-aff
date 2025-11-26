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

## Google Service Account Setup

1. Upload your Google Service Account JSON file to Vercel as a secret
2. The credentials file should be accessible at runtime
3. Make sure the service account has edit access to your Google Sheet

**Option 1: Store as environment variable (recommended)**
- Convert JSON to base64: `cat credentials.json | base64`
- Set as env var: `GOOGLE_CREDENTIALS_BASE64=<base64_string>`
- Decode in code before use

**Option 2: Use Vercel's file system**
- Note: Vercel serverless functions have read-only filesystem except `/tmp`
- You'll need to write credentials to `/tmp` at runtime

## Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set Environment Variables**:
   - Go to your project settings on Vercel dashboard
   - Navigate to "Environment Variables"
   - Add all required variables listed above

5. **Enable Cron Jobs**:
   - Cron jobs are automatically enabled via `vercel.json`
   - The cron will run at midnight (00:00 UTC) daily
   - Adjust timezone in `vercel.json` if needed

## Testing the Cron Endpoint

You can manually trigger the cron job:

```bash
curl https://your-project.vercel.app/api/cron
```

Or with authentication (if CRON_SECRET is set):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-project.vercel.app/api/cron
```

## Important Notes

- **Execution Time**: Vercel has a 60-second timeout for serverless functions on Hobby plan
- **Adjust MAX_PAGES**: If the function times out, reduce `PIPELINE_MAX_PAGES` in environment variables
- **Monitoring**: Check Vercel logs to see cron execution results
- **Cold Starts**: First execution may be slower due to cold start

## Troubleshooting

### Function Timeout
- Reduce `PIPELINE_MAX_PAGES` to 3 or lower
- Reduce `PIPELINE_LIMIT` to 30 or lower

### Google Sheets API Error
- Verify service account has edit permissions
- Check that GOOGLE_SHEETS_ID is correct
- Ensure credentials are properly loaded

### No Products Fetched
- Check Shopee API credentials in `shopeeApi.js`
- Verify network connectivity from Vercel
- Check Vercel function logs for detailed errors
