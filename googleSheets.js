import { google } from 'googleapis';
import { findCredentialsFile } from './paths.js';

let cachedCredentialsPath = null;

function resolveCredentialsPath() {
  if (!cachedCredentialsPath) {
    cachedCredentialsPath = findCredentialsFile();
  }
  return cachedCredentialsPath;
}

function getCredentials() {
  // For Vercel: use environment variable
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
    } catch (error) {
      console.error('Failed to parse GOOGLE_CREDENTIALS_JSON:', error);
    }
  }

  // For local: use file
  return resolveCredentialsPath();
}

function stripQuotes(value) {
  if (!value) {
    return value;
  }
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  return trimmed;
}

function extractSheetTitle(range) {
  if (!range || !range.includes('!')) {
    return null;
  }
  const [rawTitle] = range.split('!');
  if (!rawTitle) {
    return null;
  }
  return stripQuotes(rawTitle);
}

function getSheetTitle(range) {
  return extractSheetTitle(range) || stripQuotes(range);
}

async function ensureSheetExists({ sheetsClient, spreadsheetId, range }) {
  const desiredTitle = getSheetTitle(range);
  if (!desiredTitle) {
    return;
  }

  const metadata = await sheetsClient.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });

  const sheetExists =
    metadata.data.sheets?.some((sheet) => sheet.properties?.title === desiredTitle) ?? false;

  if (sheetExists) {
    return;
  }

  await sheetsClient.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: desiredTitle,
            },
          },
        },
      ],
    },
  });
}

function sanitizeLimit(limit, fallback = 1000) {
  if (Number.isFinite(limit) && limit > 0) {
    return Math.floor(limit);
  }
  const parsed = Number.parseInt(limit, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

function headersMatch(a = [], b = []) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

async function readSheetValues({ sheetsClient, spreadsheetId, title }) {
  try {
    const { data } = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: title,
    });
    return data.values || [];
  } catch (error) {
    if (error.code === 400) {
      return [];
    }
    throw error;
  }
}

async function clearAndWrite({ sheetsClient, spreadsheetId, clearTitle, range, values }) {
  await sheetsClient.spreadsheets.values.clear({
    spreadsheetId,
    range: clearTitle,
  });

  await sheetsClient.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });
}

export async function uploadToGoogleSheet({
  spreadsheetId,
  range,
  values,
  historyLimit = 1000,
  categoryRange,
  categoryValues,
  categoryTabs = [],
}) {
  if (!spreadsheetId) {
    throw new Error('Missing GOOGLE_SHEETS_ID. Please set it in your .env file.');
  }

  const credentials = getCredentials();

  const authConfig = {
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  };

  // If credentials is a string (file path), use keyFile
  // If it's an object (parsed JSON), use credentials directly
  if (typeof credentials === 'string') {
    authConfig.keyFile = credentials;
  } else {
    authConfig.credentials = credentials;
  }

  const auth = new google.auth.GoogleAuth(authConfig);

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const limit = sanitizeLimit(historyLimit, 1000);
  const mainTitle = getSheetTitle(range);
  await ensureSheetExists({ sheetsClient: sheets, spreadsheetId, range });

  const existingValues = await readSheetValues({
    sheetsClient: sheets,
    spreadsheetId,
    title: mainTitle,
  });

  const newHeader = values[0] || [];
  const newBody = values.slice(1);
  const existingBody = existingValues.slice(1);
  const filteredExistingBody =
    existingValues.length > 0 && headersMatch(existingValues[0], newHeader)
      ? existingBody
      : existingValues;

  const mergedBody = [...newBody, ...filteredExistingBody];
  const trimmedBody = mergedBody.slice(0, limit);
  const mergedRows = [newHeader, ...trimmedBody];

  await clearAndWrite({
    sheetsClient: sheets,
    spreadsheetId,
    clearTitle: mainTitle,
    range,
    values: mergedRows,
  });

  if (categoryRange && Array.isArray(categoryValues) && categoryValues.length > 0) {
    const categoryTitle = getSheetTitle(categoryRange);
    await ensureSheetExists({ sheetsClient: sheets, spreadsheetId, range: categoryRange });
    await clearAndWrite({
      sheetsClient: sheets,
      spreadsheetId,
      clearTitle: categoryTitle,
      range: categoryRange,
      values: categoryValues,
    });
  }

  if (Array.isArray(categoryTabs) && categoryTabs.length > 0) {
    for (const tab of categoryTabs) {
      if (!tab || !tab.sheetTitle || !Array.isArray(tab.values) || tab.values.length === 0) {
        continue;
      }
      const sheetRange = tab.range || `${tab.sheetTitle}!A1`;
      await ensureSheetExists({
        sheetsClient: sheets,
        spreadsheetId,
        range: sheetRange,
      });
      await clearAndWrite({
        sheetsClient: sheets,
        spreadsheetId,
        clearTitle: tab.sheetTitle,
        range: sheetRange,
        values: tab.values,
      });
    }
  }
}

