// routes/letters.routes.js
const express = require("express");
const router = express.Router();

const lettersRepo = require("../repositories/letters.repo");
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
  console.log("Created letter with id:", id);

  return res.status(201).json({ id });
});

// GET /api/letters/:id
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  const letter = lettersRepo.getLetterById(id);
  if (!letter) return res.status(404).json({ error: "Letter not found" });

  return res.json(letter);
});

// GET /api/letters
router.get("/", (req, res) => {
  // If you don't have this function yet, you can remove this route
  // or implement it in your repo.
  if (typeof lettersRepo.getAllLetters !== "function") {
    return res.json([]);
  }
  return res.json(lettersRepo.getAllLetters());
});

// GET /api/letters/:id/pdf  (download PDF)
router.get("/:id/pdf", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const letter = lettersRepo.getLetterById(id);
    if (!letter) return res.status(404).json({ error: "Letter not found" });

    const pdfBuffer = await generateLetterPdf(letter, { letterId: id });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="letter-${id}.pdf"`
    );

    return res.status(200).send(pdfBuffer);
 } catch (err) {
  console.error("PDF generation failed:", err);
  return res.status(500).json({
    error: "Failed to generate PDF",
    details: err.message,
  });
}
});

module.exports = router;
