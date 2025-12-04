const { google } = require("googleapis");

// Copy your credentials JSON here for testing
const credentials = {
  type: "service_account",
  project_id: "shopee-affiliate-479306",
  private_key_id: "849c7f14e377c6b13a6b08089e30c512ede4686a",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCzIsC25EbFkMlH\ntQ/KpCZShPAdglLKNbW5ldlEhG/oUX9Wc0qjB2BfbzqRfQvpDZ2bBlvRXpJMGaX4\nHLmYeRdvCbf9hPlZIKkQMK8P1w0cMccvlMlDnw5C/9Hgb/YTLwxbhzkFBflKdHtm\nJR4elUUiFRx34h59HMS170uDp/p56BUYwassbytQSTMXSb1o2/17FhmkKGH8m5Qv\nMn8W/b1d/GKYOFKoq0mcfPAMDtSAz055aXaj5SPjwJOzFEq6eW5VCX6IYWEMA6vx\nhm5Btll0P3HOSAfwFya37KQB06caWTsnegdJmVyPwPTWYyEHwU8sLzW9bPqCYryL\n4VM5Vnt1AgMBAAECggEAIHvdlvzDwalM+rIgdDZ6lY2yTiOXGECPnOEJxmU+ttHq\nhbZ/8xrQFNZCeGYE3iTgLt/DEC82V9Lx2BF7bWUOBQ5t3Sz7G3iy97LgV/6/C50S\nOfRg3+CMsUUbHbgn1xg5xTI6+oh4CZKgWuhBszmN0Q2jfTDVpwnruPM1DiGMqATJ\n+qnHVl8OhBePpVS8xfLkUuNlIOpEbrq90o7oZTxxkSJ4tR729hRTbCphl2cCa3yh\n/QkU1qCmjwJ39UmibXrz2kyftY93Nvtl7Ov2mC28r9uksBGkPXGvThk0JGhag8iU\nMY6fu1GGCXepXThdqhAwINTUut3FjmspCunWjkWL+QKBgQDwNwO3kn5RfgNf4FlG\n1S8yR1zcSPDbSov0fNtvdCzg2zuMCL/GxnwAZ1P5eOoMEeI8nM0JHzzSdOCkEfTh\njF1kSwy7GRguQlepD4mKWJDaJe2YjMqXFnig+RUAorBW7PHj5NalLql0X9wga4zi\nSukb2Bkstpo6u8ioNeqQ8+WaLQKBgQC+6D3qoxI3EHR02cbIxhPfdff0zfaZYI0U\nAb8W6e6TgZg4ahJhag3zeARgHWBQzgdo4l3MuxY0wihR/cpjigyx3ERP4lrUSbyf\nF5Ag+2wfa0OMvLmamEwjcoAchvkSnuQaI8z3rr3LcM8i1x5/F+FmWoL3pORUDirl\nU3veErWbaQKBgQDRo4GX9L5PCoWRZ+8iFS0iWQteqD2jc/Seg1TSePYtqsbWGFCd\n/lz70TGFOBQyQm1J7qI2AtAG77+ZEJ7BNMnQnHrY0ja7MGTmg0vKtC5+Y7lud/ja\nUN8nxRmiO1lgE1urQuxcrlNu37XxiUsjtrKn/TlDP31sIrQksSEsLd7EZQKBgEuz\nxHm62IpFWCjOAumywkamfQDye4suokMAvknT0etkRHx6c3d1mrqlKPcELyFb0cxh\nl1iMB648H8kDnrICGC6fbedPlzz/UHC1401w5ds/qbWxUNhg9DBKQ0sMqtAbedBz\nyd+dx11ZCoqCS3GSgqsX0T9qf7BlPdVaWZAiUymhAoGBAJt9+BhEFDf6o58t5eEf\nd9hjr/1a2o36wi2cneYWuZ9vw8c3OaveXXptMXDtIuX+mNk3Ddg5IBuw+iYrGlHl\nxECok31G2gZjJE8RX7djhZDnCAmMRIHrnNUpF0yuAMwy/BAGCeSxvHPNJ88ECC4k\nwNZyQnLeM/0O7ZoWFkKRfamY\n-----END PRIVATE KEY-----\n",
  client_email:
    "shopee-affiliate-product-analy@shopee-affiliate-479306.iam.gserviceaccount.com",
  client_id: "111877884186236255602",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/shopee-affiliate-product-analy%40shopee-affiliate-479306.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

async function testCredentials() {
  try {
    console.log("Testing Google Service Account credentials...");

    // Set up auth client
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Create sheets client
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: authClient });

    // Test by getting spreadsheet metadata
    // Replace with your actual spreadsheet ID
    const spreadsheetId = "1l3PESURRNXpZDTxQbZYM2KxpdPvWcZdnGVKQC_jKtFo";

    console.log("Attempting to access spreadsheet:", spreadsheetId);

    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    console.log(
      "✅ Success! Credentials are valid and have access to the spreadsheet.",
    );
    console.log("Spreadsheet title:", response.data.properties.title);
    console.log(
      "Sheets:",
      response.data.sheets.map((s) => s.properties.title),
    );
  } catch (error) {
    console.error("❌ Error accessing Google Sheets:", error.message);

    if (error.message.includes("Forbidden")) {
      console.log("\nPossible solution:");
      console.log("1. Share your Google Sheet with the service account email:");
      console.log("   " + credentials.client_email);
      console.log('2. Give it "Editor" permissions');
    }
  }
}

testCredentials();
