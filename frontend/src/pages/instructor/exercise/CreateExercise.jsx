import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, Loader2, Sun, Moon, Terminal, Play, CheckCircle2, XCircle, Lock } from "lucide-react"
import Editor from "@monaco-editor/react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const LANG_OPTIONS = [
  { value: "python", label: "Python only", icon: "🐍" },
  { value: "cpp",    label: "C++ only",    icon: "⚙️" },
  { value: "both",   label: "Both",        icon: "🔓" },
]

const S = {
  page:   { minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif" },
  card:   { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px 30px" },
  label:  { fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8 },
  input:  { width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" },
  h1:     { fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginBottom: 4 },
}

function CreateExercise() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("details")
  const [title, setTitle]                       = useState("")
  const [problemStatement, setProblemStatement] = useState("")
  const [aiMode, setAiMode]                     = useState("beginner")
  const [solution, setSolution]                 = useState("")
  const [dueDate, setDueDate]                   = useState("")
  const [languageLock, setLanguageLock]         = useState("both")
  const [loading, setLoading]                   = useState(false)
  const [error, setError]                       = useState("")
  const [availableModes, setAvailableModes]     = useState([])
  const modeToTypeIdMap = Object.fromEntries(availableModes.map((m) => [m.value, m.typeId]))

  useEffect(() => {
    const fetchModes = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/exercises/types/course/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) return
        const data = await res.json()
        const modes = (data.types || []).map((t) => ({ value: t.name.toLowerCase(), typeId: t.typeId, label: t.isSystemPresent ? `${t.name} — System` : `${t.name} — Custom` }))
        setAvailableModes(modes)
        if (modes.length > 0) setAiMode((prev) => (modes.some((m) => m.value === prev) ? prev : modes[0].value))
      } catch { setError("Failed to load exercise modes.") }
    }
    fetchModes()
  }, [id])

  const [testCases, setTestCases] = useState([{ input: "", output: "", isVisible: true }])
  const addTestCase    = () => setTestCases([...testCases, { input: "", output: "", isVisible: true }])
  const removeTestCase = (i) => { if (testCases.length > 1) setTestCases(testCases.filter((_, idx) => idx !== i)) }
  const updateTestCase = (i, field, value) => { const u = [...testCases]; u[i][field] = value; setTestCases(u) }
  const toggleVisible  = (i) => { const u = [...testCases]; u[i].isVisible = !u[i].isVisible; setTestCases(u) }

  // Preview state
  const editorRef = useRef(null); const monacoRef = useRef(null); const chatEndRef = useRef(null)
  const defaultLang = languageLock === "both" ? "python" : languageLock
  const [previewCode, setPreviewCode]     = useState("")
  const [previewLang, setPreviewLang]     = useState(defaultLang)
  const [previewDark, setPreviewDark]     = useState(true)
  const [previewStdin, setPreviewStdin]   = useState("")
  const [showStdin, setShowStdin]         = useState(false)
  const [previewOutput, setPreviewOutput] = useState("")
  const [previewRunning, setPreviewRunning] = useState(false)
  const [previewJudging, setPreviewJudging] = useState(false)
  const [testResults, setTestResults]     = useState(null)
  const [hintLoading, setHintLoading]     = useState(false)
  const [chatMessages, setChatMessages]   = useState([])
  const [chatInput, setChatInput]         = useState("")
  const [chatBusy, setChatBusy]           = useState(false)

  useEffect(() => { if (languageLock !== "both") setPreviewLang(languageLock) }, [languageLock])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [chatMessages])

  const editorBg = previewDark ? "#1e1e1e" : "#ffffff"
  const isLocked = languageLock !== "both"
  const monacoLang = previewLang === "cpp" ? "cpp" : "python"

  const runPreview = async () => {
    if (!previewCode.trim()) return
    setPreviewRunning(true); setPreviewOutput("Running..."); setTestResults(null)
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API_BASE_URL}/sandbox/run`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ code: previewCode, language: previewLang, stdin: previewStdin }) })
      const data = await res.json()
      const err = data.compile_output || data.stderr || ""
      setPreviewOutput(err && !data.stdout ? err : data.stdout || "No output")
    } catch { setPreviewOutput("Error: Could not reach server") }
    finally { setPreviewRunning(false) }
  }

  const runAgainstTestCases = async () => {
    const valid = testCases.filter((tc) => tc.output.trim())
    if (!valid.length) { setPreviewOutput("No test cases defined yet."); return }
    if (!previewCode.trim()) { setPreviewOutput("Write some code first."); return }
    setPreviewJudging(true); setPreviewOutput("Judging..."); setTestResults(null)
    const token = localStorage.getItem("token"); const results = []; let passed = 0
    for (const tc of valid) {
      try {
        const res = await fetch(`${API_BASE_URL}/sandbox/run`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ code: previewCode, language: previewLang, stdin: tc.input || "" }) })
        const data = await res.json(); const got = (data.stdout || "").trim(); const ok = got === tc.output.trim()
        if (ok) passed++
        results.push({ input: tc.input, expected: tc.output, got, passed: ok, error: data.compile_output || data.stderr || "" })
        if ((data.compile_output || "").trim()) { setPreviewOutput(data.compile_output); break }
      } catch { results.push({ input: tc.input, expected: tc.output, got: "", passed: false, error: "Network error" }) }
    }
    setTestResults({ passed, total: valid.length, results }); setPreviewOutput(`Passed ${passed}/${valid.length} test cases`); setPreviewJudging(false)
  }

  const getPreviewHint = async () => {
    if (hintLoading || !problemStatement.trim()) return
    setHintLoading(true)
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 300, messages: [{ role: "user", content: `You are a helpful programming tutor. The exercise problem is:\n"${problemStatement}"\nGive a short pedagogical hint. Do NOT reveal the full solution. 2-3 sentences.` }] }) })
      const data = await res.json()
      setChatMessages((prev) => [...prev, { role: "hint", text: (data.content || []).map((b) => b.text || "").join("") || "Could not generate hint." }])
    } catch { setChatMessages((prev) => [...prev, { role: "hint", text: "Could not reach AI." }]) }
    finally { setHintLoading(false) }
  }

  const sendPreviewChat = async () => {
    const msg = chatInput.trim(); if (!msg || chatBusy) return
    setChatBusy(true); setChatInput(""); setChatMessages((prev) => [...prev, { role: "user", text: msg }])
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 400, messages: [{ role: "user", content: `${problemStatement ? `Exercise: "${problemStatement}"\n\n` : ""}${previewCode.trim() ? `Code:\n\`\`\`\n${previewCode}\n\`\`\`\n\n` : ""}Student asks: "${msg}"\nAnswer helpfully, pedagogically, concisely.` }] }) })
      const data = await res.json()
      setChatMessages((prev) => [...prev, { role: "ai", text: (data.content || []).map((b) => b.text || "").join("") || "No response." }])
    } catch { setChatMessages((prev) => [...prev, { role: "ai", text: "Network error." }]) }
    finally { setChatBusy(false) }
  }

  const saveExercise = async () => {
    if (!title.trim())             { setError("Exercise title is required"); return }
    if (title.trim().length > 100) { setError("Title must be under 100 characters"); return }
    if (!problemStatement.trim())  { setError("Problem statement is required"); return }
    if (!solution.trim())          { setError("Canonical solution is required"); return }
    if (!dueDate)                  { setError("Due date is required"); return }
    const valid = testCases.filter((tc) => tc.output.trim())
    if (!valid.length) { setError("At least one test case is required"); return }
    const typeId = modeToTypeIdMap[aiMode]
    if (!typeId) { setError("Invalid exercise mode selected"); return }
    setLoading(true); setError("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/exercises/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ courseId: id, typeId, title: title.trim(), difficultyLevel: "Easy", exerciseType: "coding", problem: problemStatement.trim(), referenceSolution: solution.trim(), dueDate, languageLock, testCases: valid.map((tc) => ({ input: tc.input, expectedOutput: tc.output, isVisible: tc.isVisible })) }) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || `Failed: ${res.status}`) }
      navigate(`/instructor/course/${id}/exercises`)
    } catch (err) { setError(err.message || "Failed to create exercise.") }
    finally { setLoading(false) }
  }

  const btnPrimary = { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 20px", borderRadius: 10, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        .ce-input::placeholder{color:rgba(255,255,255,0.2);}
        .ce-input:focus{border-color:rgba(178,152,218,0.5)!important;box-shadow:0 0 0 3px rgba(142,125,165,0.12);}
        option{background:#1e0f38;color:rgba(255,255,255,0.8);}
      `}</style>

      {/* Tab bar */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "28px 40px 0" }}>
        <h1 style={S.h1}>Create Exercise</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>Configure and preview your exercise before publishing</p>
        <div style={{ display: "flex", gap: 4 }}>
          {[["details", "Exercise Details"], ["preview", "Preview & Test"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "10px 24px", borderRadius: "10px 10px 0 0", fontSize: 13, fontWeight: 500, cursor: "pointer",
              background: activeTab === tab ? "rgba(142,125,165,0.15)" : "transparent",
              color: activeTab === tab ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
              border: activeTab === tab ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
              borderBottom: activeTab === tab ? "1px solid #120b22" : "1px solid transparent",
              fontFamily: "'DM Sans',sans-serif", transition: "all 0.2s",
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "32px 40px" }}>

        {/* ── DETAILS TAB ── */}
        {activeTab === "details" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

            <div style={S.card}>
              <label style={S.label}>Exercise Title</label>
              <input className="ce-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sum of a List" style={S.input} />
            </div>

            <div style={S.card}>
              <label style={S.label}>Problem Statement</label>
              <textarea className="ce-input" value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} rows={5} placeholder="Describe what the student needs to solve..." style={{ ...S.input, resize: "none" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={S.card}>
                <label style={S.label}>AI Assistance Mode</label>
                <select className="ce-input" value={aiMode} onChange={(e) => setAiMode(e.target.value)} style={{ ...S.input, cursor: "pointer" }}>
                  {availableModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div style={S.card}>
                <label style={S.label}>Due Date</label>
                <input className="ce-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ ...S.input, colorScheme: "dark" }} />
              </div>
            </div>

            {/* Language Lock */}
            <div style={S.card}>
              <label style={S.label}>Allowed Language</label>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 14 }}>Controls which language(s) students can use in the code editor.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {LANG_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setLanguageLock(opt.value)} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "18px 12px",
                    borderRadius: 12, border: languageLock === opt.value ? "2px solid rgba(178,152,218,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    background: languageLock === opt.value ? "rgba(142,125,165,0.15)" : "rgba(255,255,255,0.03)",
                    color: languageLock === opt.value ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                    cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500,
                  }}>
                    <span style={{ fontSize: 22 }}>{opt.icon}</span>
                    <span>{opt.label}</span>
                    {languageLock === opt.value && opt.value !== "both" && (
                      <span style={{ fontSize: 10, color: "#b298da", display: "flex", alignItems: "center", gap: 4 }}>
                        <Lock size={10} /> Locked
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <label style={S.label}>Canonical Solution</label>
              <textarea className="ce-input" value={solution} onChange={(e) => setSolution(e.target.value)} rows={5} placeholder="Write the reference solution here..." style={{ ...S.input, resize: "none", fontFamily: "monospace", fontSize: 12 }} />
            </div>

            {/* Test Cases */}
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <label style={{ ...S.label, marginBottom: 2 }}>Test Cases</label>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>At least 1 required</p>
                </div>
                <button onClick={addTestCase} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(142,125,165,0.12)", border: "1px solid rgba(142,125,165,0.2)", color: "rgba(178,152,218,0.8)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                  <Plus size={13} /> Add Case
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {testCases.map((tc, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Case {i + 1}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={() => toggleVisible(i)} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 99, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, background: tc.isVisible ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", border: tc.isVisible ? "1px solid rgba(34,197,94,0.2)" : "1px solid rgba(255,255,255,0.1)", color: tc.isVisible ? "#4ade80" : "rgba(255,255,255,0.3)" }}>
                          {tc.isVisible ? "👁 Visible" : "🔒 Hidden"}
                        </button>
                        {testCases.length > 1 && (
                          <button onClick={() => removeTestCase(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", padding: 4, borderRadius: 6, transition: "all 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.1)" }}
                            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.2)"; e.currentTarget.style.background = "transparent" }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ ...S.label, fontSize: 10 }}>Input</label>
                        <textarea className="ce-input" value={tc.input} onChange={(e) => updateTestCase(i, "input", e.target.value)} placeholder={"e.g.\n3\n1 2 3"} rows={3} style={{ ...S.input, fontFamily: "monospace", fontSize: 11, resize: "none" }} />
                      </div>
                      <div>
                        <label style={{ ...S.label, fontSize: 10 }}>Expected Output</label>
                        <input className="ce-input" value={tc.output} onChange={(e) => updateTestCase(i, "output", e.target.value)} placeholder="e.g. 6" style={{ ...S.input, fontFamily: "monospace", fontSize: 11 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", color: "#f87171", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={saveExercise} disabled={loading} style={{ ...btnPrimary, flex: 1, opacity: loading ? 0.6 : 1 }}
                onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = "0 6px 24px rgba(110,92,134,0.45)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><Plus size={14} /> Create Exercise</>}
              </button>
              <button onClick={() => setActiveTab("preview")} style={{ padding: "11px 24px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.9)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)" }}
              >
                Preview →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── PREVIEW TAB ── */}
        {activeTab === "preview" && (
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", height: "calc(100vh - 200px)", display: "grid", gridTemplateColumns: "1fr 2fr 1fr" }}>

            {/* Left */}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
                <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#fbbf24", marginBottom: 14 }}>👁 Instructor preview — testing as a student would</div>
                {isLocked && <span style={{ fontSize: 10, background: "rgba(142,125,165,0.12)", border: "1px solid rgba(142,125,165,0.2)", borderRadius: 99, padding: "2px 10px", color: "#b298da", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 12 }}><Lock size={10} /> Locked to {languageLock === "cpp" ? "C++" : "Python"}</span>}
                <h2 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 6 }}>{title || <span style={{ color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>No title set</span>}</h2>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 14 }}>{problemStatement || <span style={{ fontStyle: "italic" }}>No problem statement yet</span>}</p>
                {testCases.some((tc) => tc.output.trim() && tc.isVisible) && (
                  <div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Visible Test Cases</p>
                    {testCases.filter((tc) => tc.output.trim() && tc.isVisible).map((tc, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 10px", marginBottom: 6, fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                        {tc.input && <p>in: {tc.input}</p>}
                        <p>out: {tc.output}</p>
                      </div>
                    ))}
                  </div>
                )}
                {testResults && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Results — {testResults.passed}/{testResults.total}</p>
                    {testResults.results.map((r, i) => (
                      <div key={i} style={{ background: r.passed ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${r.passed ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`, borderRadius: 8, padding: "8px 10px", marginBottom: 6, fontSize: 11, fontFamily: "monospace" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          {r.passed ? <CheckCircle2 size={12} color="#4ade80" /> : <XCircle size={12} color="#f87171" />}
                          <span style={{ color: r.passed ? "#4ade80" : "#f87171", fontWeight: 600 }}>Case {i + 1} — {r.passed ? "Passed" : "Failed"}</span>
                        </div>
                        {!r.passed && <p style={{ color: "#f87171" }}>got: {r.got || r.error || "no output"}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <button onClick={() => setActiveTab("details")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(178,152,218,0.6)", fontFamily: "'DM Sans',sans-serif" }}>← Back to Details</button>
              </div>
            </div>

            {/* Middle: Monaco */}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: editorBg }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: previewDark ? "#2d2d2d" : "#f3f3f3", borderBottom: `1px solid ${previewDark ? "#3e3e3e" : "#d1d5db"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isLocked ? <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 6, background: previewDark ? "#3c3c3c" : "#f3f0ff", color: "#a78bfa", border: `1px solid ${previewDark ? "#6E5C86" : "#c4b5fd"}`, display: "flex", alignItems: "center", gap: 4 }}><Lock size={10} />{previewLang === "cpp" ? "C++" : "Python"}</span>
                    : <select value={previewLang} onChange={(e) => setPreviewLang(e.target.value)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: previewDark ? "#3c3c3c" : "#fff", color: previewDark ? "#d4d4d4" : "#111", border: `1px solid ${previewDark ? "#555" : "#d1d5db"}` }}><option value="python">Python</option><option value="cpp">C++</option></select>}
                  <button type="button" onClick={() => setPreviewDark((d) => !d)} style={{ padding: 4, borderRadius: 6, background: previewDark ? "#3c3c3c" : "#e5e7eb", color: previewDark ? "#d4d4d4" : "#374151", border: "none", cursor: "pointer" }}>{previewDark ? <Sun size={12} /> : <Moon size={12} />}</button>
                  <button type="button" onClick={() => setShowStdin((s) => !s)} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, display: "flex", alignItems: "center", gap: 4, background: showStdin ? "#6E5C86" : (previewDark ? "#3c3c3c" : "#e5e7eb"), color: showStdin ? "#fff" : (previewDark ? "#d4d4d4" : "#374151"), border: "none", cursor: "pointer" }}><Terminal size={11} />stdin</button>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={runPreview} disabled={previewRunning || previewJudging} style={{ padding: "4px 12px", borderRadius: 6, background: "#3b82f6", color: "white", fontSize: 11, border: "none", cursor: "pointer", opacity: (previewRunning || previewJudging) ? 0.4 : 1, display: "flex", alignItems: "center", gap: 4 }}>{previewRunning ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} />}Run</button>
                  <button type="button" onClick={runAgainstTestCases} disabled={previewRunning || previewJudging} style={{ padding: "4px 12px", borderRadius: 6, background: "#16a34a", color: "white", fontSize: 11, border: "none", cursor: "pointer", opacity: (previewRunning || previewJudging) ? 0.4 : 1, display: "flex", alignItems: "center", gap: 4 }}>{previewJudging ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}Test All</button>
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                <Editor height="100%" language={monacoLang} value={previewCode} onChange={(v) => setPreviewCode(v || "")} theme={previewDark ? "vs-dark" : "light"} onMount={(e, m) => { editorRef.current = e; monacoRef.current = m }} options={{ fontSize: 13, fontFamily: "'Fira Code', Consolas, monospace", minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, tabSize: previewLang === "python" ? 4 : 2, wordWrap: "on", padding: { top: 8, bottom: 8 } }} />
              </div>
              {showStdin && (
                <div style={{ padding: "10px 12px", background: previewDark ? "#252526" : "#f9fafb", borderTop: `1px solid ${previewDark ? "#3e3e3e" : "#e5e7eb"}` }}>
                  <label style={{ fontSize: 10, color: previewDark ? "#9cdcfe" : "#6E5C86", display: "block", marginBottom: 6 }}>stdin — one value per line</label>
                  <textarea value={previewStdin} onChange={(e) => setPreviewStdin(e.target.value)} rows={3} placeholder={"e.g.\n5\nhello"} style={{ width: "100%", fontSize: 11, fontFamily: "monospace", resize: "none", borderRadius: 6, padding: "6px 8px", outline: "none", background: previewDark ? "#1e1e1e" : "#fff", color: previewDark ? "#d4d4d4" : "#111", border: `1px solid ${previewDark ? "#555" : "#d1d5db"}` }} />
                </div>
              )}
            </div>

            {/* Right */}
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Output</p>
                <div style={{ background: "#111", color: "#4ade80", borderRadius: 8, padding: "10px 12px", height: 80, overflowY: "auto", fontFamily: "monospace", fontSize: 11, whiteSpace: "pre-wrap" }}>{previewOutput || "Run your code to see output..."}</div>
              </div>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>AI Help</p>
                  <span style={{ fontSize: 9, color: "#fbbf24", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 99, padding: "1px 8px" }}>Preview</span>
                </div>
                <button type="button" onClick={getPreviewHint} disabled={hintLoading || !problemStatement.trim()} style={{ width: "100%", padding: "8px", borderRadius: 8, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: (hintLoading || !problemStatement.trim()) ? "not-allowed" : "pointer", opacity: (hintLoading || !problemStatement.trim()) ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {hintLoading ? <Loader2 size={12} className="animate-spin" /> : null}{hintLoading ? "Generating..." : "Get Hint"}
                </button>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
                <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
                  {chatMessages.length === 0 ? <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", padding: 4 }}>Ask a question or get a hint.</p>
                    : chatMessages.map((m, i) => (
                      <div key={i} style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, fontSize: 11, background: m.role === "user" ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)", border: m.role === "user" ? "1px solid rgba(139,92,246,0.2)" : "1px solid rgba(255,255,255,0.07)", color: m.role === "user" ? "rgba(196,181,253,0.9)" : "rgba(255,255,255,0.6)", marginLeft: m.role === "user" ? 12 : 0, marginRight: m.role !== "user" ? 12 : 0 }}>
                        {m.role === "hint" && <span style={{ fontSize: 10, fontWeight: 700, color: "#b298da", display: "block", marginBottom: 4 }}>💡 Hint</span>}
                        <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
                      </div>
                    ))}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ padding: 8, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 6 }}>
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendPreviewChat()} placeholder="Ask the AI..." disabled={chatBusy} style={{ flex: 1, padding: "7px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans',sans-serif", fontSize: 11, outline: "none" }} />
                  <button type="button" onClick={sendPreviewChat} disabled={chatBusy || !chatInput.trim()} style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(139,92,246,0.3)", border: "1px solid rgba(139,92,246,0.3)", color: "rgba(196,181,253,0.9)", fontSize: 11, cursor: "pointer", opacity: (chatBusy || !chatInput.trim()) ? 0.4 : 1 }}>
                    {chatBusy ? <Loader2 size={11} className="animate-spin" /> : "Ask"}
                  </button>
                </div>
              </div>
              <div style={{ padding: 10, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 8 }}>
                {testResults && (
                  <div style={{ padding: "8px 10px", borderRadius: 8, fontSize: 11, display: "flex", alignItems: "center", gap: 6, background: testResults.passed === testResults.total ? "rgba(34,197,94,0.08)" : "rgba(251,191,36,0.08)", border: `1px solid ${testResults.passed === testResults.total ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)"}`, color: testResults.passed === testResults.total ? "#4ade80" : "#fbbf24" }}>
                    {testResults.passed === testResults.total ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {testResults.passed === testResults.total ? "All cases pass ✓" : `${testResults.passed}/${testResults.total} passed`}
                  </div>
                )}
                <button onClick={saveExercise} disabled={loading} style={{ ...btnPrimary, width: "100%", opacity: loading ? 0.6 : 1 }}>
                  {loading ? <><Loader2 size={13} className="animate-spin" />Creating...</> : <><Plus size={13} />Create Exercise</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateExercise