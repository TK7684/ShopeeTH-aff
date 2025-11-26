# Shopee Thailand Affiliate Product Analyzer

Automated tool to fetch and analyze Shopee Thailand affiliate products by commission rate. Automatically uploads top products to Google Sheets daily via Vercel Cron Jobs.

## Features

- 🔍 Fetch products from Shopee Affiliate API
- 💰 Filter by commission rate and amount (>60 THB)
- 📊 Analyze and sort products
- 📈 Auto-upload to Google Sheets with category breakdowns
- ⏰ Scheduled daily execution (midnight) on Vercel
- 🌐 Web interface for manual analysis

## Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment** (copy `.env.example` to `.env`):
   ```bash
   cp .env.example .env
   ```

3. **Add your Google Service Account credentials**:
   - Place `credentials.json` in the project root
   - Update `GOOGLE_SHEETS_ID` in `.env`

4. **Run the pipeline**:
   ```bash
   npm run auto
   ```

### Available Scripts

- `npm run fetch` - Fetch products from Shopee API
- `npm run analyze` - Analyze and filter products
- `npm run server` - Start web interface
- `npm test` - Test API connectivity
- `npm run auto` - Run complete pipeline once
- `npm run schedule` - Start scheduled pipeline (local)

## Vercel Deployment

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete deployment instructions.

**Quick Deploy**:
```bash
vercel
```

Set environment variables in Vercel dashboard and the cron will run automatically at midnight.

## Configuration

Key environment variables:

- `GOOGLE_SHEETS_ID` - Your Google Sheets spreadsheet ID
- `PIPELINE_MIN_COMMISSION` - Minimum commission in THB (default: 60)
- `PIPELINE_CATEGORY_TOP_LIMIT` - Top products per category in summary (default: 5)
- `PIPELINE_CATEGORY_TAB_LIMIT` - Top products per category tab (default: 20)

See `.env.example` for all options.

## Project Structure

- `api/cron.js` - Vercel serverless function for scheduled execution
- `fetchProducts.js` - Fetch products from Shopee API
- `analyzeProducts.js` - Filter and analyze products
- `googleSheets.js` - Upload to Google Sheets
- `server.js` - Web interface server
- `index.html` - Web UI for manual analysis

## License

ISC
