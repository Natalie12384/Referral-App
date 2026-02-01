-- db/schema.sql
CREATE TABLE IF NOT EXISTS letters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  letter_date TEXT NOT NULL,          -- ISO date like 2026-01-18
  referrer_block TEXT NOT NULL,       -- snapshot block exactly as printed
  patient_re_line TEXT NOT NULL,      -- snapshot "Re:" line exactly as printed
  greeting TEXT NOT NULL,             -- e.g., "Dear Dr Smith,"
  body_text TEXT NOT NULL,
  closing_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

