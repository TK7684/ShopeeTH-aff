import { google } from "googleapis";

function getCredentials() {
  // For Vercel: use environment variable
  if (
    process.env.GOOGLE_CREDENTIALS_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_BASE64
  ) {
    try {
      const credentialsJson =
        process.env.GOOGLE_CREDENTIALS_JSON ||
        process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
      return JSON.parse(credentialsJson);
    } catch (error) {
      console.error("Failed to parse credentials:", error);
    }
  }

  // For local: this would need to be handled differently in Nuxt
  // You might want to use runtime config instead
  throw new Error(
    "No credentials environment variable set (GOOGLE_CREDENTIALS_JSON or GOOGLE_SERVICE_ACCOUNT_BASE64)",
  );
}

function stripQuotes(value?: string) {
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

function extractSheetTitle(range: string) {
  if (!range || !range.includes("!")) {
    return null;
  }
  const [rawTitle] = range.split("!");
  if (!rawTitle) {
    return null;
  }
  return stripQuotes(rawTitle);
}

function getSheetTitle(range: string) {
  return extractSheetTitle(range) || stripQuotes(range);
}

async function ensureSheetExists({ sheetsClient, spreadsheetId, range }: any) {
  const desiredTitle = getSheetTitle(range);
  if (!desiredTitle) {
    return;
  }

  const metadata = await sheetsClient.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });

  const sheetExists =
    metadata.data.sheets?.some(
      (sheet: any) => sheet.properties?.title === desiredTitle,
    ) ?? false;

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

function sanitizeLimit(limit: any, fallback = 1000) {
  if (Number.isFinite(limit) && limit > 0) {
    return Math.floor(limit);
  }
  const parsed = Number.parseInt(limit, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

function headersMatch(a: any[] = [], b: any[] = []) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

async function readSheetValues({ sheetsClient, spreadsheetId, title }: any) {
  try {
    const { data } = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: title,
    });
    return data.values || [];
  } catch (error: any) {
    if (error.code === 400) {
      return [];
    }
    throw error;
  }
}

async function clearAndWrite({
  sheetsClient,
  spreadsheetId,
  clearTitle,
  range,
  values,
}: any) {
  await sheetsClient.spreadsheets.values.clear({
    spreadsheetId,
    range: clearTitle,
  });

  await sheetsClient.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
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
}: any) {
  // Use SHEET_ID if spreadsheetId is not provided
  if (!spreadsheetId) {
    spreadsheetId = process.env.SHEET_ID || process.env.GOOGLE_SHEETS_ID;
    if (!spreadsheetId) {
      throw new Error(
        "Missing SHEET_ID or GOOGLE_SHEETS_ID. Please set it in your environment variables.",
      );
    }
  }

  const credentials = getCredentials();

  const authConfig: any = {
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  };

  // If credentials is a string (file path), use keyFile
  // If it's an object (parsed JSON), use credentials directly
  if (typeof credentials === "string") {
    authConfig.keyFile = credentials;
  } else {
    authConfig.credentials = credentials;
  }

  const auth = new google.auth.GoogleAuth(authConfig);

  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client as any });

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

  if (
    categoryRange &&
    Array.isArray(categoryValues) &&
    categoryValues.length > 0
  ) {
    const categoryTitle = getSheetTitle(categoryRange);
    await ensureSheetExists({
      sheetsClient: sheets,
      spreadsheetId,
      range: categoryRange,
    });
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
      if (
        !tab ||
        !tab.sheetTitle ||
        !Array.isArray(tab.values) ||
        tab.values.length === 0
      ) {
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
