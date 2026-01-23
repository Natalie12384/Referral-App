
// repositories/letters.repo.js
const db = require("../db/db");

function createLetter(letter) {
  const stmt = db.prepare(`
    INSERT INTO letters (
      letter_date,
      referrer_block,
      patient_re_line,
      greeting,
      body_text,
      closing_text,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    letter.letter_date,
    letter.referrer_block,
    letter.patient_re_line,
    letter.greeting,
    letter.body_text,
    letter.closing_text,
    letter.status || "draft"
  );

  return result.lastInsertRowid;
}

function listLetters() {
  return db
    .prepare(`
      SELECT
        id,
        letter_date,
        patient_re_line,
        status,
        created_at
      FROM letters
      ORDER BY id DESC
    `)
    .all();
}

function getLetterById(id) {
  return db.prepare(`SELECT * FROM letters WHERE id = ?`).get(id);
}

function setPdfInfo(id, pdfPath) {
  db.prepare(`
    UPDATE letters
    SET pdf_path = ?, pdf_generated_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(pdfPath, id);
}
module.exports = {
  createLetter,
  listLetters,
  getLetterById,
  setPdfInfo,
};