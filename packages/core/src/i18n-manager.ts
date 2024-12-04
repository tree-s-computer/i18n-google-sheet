import { GoogleSheetClient } from "./sheet-client";
import { SheetConfig } from "./types";
import * as fs from "fs/promises";
import * as path from "path";

export interface I18nManagerConfig extends SheetConfig {
  sourceDir: string;
  locales: string[];
  domains: string[];
}

export class I18nManager {
  private sheetClient: GoogleSheetClient;
  private config: I18nManagerConfig;

  constructor(config: I18nManagerConfig) {
    this.config = config;
    this.sheetClient = new GoogleSheetClient(config);
  }

  private async readJsonFile(filePath: string): Promise<Record<string, any>> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      return JSON.parse(content);
    } catch (error: any) {
      throw new Error(`Failed to read file ${filePath}: ${error.message}`);
    }
  }

  private flattenObject(
    obj: Record<string, any>,
    prefix = ""
  ): Record<string, string> {
    const flattened: Record<string, string> = {};

    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        const nested = this.flattenObject(
          obj[key],
          prefix ? `${prefix}.${key}` : key
        );
        Object.assign(flattened, nested);
      } else {
        flattened[prefix ? `${prefix}.${key}` : key] = obj[key];
      }
    }

    return flattened;
  }

  async uploadToSheet(): Promise<void> {
    try {
      console.log("Reading i18n files...");
      const result: Array<[string, string, ...string[]]> = [];

      // Process each domain file
      for (const domain of this.config.domains) {
        const localizedData: Record<string, Record<string, string>> = {};

        // Read files for each locale
        for (const locale of this.config.locales) {
          const filePath = path.join(
            this.config.sourceDir,
            locale,
            `${domain}.json`
          );
          const data = await this.readJsonFile(filePath);
          localizedData[locale] = this.flattenObject(data);
        }

        // Collect all keys from all locales
        const allKeys = new Set<string>();
        Object.values(localizedData).forEach((data) => {
          Object.keys(data).forEach((key) => allKeys.add(key));
        });

        // Create rows for each key
        allKeys.forEach((key) => {
          const row: [string, string, ...string[]] = [
            domain,
            key,
            ...this.config.locales.map(
              (locale) => localizedData[locale][key] || ""
            ),
          ];
          result.push(row);
        });
      }

      // Prepare final values with header
      const values = [["Domain", "Key", ...this.config.locales], ...result];

      // Update sheet
      await this.sheetClient.updateSheet(values);
      console.log("Successfully uploaded translations to Google Sheet!");
    } catch (error: any) {
      throw new Error(`Failed to upload translations: ${error.message}`);
    }
  }

  async downloadFromSheet(): Promise<void> {
    try {
      console.log("Downloading translations from sheet...");
      const rows = await this.sheetClient.fetchTranslations();
      const headers = rows[0];
      const data = rows.slice(1);

      // Group translations by domain and locale
      const domainData: Record<
        string,
        Record<string, Record<string, string>>
      > = {};

      for (const row of data) {
        const [domain, key, ...values] = row;
        if (!domainData[domain]) {
          domainData[domain] = {};
        }

        this.config.locales.forEach((locale, index) => {
          if (!domainData[domain][locale]) {
            domainData[domain][locale] = {};
          }
          if (values[index]) {
            domainData[domain][locale][key] = values[index];
          }
        });
      }

      // Write files
      for (const domain of Object.keys(domainData)) {
        for (const locale of this.config.locales) {
          const dirPath = path.join(this.config.sourceDir, locale);
          await fs.mkdir(dirPath, { recursive: true });

          const filePath = path.join(dirPath, `${domain}.json`);
          const content = this.unflattenObject(domainData[domain][locale]);

          await fs.writeFile(
            filePath,
            JSON.stringify(content, null, 2),
            "utf8"
          );
        }
      }

      console.log("Successfully downloaded and saved translations!");
    } catch (error: any) {
      throw new Error(`Failed to download translations: ${error.message}`);
    }
  }

  private unflattenObject(
    flatObj: Record<string, string>
  ): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key in flatObj) {
      const keys = key.split(".");
      let current = result;

      keys.forEach((k, i) => {
        if (i === keys.length - 1) {
          current[k] = flatObj[key];
        } else {
          current[k] = current[k] || {};
          current = current[k];
        }
      });
    }

    return result;
  }
}
