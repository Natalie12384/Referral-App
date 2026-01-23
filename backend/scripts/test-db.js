// scripts/test-db.js
const db = require("../db/db");

// 1) Insert a dummy letter
const insertStmt = db.prepare(`
  INSERT INTO letters (
    letter_date, referrer_block, patient_re_line, greeting, body_text, closing_text, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const letterDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const dummy = {
  letter_date: letterDate,
  referrer_block:
    "Dr Catherine Wiering\nHampstead Medical\n237 Hampstead Rd, Northfield SA 5085\nreception@hampstead.example",
  patient_re_line:
    "Re: Weizhou Wan, DOB: 15/11/1987, 25A Corconda Street, Clearview SA 5085, Ph: 0421 718 906",
  greeting: "Dear Dr Wiering,",
  body_text:
    "Thank you for your referral. This is a dummy PoC letter body.\n\nClinical notes go here.",
  closing_text:
    "Once again, thank you for your kind referral. Please do not hesitate to contact me if you require any further information.",
  status: "draft",
};

const info = insertStmt.run(
  dummy.letter_date,
  dummy.referrer_block,
  dummy.patient_re_line,
  dummy.greeting,
  dummy.body_text,
  dummy.closing_text,
  dummy.status
);

console.log("Inserted letter id:", info.lastInsertRowid);

// 2) Read it back
const row = db
  .prepare("SELECT * FROM letters WHERE id = ?")
  .get(info.lastInsertRowid);

console.log("\nFetched letter row:\n", row);

// 3) List latest 5 letters
const rows = db
  .prepare("SELECT id, letter_date, status, created_at FROM letters ORDER BY id DESC LIMIT 5")
  .all();

console.log("\nLatest letters:\n", rows);