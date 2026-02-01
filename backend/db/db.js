function populate_db(){

}




// db/db.js
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "app.db");
const SCHEMA_FILE = path.join(__dirname, "referral_schema.sql");


// Create/connect to SQLite DB file (auto-creates app.db if missing)
const db = new Database(DB_FILE);

// Apply schema once at startup
const schema = fs.readFileSync(SCHEMA_FILE, "utf8");
db.exec(schema);
db.pragma("foreign_keys = ON");
module.exports = db;