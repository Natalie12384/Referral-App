// pdf/generatePdf.js
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const { renderLetterHtml } = require("./renderLetterHtml");

function safeFileName(s) {
  return String(s).replace(/[^a-zA-Z0-9-_]/g, "_");
}

async function generateLetterPdf({ letter, assetsDir, outDir }) {
  const letterheadPath = path.join(assetsDir, "letterhead.png");
  const letterheadFileUrl = `file://${letterheadPath}`;

  const html = renderLetterHtml({ letter, letterheadFileUrl });

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const fileName = `letter_${letter.id}_${safeFileName(letter.letter_date)}.pdf`;
  const outPath = path.join(outDir, fileName);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
    });
  } finally {
    await browser.close();
  }

  return { outPath, fileName };
}

module.exports = { generateLetterPdf };
