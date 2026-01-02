import { openDatabaseSync } from "expo-sqlite";

const db = openDatabaseSync("totals.db");

// SQL to create the totals table if it doesn't exist
const totalsTable = `
  CREATE TABLE IF NOT EXISTS totals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    total REAL,
    count INTEGER,
    time TEXT
  );
`;

const deleteTotalsTable = `
  CREATE TABLE IF NOT EXISTS deleteTotals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total REAL,
    count INTEGER,
    time TEXT
  );
`;

// Initialize database and create tables
export async function createTable() {
  await db.execAsync(totalsTable);
  await db.execAsync(deleteTotalsTable);
}

// Insert into totals
export async function insertTotal(name: string, total: number, count: number, time: string) {
  await db.runAsync(
    "INSERT INTO totals (name, total, count, time) VALUES (?, ?, ?, ?);",
    [name, total, count, time]
  );
}

// Insert into deleteTotals
export async function insertDeleteTotals(total: number, count: number, time: string) {
  await db.runAsync(
    "INSERT INTO deleteTotals (total, count, time) VALUES (?, ?, ?);",
    [total, count, time]
  );
}

// Fetch all totals
export async function getTotals() {
  return await db.getAllAsync("SELECT * FROM totals ORDER BY id DESC;");
}

// Fetch all deleteTotals
export async function getDeleteTotals() {
  return await db.getAllAsync("SELECT * FROM deleteTotals ORDER BY id DESC;");
}

// Delete one record by id (totals)
export async function deleteTotal(id: number) {
  await db.runAsync("DELETE FROM totals WHERE id = ?;", [id]);
}

// Delete one record by id (deleteTotals)
export async function deleteDeleteTotal(id: number) {
  await db.runAsync("DELETE FROM deleteTotals WHERE id = ?;", [id]);
}

// Clear all totals
export async function clearAllTotals() {
  await db.runAsync("DELETE FROM totals;");
}

// Clear all deleteTotals
export async function clearDeleteAllTotals() {
  await db.runAsync("DELETE FROM deleteTotals;");
}
