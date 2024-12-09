import { I18nManager } from "@i18n-google-sheets/core";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
const result = dotenv.config();
console.log("Dotenv config result:", result);
console.log("Current directory:", process.cwd());

// Helper function to get environment variables safely
const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
};

// Get required environment variables
const GOOGLE_SHEETS_SPREADSHEET_ID = getEnvVar("GOOGLE_SHEETS_SPREADSHEET_ID");
const GOOGLE_SHEETS_CLIENT_EMAIL = getEnvVar("GOOGLE_SHEETS_CLIENT_EMAIL");
const GOOGLE_SHEETS_PRIVATE_KEY = getEnvVar("GOOGLE_SHEETS_PRIVATE_KEY");

async function test() {
  const manager = new I18nManager({
    spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
    range: process.env.SHEET_RANGE || "A1:D1000",
    credentials: {
      client_email: GOOGLE_SHEETS_CLIENT_EMAIL,
      private_key: GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, "\n"),
    },
    sourceDir: path.join(__dirname, "i18n"),
    locales: ["ko", "en"],
    domains: ["account", "checkin"],
  });

  try {
    console.log("Downloading translations from Google Sheet...");
    await manager.downloadFromSheet();
    console.log("Download complete!");
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
  }
}

test();
