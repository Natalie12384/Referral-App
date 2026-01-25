// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "./api/api";

const defaultClosing =
  "Once again, thank you for your kind referral. Please do not hesitate to contact me if you require any further information.";

const DRAFT_KEY = "referral_poc_draft_v1";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return "";
  }
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
        (Draft preview — not PDF formatting yet)
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

      <div style={{ marginTop: 16 }}>{greeting || "Dear Dr ___,"}</div>

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
  // Form state
  const [letterDate, setLetterDate] = useState(todayISO());
  const [referrerBlock, setReferrerBlock] = useState("");
  const [patientReLine, setPatientReLine] = useState("");
  const [greeting, setGreeting] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [closingText, setClosingText] = useState(defaultClosing);

  // History list
  const [letters, setLetters] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // ✅ autosave indicator state
  const [lastAutosavedAt, setLastAutosavedAt] = useState(null);

  // --- Local draft helpers ---
  function buildDraftPayload() {
    return {
      letterDate,
      referrerBlock,
      patientReLine,
      greeting,
      bodyText,
      closingText,
      savedAt: new Date().toISOString(),
    };
  }

  function hasAnyContent() {
    return (
      referrerBlock.trim() ||
      patientReLine.trim() ||
      greeting.trim() ||
      bodyText.trim() ||
      closingText.trim()
    );
  }

  function saveDraftToLocal({ showMessage }) {
    const draft = buildDraftPayload();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));

    // update indicator time
    setLastAutosavedAt(draft.savedAt);

    if (showMessage) {
      setMsg(`Draft saved locally (${new Date(draft.savedAt).toLocaleString()}).`);
    }
  }

  function clearDraftLocal() {
    localStorage.removeItem(DRAFT_KEY);
    setLastAutosavedAt(null);
    setMsg("Local draft cleared.");
  }

  // Auto-restore draft on load
  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;

    try {
      const d = JSON.parse(raw);

      if (typeof d.letterDate === "string") setLetterDate(d.letterDate);
      if (typeof d.referrerBlock === "string") setReferrerBlock(d.referrerBlock);
      if (typeof d.patientReLine === "string") setPatientReLine(d.patientReLine);
      if (typeof d.greeting === "string") setGreeting(d.greeting);
      if (typeof d.bodyText === "string") setBodyText(d.bodyText);
      if (typeof d.closingText === "string") setClosingText(d.closingText);

      if (d.savedAt) {
        setLastAutosavedAt(d.savedAt);
        setMsg(`Loaded local draft (saved ${new Date(d.savedAt).toLocaleString()}).`);
      } else {
        setMsg("Loaded local draft.");
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill greeting (optional)
  useEffect(() => {
    if (greeting.trim()) return;

    const firstLine = referrerBlock.split("\n")[0]?.trim() || "";
    const parts = firstLine.split(" ").filter(Boolean);
    const surname = parts.length >= 2 ? parts[parts.length - 1] : "";
    if (surname) setGreeting(`Dear Dr ${surname},`);
  }, [referrerBlock, greeting]);

  // ✅ Auto-save while typing (debounced, silent)
  useEffect(() => {
    if (!hasAnyContent()) return;

    const t = setTimeout(() => {
      saveDraftToLocal({ showMessage: false }); // silent autosave
    }, 800);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterDate, referrerBlock, patientReLine, greeting, bodyText, closingText]);

  async function loadLetters() {
    try {
      const res = await api.get("/letters");
      setLetters(res.data || []);
    } catch (e) {
      console.error(e);
      setMsg("Could not load letters. Is the backend running?");
    }
  }

  useEffect(() => {
    loadLetters();
  }, []);

  const canSaveToDb = useMemo(() => {
    return (
      letterDate &&
      referrerBlock.trim() &&
      patientReLine.trim() &&
      greeting.trim() &&
      bodyText.trim() &&
      closingText.trim()
    );
  }, [letterDate, referrerBlock, patientReLine, greeting, bodyText, closingText]);

  async function onSaveToDb(e) {
    e.preventDefault();
    setMsg("");

    if (!canSaveToDb) {
      setMsg("Please fill in all required fields before saving to the database.");
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
      setMsg(`Saved to database. Letter id: ${res.data?.id}`);

      // optional: also save a local snapshot when DB save succeeds
      saveDraftToLocal({ showMessage: false });

      await loadLetters();
    } catch (e) {
      console.error(e);
      const err = e?.response?.data?.error || "Save failed";
      setMsg(err);
    } finally {
      setBusy(false);
    }
  }

  function onClearForm() {
    setLetterDate(todayISO());
    setReferrerBlock("");
    setPatientReLine("");
    setGreeting("");
    setBodyText("");
    setClosingText(defaultClosing);
    setMsg("");
    // keep local draft as-is unless you also click Clear Draft
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "24px auto",
        padding: 16,
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ marginBottom: 6 }}>Referral Response Letter - POC</h1>

      {/* ✅ Autosave indicator */}
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 16 }}>
        {lastAutosavedAt ? (
          <span>Autosaved ✓ {formatTime(lastAutosavedAt)}</span>
        ) : (
          <span>No local draft saved yet.</span>
        )}
      </div>

      <form onSubmit={onSaveToDb} style={{ display: "grid", gap: 12 }}>
        <label>
          Letter date (required for DB save)
          <input
            type="date"
            value={letterDate}
            onChange={(e) => setLetterDate(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Referrer block (required for DB save)
          <textarea
            rows={4}
            placeholder={"Dr Jane Smith\nClinic Name\nAddress...\nEmail..."}
            value={referrerBlock}
            onChange={(e) => setReferrerBlock(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Patient Reference Info (required for DB save)
          <textarea
            rows={2}
            placeholder={"Re: Patient Name, DOB: dd/mm/yyyy, Address..."}
            value={patientReLine}
            onChange={(e) => setPatientReLine(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Greeting (required for DB save)
          <input
            type="text"
            placeholder="Dear Dr Smith,"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Letter body (required for DB save)
          <textarea
            rows={10}
            placeholder="Type the Treatment content here...up to 10 rows"
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <label>
          Closing paragraph (required for DB save)
          <textarea
            rows={4}
            value={closingText}
            onChange={(e) => setClosingText(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => saveDraftToLocal({ showMessage: true })}
            disabled={busy}
            style={{ padding: "10px 14px" }}
          >
            Save Draft (Local)
          </button>

          <button
            type="button"
            onClick={clearDraftLocal}
            disabled={busy}
            style={{ padding: "10px 14px" }}
          >
            Clear Draft (Local)
          </button>

          <button
            type="submit"
            disabled={!canSaveToDb || busy}
            style={{ padding: "10px 14px" }}
          >
            {busy ? "Saving..." : "Save to Database"}
          </button>

          <button
            type="button"
            onClick={onClearForm}
            disabled={busy}
            style={{ padding: "10px 14px" }}
          >
            Clear Form
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
      <button
        onClick={loadLetters}
        style={{ padding: "8px 12px", marginBottom: 12 }}
      >
        Refresh list
      </button>

      <div style={{ display: "grid", gap: 8 }}>
        {letters.map((l) => (
          <div key={l.id} style={{ border: "1px solid #ddd", padding: 12 }}>
            <div>
              <b>#{l.id}</b> — {l.letter_date} — <i>{l.status}</i>
            </div>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
              {l.patient_re_line}
            </div>
          </div>
        ))}
        {!letters.length && <div>No letters yet.</div>}
      </div>
    </div>
  );
}
