const fs = require('fs/promises');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'records.json');

/**
 * POC-grade "database": a single JSON file. This is intentionally simple —
 * it's the off-chain store the README describes ("invoices and detailed
 * company data remain in the application database"). It is NOT safe for
 * concurrent writers; swap this module for Postgres/Mongo before anything
 * beyond a demo, without touching trustAgent.js or routes/api.js.
 */

async function ensureDb() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify({ records: [] }, null, 2));
  }
}

async function saveRecord(record) {
  await ensureDb();
  const db = JSON.parse(await fs.readFile(DB_PATH, 'utf8'));
  db.records.push(record);
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
  return record;
}

async function getRecord(recordId) {
  await ensureDb();
  const db = JSON.parse(await fs.readFile(DB_PATH, 'utf8'));
  return db.records.find((r) => r.recordId === recordId) || null;
}

async function listRecords() {
  await ensureDb();
  const db = JSON.parse(await fs.readFile(DB_PATH, 'utf8'));
  return db.records;
}

/**
 * Mutates a stored field WITHOUT touching the stored hash — this simulates
 * someone editing the database directly after the fact. Used only by the
 * demo "tamper" endpoint so the integrity check has something real to catch.
 */
async function updateRecordField(recordId, field, value) {
  await ensureDb();
  const db = JSON.parse(await fs.readFile(DB_PATH, 'utf8'));
  const record = db.records.find((r) => r.recordId === recordId);
  if (!record) return null;

  record[field] = value;
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
  return record;
}

module.exports = { saveRecord, getRecord, listRecords, updateRecordField };
