//src/app.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "./api/api";

const defaultClosing =
  "Once again, thank you for your kind referral. Please do not hesitate to contact me if you require any further information.";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function DraftPreview({
  letterDate,
  referrerBlock,
  patientReLine,
  greeting,
  bodyText,
  closingText,
}) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 16, marginTop: 24 }}>
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        (Draft preview â not PDF formatting yet)
      </div>

      <div style={{ marginTop: 12, textAlign: "right" }}>
        {letterDate || ""}
      </div>

      <div style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>
        {referrerBlock || "[Referrer block]"}
      </div>

      <div style={{ marginTop: 16, fontWeight: 600 }}>
        {patientReLine || "Re: [Patient, DOB, Address]"}
      </div>

      <div style={{ marginTop: 16 }}>
        {greeting || "Dear Dr ___,"}
      </div>

      <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
        {bodyText || "[Letter body]"}
      </div>

      <div style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>
        {closingText || "[Closing paragraph]"}
      </div>

      <div style={{ marginTop: 24 }}>
        Kind regards,
        <div style={{ marginTop: 24, opacity: 0.7 }}>[Signature block]</div>
      </div>
    </div>
  );
}

export default function App() {
  // Form state (minimum fields for PoC)
  const [letterDate, setLetterDate] = useState(todayISO());
  const [referrerBlock, setReferrerBlock] = useState("");
  const [patientReLine, setPatientReLine] = useState("");
  const [greeting, setGreeting] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [closingText, setClosingText] = useState(defaultClosing);

  // Simple history list (optional but useful)
  const [letters, setLetters] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Helper: if greeting empty, try auto-fill from referrerBlock
  useEffect(() => {
    if (greeting.trim()) return;
    // crude guess: take last word of first line as surname
    const firstLine = referrerBlock.split("\n")[0]?.trim() || "";
    const parts = firstLine.split(" ").filter(Boolean);
    const surname = parts.length >= 2 ? parts[parts.length - 1] : "";
    if (surname) setGreeting(`Dear Dr ${surname},`);
  }, [referrerBlock, greeting]);

  async function loadLetters() {
    try {
      const res = await api.get("/letters");
      setLetters(res.data || []);
    } catch (e) {
      console.error(e);
      setMsg("Could not load letters. Is the backend running on :3000?");
    }
  }

  useEffect(() => {
    loadLetters();
  }, []);

  const canSave = useMemo(() => {
    return (
      letterDate &&
      referrerBlock.trim() &&
      patientReLine.trim() &&
      greeting.trim() &&
      bodyText.trim() &&
      closingText.trim()
    );
  }, [letterDate, referrerBlock, patientReLine, greeting, bodyText, closingText]);

  async function onSave(e) {
    e.preventDefault();
    setMsg("");

    if (!canSave) {
      setMsg("Please fill in all required fields before saving.");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        letter_date: letterDate,
        referrer_block: referrerBlock,
        patient_re_line: patientReLine,
        greeting,
        body_text: bodyText,
        closing_text: closingText,
        status: "draft",
      };

      const res = await api.post("/letters", payload);
      setMsg(`Saved draft. Letter id: ${res.data?.id}`);
      await loadLetters();
    } catch (e) {
      console.error(e);
      const err = e?.response?.data?.error || "Save failed";
      setMsg(err);
    } finally {
      setBusy(false);
    }
  }

  function onClear() {
    setLetterDate(todayISO());
    setReferrerBlock("");
    setPatientReLine("");
    setGreeting("");
    setBodyText("");
    setClosingText(defaultClosing);
    setMsg("");
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>Referral Response Letter - POC</h1>

      <form onSubmit={onSave} style={{ display: "grid", gap: 12 }}>
        <label>
          Letter date (required)
          <input
            type="date"
            value={letterDate}
            onChange={(e) => setLetterDate(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Referrer block (required)
          <textarea
            rows={4}
            placeholder={"Dr Jane Smith\nClinic Name\nAddress...\nEmail..."}
            value={referrerBlock}
            onChange={(e) => setReferrerBlock(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Patient Reference Info   (required)
          <textarea
            rows={2}
            placeholder={"Re: Patient Name, DOB: dd/mm/yyyy, Address..."}
            value={patientReLine}
            onChange={(e) => setPatientReLine(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Greeting (required)
          <input
            type="text"
            placeholder="Dear Dr Smith,"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Letter body (required)
          <textarea
            rows={10}
            placeholder="Type the Treatment content here...up to 10 rows"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Closing paragraph (required)
          <textarea
            rows={4}
            value={closingText}
            onChange={(e) => setClosingText(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={!canSave || busy} style={{ padding: "10px 14px" }}>
            {busy ? "Saving..." : "Save Draft"}
          </button>

          <button type="button" onClick={onClear} style={{ padding: "10px 14px" }}>
            Clear
          </button>
        </div>

        {msg && <div style={{ padding: 10, background: "#f5f5f5" }}>{msg}</div>}
      </form>

      <hr style={{ margin: "24px 0" }} />
<DraftPreview
  letterDate={letterDate}
  referrerBlock={referrerBlock}
  patientReLine={patientReLine}
  greeting={greeting}
  bodyText={bodyText}
  closingText={closingText}
/>


      <h2>History (latest)</h2>
      <button onClick={loadLetters} style={{ padding: "8px 12px", marginBottom: 12 }}>
        Refresh list
      </button>

      <div style={{ display: "grid", gap: 8 }}>
        {letters.map((l) => (
          <div key={l.id} style={{ border: "1px solid #ddd", padding: 12 }}>
            <div>
              <b>#{l.id}</b> â {l.letter_date} â <i>{l.status}</i>
            </div>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{l.patient_re_line}</div>
          </div>
        ))}
        {!letters.length && <div>No letters yet.</div>}
      </div>
    </div>
  );
}