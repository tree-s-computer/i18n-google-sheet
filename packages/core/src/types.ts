export interface SheetConfig {
  spreadsheetId: string;
  range: string;
  credentials?: {
    client_email: string;
    private_key: string;
  };
}

export interface TranslationRow {
  key: string;
  [locale: string]: string;
}

export interface TranslationData {
  [key: string]: {
    [locale: string]: string;
  };
}
