#!/usr/bin/env node

import { Command } from "commander";
import { I18nManager } from "@i18n-google-sheets/core";
import * as fs from "fs/promises";
import * as path from "path";
import chalk from "chalk";
import ora from "ora";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const program = new Command();

// Validate required environment variables
function validateEnv() {
  const required = [
    "GOOGLE_SHEETS_CLIENT_EMAIL",
    "GOOGLE_SHEETS_PRIVATE_KEY",
    "GOOGLE_SHEETS_SPREADSHEET_ID",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(chalk.red("Missing required environment variables:"));
    missing.forEach((key) => {
      console.error(chalk.red(`- ${key}`));
    });
    console.error(chalk.yellow("\nPlease add them to your .env file:"));
    console.error(
      chalk.yellow("GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account-email")
    );
    console.error(chalk.yellow("GOOGLE_SHEETS_PRIVATE_KEY=your-private-key"));
    console.error(
      chalk.yellow("GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id")
    );
    process.exit(1);
  }
}

async function loadConfig(configPath: string) {
  try {
    const fullPath = path.resolve(process.cwd(), configPath);
    const configContent = await fs.readFile(fullPath, "utf-8");
    return JSON.parse(configContent);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error loading config file: ${error.message}`));
    } else {
      console.error(chalk.red("Unknown error loading config file"));
    }
    process.exit(1);
  }
}

program
  .name("i18n-sheets")
  .description("CLI tool for managing i18n translations with Google Sheets")
  .version("0.1.0");

program
  .command("upload")
  .description("Upload translations from local files to Google Sheet")
  .option(
    "-c, --config <path>",
    "Path to config file",
    "i18n-sheets.config.json"
  )
  .action(async (options) => {
    validateEnv();
    const spinner = ora("Loading configuration...").start();

    try {
      const config = await loadConfig(options.config);
      const manager = new I18nManager({
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
        range: "A1:D1000",
        credentials: {
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,
          private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY!,
        },
        ...config,
      });

      spinner.text = "Uploading translations to Google Sheet...";
      await manager.uploadToSheet();
      spinner.succeed(
        chalk.green("Successfully uploaded translations to Google Sheet!")
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        spinner.fail(chalk.red(`Error: ${error.message}`));
      } else {
        spinner.fail(chalk.red("Unknown error occurred"));
      }
      process.exit(1);
    }
  });

program
  .command("download")
  .description("Download translations from Google Sheet to local files")
  .option(
    "-c, --config <path>",
    "Path to config file",
    "i18n-sheets.config.json"
  )
  .action(async (options) => {
    validateEnv();
    const spinner = ora("Loading configuration...").start();

    try {
      const config = await loadConfig(options.config);
      const manager = new I18nManager({
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
        range: "A1:D1000",
        credentials: {
          client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,
          private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY!,
        },
        ...config,
      });

      spinner.text = "Downloading translations from Google Sheet...";
      await manager.downloadFromSheet();
      spinner.succeed(
        chalk.green("Successfully downloaded translations from Google Sheet!")
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        spinner.fail(chalk.red(`Error: ${error.message}`));
      } else {
        spinner.fail(chalk.red("Unknown error occurred"));
      }
      process.exit(1);
    }
  });

program
  .command("init")
  .description("Create a new configuration file")
  .option(
    "-c, --config <path>",
    "Path to config file",
    "i18n-sheets.config.json"
  )
  .action(async (options) => {
    try {
      const configTemplate = {
        sourceDir: "./i18n",
        locales: ["ko", "en"],
        domains: [],
      };

      await fs.writeFile(
        path.resolve(process.cwd(), options.config),
        JSON.stringify(configTemplate, null, 2)
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(
          chalk.red(`Error creating config file: ${error.message}`)
        );
      } else {
        console.error(chalk.red("Unknown error creating config file"));
      }
      process.exit(1);
    }
  });

program.parse();
