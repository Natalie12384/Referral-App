// db/db.js
const Database = require("better-sqlite3");
const reader = require("xlsx");
const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "app.db");
const SCHEMA_FILE = path.join(__dirname, "referral_schema.sql");


// Create/connect to SQLite DB file (auto-creates app.db if missing)
const db = new Database(DB_FILE);

//query
function recommendation(
    db, params
){
  const whereClauses = [];
  const values = [];

  let practitionerScore = 0;
  let practiceScore = 0;

  // --- Practitioner filters ---
  if (params.first_name) {
    whereClauses.push("p.first_name LIKE ?");
    values.push(`%${params.first_name}%`);
    practitionerScore += 1;
  }

  if (params.last_name) {
    whereClauses.push("p.last_name LIKE ?");
    values.push(`%${params.last_name}%`);
    practitionerScore += 1;
  }

  if (params.speciality) {
    whereClauses.push("p.speciality LIKE ?");
    values.push(`%${params.speciality}%`);
    practitionerScore += 2;
  }

  // --- Practice filters ---
  if (params.practice_name) {
    whereClauses.push("pr.practice_name LIKE ?");
    values.push(`%${params.practice_name}%`);
    practiceScore += 1;
  }

  if (params.street_name) {
    whereClauses.push("pr.street_name LIKE ?");
    values.push(`%${params.street_name}%`);
    practiceScore += 1;
  }

  if (params.street_no) {
    whereClauses.push("pr.street_no = ?");
    values.push(params.street_no);
    practiceScore += 1;
  }

  if (params.suburb) {
    whereClauses.push("pr.suburb LIKE ?");
    values.push(`%${params.suburb}%`);
    practiceScore += 2;
  }

  if (params.post_code) {
    whereClauses.push("pr.post_code = ?");
    values.push(params.post_code);
    practiceScore += 2;
  }

  const whereSQL =
    whereClauses.length > 0
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

  // --- Ranking logic ---
  const sql = `
    SELECT
      p.ahpra_no,
      p.first_name,
      p.last_name,
      p.speciality,
      pr.practice_id,
      pr.practice_name,
      pr.street_name,
      pr.street_no,
      pr.suburb,
      c.practitioner_email,
      c.practitioner_phone_no,

      (
        ${practitionerScore} +
        ${practiceScore} +
        CASE
          WHEN p.ahpra_no IS NOT NULL AND pr.practice_id IS NOT NULL THEN 3
          ELSE 1
        END
      ) AS score

    FROM contact_details c
    JOIN practitioner p ON p.ahpra_no = c.ahpra_no
    JOIN practice pr ON pr.practice_id = c.practice_id
    ${whereSQL}
    ORDER BY score DESC
    LIMIT 10
  `;

  const stmt = db.prepare(sql);
  return stmt.all(values);
}

//street type abreviateion
const STREET_TYPE_MAP = {
  street: "st",
  st: "st",

  road: "rd",
  rd: "rd",

  avenue: "ave",
  ave: "ave",

  court: "ct",
  ct: "ct",

  drive: "dr",
  dr: "dr",

  boulevard: "blvd",
  blvd: "blvd",

  place: "pl",
  pl: "pl",

  terrace: "tce",
  tce: "tce"
};


const results = recommendation(db, {
  first_name:"Andrew",
  speciality: "Cardiologist",
  practice_name: "Heart"
});

console.log(results)
