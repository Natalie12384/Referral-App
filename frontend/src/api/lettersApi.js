import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

export async function createLetter(letter) {
  const res = await axios.post(`${API_BASE}/api/letters`, letter);
  return res.data; // { id }
}

export async function downloadLetterPdf(letterId) {
  const url = `${API_BASE}/api/letters/${letterId}/pdf`;

  const res = await axios.get(url, { responseType: "blob" });

  // Safety: if backend accidentally returns JSON/HTML, show it
  const contentType = res.headers?.["content-type"] || "";
  if (!contentType.includes("application/pdf")) {
    const text = await res.data.text?.().catch(() => "");
    throw new Error(`Expected PDF but got "${contentType}". ${text}`.trim());
  }

  const blob = new Blob([res.data], { type: "application/pdf" });
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `letter-${letterId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(blobUrl);
}
