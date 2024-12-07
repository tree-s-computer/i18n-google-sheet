import { google } from 'googleapis';
import { SheetConfig } from './types';

export class GoogleSheetClient {
  private readonly sheets: any;
  private readonly config: SheetConfig;

  constructor(config: SheetConfig) {
    this.config = config;
    
    if (config.credentials) {
      const auth = new google.auth.GoogleAuth({
        credentials: config.credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      this.sheets = google.sheets({ version: 'v4', auth });
    } else {
      throw new Error('Credentials are required');
    }
  }

  async fetchTranslations(): Promise<string[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: this.config.range,
      });

      return response.data.values || [];
    } catch (error: any) {
      throw new Error(`Failed to fetch translations: ${error.message}`);
    }
  }

  async updateSheet(values: string[][]): Promise<void> {
    try {
      // Clear existing content
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.config.spreadsheetId,
        range: this.config.range,
      });

      // Update with new values
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: this.config.range,
        valueInputOption: 'RAW',
        requestBody: { values },
      });

      // Apply formatting
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.config.spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                    textFormat: { bold: true },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: values[0]?.length || 4,
                },
              },
            },
          ],
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to update sheet: ${error.message}`);
    }
  }
}
