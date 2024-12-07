# @i18n-google-sheets/cli

Google Sheets를 사용하여 i18n 번역을 관리하는 CLI 도구입니다.

## 설치

```bash
npm install -g @i18n-google-sheets/cli
# or
yarn global add @i18n-google-sheets/cli
```

## 설정

1. Google Cloud Console에서 서비스 계정을 생성하고 키를 다운로드합니다.
2. 프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수를 설정합니다:

```bash
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account-email@example.com
GOOGLE_SHEETS_PRIVATE_KEY=your-private-key-here
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
```

3. `i18n-sheets init` 명령어로 설정 파일을 생성합니다:

```bash
i18n-sheets init
```

생성된 `i18n-sheets.config.json` 파일을 프로젝트에 맞게 수정합니다:

```json
{
  "sourceDir": "./i18n",
  "locales": ["ko", "en"],
  "domains": ["account", "checkin"]
}
```

## 사용법

### 번역 업로드

로컬 JSON 파일의 번역을 Google Sheets로 업로드:

```bash
i18n-sheets upload
```

### 번역 다운로드

Google Sheets의 번역을 로컬 JSON 파일로 다운로드:

```bash
i18n-sheets download
```

### 옵션

- `-c, --config <path>`: 다른 설정 파일 사용
  ```bash
  i18n-sheets upload --config custom-config.json
  ```

## 보안

- 절대로 서비스 계정 키를 직접 코드나 설정 파일에 포함하지 마세요.
- 항상 환경 변수나 안전한 시크릿 관리 시스템을 사용하세요.
- `.env` 파일을 `.gitignore`에 추가하세요.

## 파일 구조

```
your-project/
├── .env                    # 환경 변수 (gitignore에 추가)
├── i18n-sheets.config.json # 설정 파일
└── i18n/                   # 번역 파일 디렉토리
    ├── ko/                 # 한국어 번역
    │   ├── account.json
    │   └── checkin.json
    └── en/                 # 영어 번역
        ├── account.json
        └── checkin.json
```
