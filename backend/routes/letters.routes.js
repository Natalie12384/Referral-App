// routes/letters.routes.js
const express = require("express");
const router = express.Router();
const lettersRepo = require("../repositories/letters.repo");

const path = require("path");
const { generateLetterPdf } = require("../pdf/generatePdf");


// POST /api/letters
router.post("/", (req, res) => {
  const letter = req.body;

  // minimal required fields check (PoC level)
  if (
    !letter.letter_date ||
    !letter.referrer_block ||
    !letter.patient_re_line ||
    !letter.greeting ||
    !letter.body_text ||
    !letter.closing_text
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const id = lettersRepo.createLetter(letter);
  
   // 👇 ADD THIS LINE
  console.log("Created letter with id:", id);
  res.status(201).json({ id });
});

// GET /api/letters
router.get("/", (req, res) => {
  const letters = lettersRepo.listLetters();
  res.json(letters);
});
router.post("/:id/pdf", async (req, res) => {
  const id = Number(req.params.id);
  const letter = lettersRepo.getLetterById(id);

  if (!letter) return res.status(404).json({ error: "Letter not found" });

  try {
    const assetsDir = path.join(__dirname, "..", "assets");
    const outDir = path.join(__dirname, "..", "storage", "pdfs");

    const { outPath, fileName } = await generateLetterPdf({
      letter,
      assetsDir,
      outDir,
    });

    // store relative path in DB
    const relative = `storage/pdfs/${fileName}`;
    lettersRepo.setPdfInfo(id, relative);

    // return a download URL
    const downloadUrl = `/downloads/${fileName}`;
    res.json({ downloadUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

module.exports = router;