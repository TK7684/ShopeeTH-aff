# Windows Installation Issues - Workarounds

## Problem
Windows is having issues installing npm packages due to:
1. **Long path names** - Your project path is very long: `G:\My Drive\Courses\Shopee Affiliate Ads\SHP_Product\SHP_Product`
2. **File locking** - Windows file system locking issues with npm
3. **Corrupted npm cache** - The npm cache has corrupted tarballs

## Solutions

### Option 1: Enable Long Path Support in Windows (Recommended)
1. Open PowerShell as Administrator
2. Run: `New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force`
3. Restart your computer
4. Try `npm install` again

### Option 2: Move Project to Shorter Path
Move your project to a shorter path like:
- `C:\Projects\SHP_Product`
- `D:\SHP_Product`

Then run `npm install` again.

### Option 3: Use the Scripts That Work (No Server)
The **fetch** and **analyze** scripts work without express/cors:

```bash
# These work without express/cors
npm run fetch
npm run analyze -- --min-rate=5 --top=50
```

### Option 4: Clean npm Cache and Retry
```powershell
npm cache clean --force
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
```

### Option 5: Use Yarn Instead
```powershell
npm install -g yarn
yarn install
```

## Current Status

✅ **Working:**
- `shopeeApi.js` - Loads successfully (uses built-in fetch)
- `fetchProducts.js` - Should work (no dependencies)
- `analyzeProducts.js` - Should work (no dependencies)

❌ **Not Working:**
- `server.js` - Needs express/cors which won't install due to Windows path issues
- Web interface (`index.html`) - Needs the server

## Quick Test

Test if fetch works:
```bash
npm run fetch -- --max-pages=1 --limit=10
```

This will try to fetch 10 products from the Shopee API. If it works, you can use the CLI tools even without the web interface.

