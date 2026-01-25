// pdf/generatePdf.js
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function generateLetterPdf(letter, { letterId } = {}) {
  // ✅ Path: backend/asset/letterhead.png
  const logoPath = path.join(__dirname, "..", "asset", "letterhead.jpg");

  if (!fs.existsSync(logoPath)) {
    throw new Error(`Letterhead not found at ${logoPath}`);
  }

  const logoBase64 = fs.readFileSync(logoPath).toString("base64");
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;

  // Escape user text to avoid breaking HTML
  const letter_date = escapeHtml(letter.letter_date);
  const referrer_block = escapeHtml(letter.referrer_block).replaceAll("\n", "<br/>");
  const patient_re_line = escapeHtml(letter.patient_re_line);
  const greeting = escapeHtml(letter.greeting);
  const body_text = escapeHtml(letter.body_text).replaceAll("\n", "<br/>");
  const closing_text = escapeHtml(letter.closing_text).replaceAll("\n", "<br/>");

  const html = `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { margin-bottom: 20px; }
          .letterhead {
    width: 650px;          /* try 650–750 */
    max-width: 100%;
    height: auto;
    display: block;
  }
          .title { font-size: 18px; font-weight: bold; margin: 12px 0; }
          .block { margin-top: 12px; }
        </style>
      </head>
      <body>
      <div class="header">
  <img src="${logoDataUrl}" class="letterhead" />
</div>


        <div class="title">Referral Letter</div>

        <div class="block"><b>Date:</b> ${letter_date}</div>
        <div class="block">${referrer_block}</div>
        <div class="block"><b>${patient_re_line}</b></div>
        <div class="block">${greeting}</div>

        <div class="block">${body_text}</div>

        <div class="block">${closing_text}</div>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { generateLetterPdf };
