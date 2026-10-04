import Database from "better-sqlite3";
import { config, sqliteFilename } from "./config.js";

export type SqliteDatabase = Database.Database;

export function openDatabase(): SqliteDatabase {
  const database = new Database(sqliteFilename(config.databaseUrl));
  database.pragma("foreign_keys = ON");
  return database;
}

export function assertDatabase(database: SqliteDatabase): void {
  database.prepare("SELECT 1").get();
}
