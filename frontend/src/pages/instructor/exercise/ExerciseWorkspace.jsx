import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "react-router-dom"
import Editor from "@monaco-editor/react"
import { Loader2, LifeBuoy, X, CheckCircle, MessageSquare, Sun, Moon, Terminal, Lock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000"
const LINT_DEBOUNCE_MS = 1200

function parseCppErrors(errorText, monacoInstance) {
  const markers = []
  for (const line of errorText.split("\n")) {
    const match = line.match(/code:(\d+):(\d+):\s*(error|warning|note):\s*(.+)/)
    if (match) markers.push({ startLineNumber: parseInt(match[1]), startColumn: parseInt(match[2]), endLineNumber: parseInt(match[1]), endColumn: parseInt(match[2]) + 10, message: match[4].trim(), severity: match[3] === "error" ? monacoInstance.MarkerSeverity.Error : match[3] === "warning" ? monacoInstance.MarkerSeverity.Warning : monacoInstance.MarkerSeverity.Info })
  }
  return markers
}

function parsePythonErrors(errorText, monacoInstance) {
  const markers = []
  const lineMatches = [...errorText.matchAll(/line (\d+)/g)]
  const errorMatch  = errorText.match(/(SyntaxError|IndentationError|NameError|TypeError|ValueError|AttributeError|ImportError|KeyError|IndexError|ZeroDivisionError):\s*(.+)/)
  if (lineMatches.length > 0 && errorMatch) {
    const lineNum = parseInt(lineMatches[lineMatches.length - 1][1])
    markers.push({ startLineNumber: lineNum, startColumn: 1, endLineNumber: lineNum, endColumn: 200, message: `${errorMatch[1]}: ${errorMatch[2].trim()}`, severity: monacoInstance.MarkerSeverity.Error })
  }
  return markers
}

function ExerciseWorkspace() {
  const { id } = useParams()
  const editorRef = useRef(null); const monacoRef = useRef(null); const lintTimerRef = useRef(null)

  const [code, setCode]             = useState("")
  const [output, setOutput]         = useState("")
  const [language, setLanguage]     = useState("python")
  const [languageLock, setLanguageLock] = useState("both")
  const [stdin, setStdin]           = useState("")
  const [showStdin, setShowStdin]   = useState(false)
  const [darkMode, setDarkMode]     = useState(true)
  const [isLinting, setIsLinting]   = useState(false)
  const [lintClean, setLintClean]   = useState(true)
  const [submissions, setSubmissions] = useState([])
  const [score, setScore]           = useState(0)
  const [testCases, setTestCases]   = useState([])
  const [problem, setProblem]       = useState("")
  const [userRole, setUserRole]     = useState(null)
  const [aiAssistant, setAiAssistant] = useState(null)
  const [coolLeft, setCoolLeft]     = useState(0)
  const [chatInput, setChatInput]   = useState("")
  const [chatMessages, setChatMessages] = useState([])
  const [hintLoading, setHintLoading] = useState(false)
  const [chatBusy, setChatBusy]     = useState(false)
  const [hintError, setHintError]   = useState("")
  const [showHelpModal, setShowHelpModal]   = useState(false)
  const [helpMessage, setHelpMessage]       = useState("")
  const [helpSending, setHelpSending]       = useState(false)
  const [helpSent, setHelpSent]             = useState(false)
  const [helpError, setHelpError]           = useState("")
  const [helpRequest, setHelpRequest]       = useState(null)
  const [showReplyModal, setShowReplyModal] = useState(false)

  useEffect(() => { try { const u = JSON.parse(localStorage.getItem("user") || "{}"); setUserRole(u.role || null) } catch { setUserRole(null) } }, [])

  const applyMarkers = useCallback((errorText) => {
    if (!editorRef.current || !monacoRef.current) return
    const model = editorRef.current.getModel(); if (!model) return
    const markers = errorText ? language === "cpp" ? parseCppErrors(errorText, monacoRef.current) : parsePythonErrors(errorText, monacoRef.current) : []
    monacoRef.current.editor.setModelMarkers(model, "sandbox", markers); setLintClean(markers.length === 0)
  }, [language])

  const clearMarkers = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return
    const model = editorRef.current.getModel(); if (model) monacoRef.current.editor.setModelMarkers(model, "sandbox", []); setLintClean(true)
  }, [])

  const runLint = useCallback(async (currentCode, currentLanguage) => {
    if (!currentCode.trim()) { clearMarkers(); return }
    setIsLinting(true); const token = localStorage.getItem("token")
    try { const res = await fetch(`${API_BASE_URL}/sandbox/lint`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ code: currentCode, language: currentLanguage }) }); if (!res.ok) return; const data = await res.json(); applyMarkers(data.errors || "") }
    catch {} finally { setIsLinting(false) }
  }, [applyMarkers, clearMarkers])

  useEffect(() => {
    if (lintTimerRef.current) clearTimeout(lintTimerRef.current)
    lintTimerRef.current = setTimeout(() => runLint(code, language), LINT_DEBOUNCE_MS)
    return () => clearTimeout(lintTimerRef.current)
  }, [code, language, runLint])

  useEffect(() => { clearMarkers() }, [language, clearMarkers])

  const loadExercise = useCallback(async () => {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_BASE_URL}/exercises/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return null
    const data = await res.json(); setProblem(data.problem || "")
    const lock = data.languageLock || "both"; setLanguageLock(lock); if (lock !== "both") setLanguage(lock)
    if (data.testCases) setTestCases(data.testCases.filter((tc) => tc.isVisible).map((tc) => ({ input: tc.input, expected: tc.expectedOutput })))
    if (data.aiAssistant) { setAiAssistant(data.aiAssistant); setCoolLeft(data.aiAssistant.secondsUntilNextAiResponse || 0) } else { setAiAssistant(null); setCoolLeft(0) }
    return data
  }, [id])

  const loadHelpRequest = useCallback(async () => {
    const token = localStorage.getItem("token")
    try { const res = await fetch(`${API_BASE_URL}/exercises/${id}/my-help-request`, { headers: { Authorization: `Bearer ${token}` } }); if (!res.ok) return; const data = await res.json(); setHelpRequest(data.request || null) } catch {}
  }, [id])

  useEffect(() => { const saved = localStorage.getItem(`code-${id}`); if (saved) setCode(saved) }, [id])
  useEffect(() => { localStorage.setItem(`code-${id}`, code) }, [code, id])
  useEffect(() => {
    const token = localStorage.getItem("token")
    loadExercise().catch(() => setProblem("Failed to load problem."))
    fetch(`${API_BASE_URL}/sandbox/attempts/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(data => setSubmissions(data.attempts || [])).catch(() => {})
  }, [id, loadExercise])
  useEffect(() => { if (userRole === "student") loadHelpRequest() }, [userRole, loadHelpRequest])
  useEffect(() => { if (userRole !== "student" || helpRequest?.reply) return; const i = setInterval(() => loadHelpRequest(), 10000); return () => clearInterval(i) }, [userRole, helpRequest?.reply, loadHelpRequest])
  useEffect(() => { if (helpRequest?.reply) setShowReplyModal(true) }, [helpRequest?.reply])
  useEffect(() => { if (coolLeft <= 0) return undefined; const t = setTimeout(() => setCoolLeft((c) => Math.max(0, c - 1)), 1000); return () => clearTimeout(t) }, [coolLeft])

  const hintsUsed = aiAssistant?.hintsUsed ?? 0; const hintLimit = aiAssistant?.hintLimit; const atHintLimit = hintLimit != null && hintsUsed >= hintLimit
  const getHintDisabled = userRole !== "student" || !aiAssistant?.enableAdaptiveHints || atHintLimit || coolLeft > 0 || hintLoading
  const isLocked = languageLock !== "both"; const editorBg = darkMode ? "#1e1e1e" : "#ffffff"; const monacoLang = language === "cpp" ? "cpp" : "python"
  const handleEditorDidMount = (editor, monaco) => { editorRef.current = editor; monacoRef.current = monaco }

  const handleRun = async () => {
    setOutput("Running..."); clearMarkers(); const token = localStorage.getItem("token")
    try { const res = await fetch(`${API_BASE_URL}/sandbox/run`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ code, language, stdin }) }); const data = await res.json(); const err = data.compile_output || data.stderr || ""; if (err && !data.stdout) { setOutput(err); applyMarkers(err) } else { setOutput(data.stdout || "No output"); clearMarkers() } }
    catch { setOutput("Error: Could not reach server") }
  }

  const handleSubmit = async () => {
    setOutput("Judging..."); clearMarkers(); const token = localStorage.getItem("token")
    try { const res = await fetch(`${API_BASE_URL}/sandbox/submit`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ code, language, exercise_id: id }) }); const data = await res.json(); setScore(data.score ?? 0); setOutput(`Passed ${data.passed ?? 0}/${data.total ?? 0} test cases — Score: ${data.score ?? 0}%`); setSubmissions((prev) => [{ attemptNumber: data.attempt_id?.slice(0, 8) ?? "?", status: data.status, score: data.score ?? 0, passedTestCases: data.passed ?? 0 }, ...prev]) }
    catch { setOutput("Error: Could not reach server") }
  }

  const handleGetHint = async () => {
    if (getHintDisabled) return; setHintError(""); setHintLoading(true); const token = localStorage.getItem("token")
    try { const res = await fetch(`${API_BASE_URL}/exercises/${id}/hint`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: null }) }); const data = await res.json().catch(() => ({})); if (!res.ok) { setHintError(typeof data.detail === "string" ? data.detail : "Could not get hint."); await loadExercise(); return }; setChatMessages((prev) => [...prev, { role: "hint", text: data.hint || "" }]); setCoolLeft(data.secondsUntilNextAiResponse ?? aiAssistant?.cooldownSeconds ?? 0); await loadExercise() }
    catch { setHintError("Network error. Try again.") } finally { setHintLoading(false) }
  }

  const handleChat = async () => {
    const msg = chatInput.trim(); if (!msg || chatBusy) return
    if (userRole !== "student") { setChatMessages((prev) => [...prev, { role: "user", text: msg }, { role: "ai", text: "Sign in as a student to use AI chat." }]); setChatInput(""); return }
    setChatBusy(true); setChatInput(""); setChatMessages((prev) => [...prev, { role: "user", text: msg }]); const token = localStorage.getItem("token")
    try { const res = await fetch(`${API_BASE_URL}/chat`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: msg, exercise_id: id }) }); const data = await res.json().catch(() => ({})); if (!res.ok) { setChatMessages((prev) => [...prev, { role: "ai", text: typeof data.detail === "string" ? data.detail : "Chat failed." }]); await loadExercise(); return }; setChatMessages((prev) => [...prev, { role: "ai", text: data.response || "" }]); const cd = aiAssistant?.cooldownSeconds ?? 0; if (cd > 0) setCoolLeft(cd); await loadExercise() }
    catch { setChatMessages((prev) => [...prev, { role: "ai", text: "Network error." }]) } finally { setChatBusy(false) }
  }

  const openHelpModal = () => { setHelpMessage(""); setHelpError(""); setHelpSent(false); setShowHelpModal(true) }

  const handleSendHelpRequest = async () => {
    if (!helpMessage.trim() || helpSending) return; setHelpSending(true); setHelpError(""); const token = localStorage.getItem("token")
    try { const res = await fetch(`${API_BASE_URL}/exercises/${id}/help-request`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: helpMessage.trim(), code_snapshot: code, language }) }); const data = await res.json().catch(() => ({})); if (!res.ok) { setHelpError(typeof data.detail === "string" ? data.detail : "Could not send request."); return }; setHelpSent(true); await loadHelpRequest() }
    catch { setHelpError("Network error. Please try again.") } finally { setHelpSending(false) }
  }

  const hasReply = helpRequest?.reply

  // Panel styles
  const leftRight = { display: "flex", flexDirection: "column", overflow: "hidden", background: "rgba(255,255,255,0.03)", fontFamily: "'DM Sans', sans-serif" }
  const secLabel = { fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, display: "block" }

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap'); .ew-input::placeholder{color:rgba(255,255,255,0.2);} .ew-input:focus{border-color:rgba(178,152,218,0.5)!important;box-shadow:0 0 0 3px rgba(142,125,165,0.12);}`}</style>
      <div className="grid grid-cols-4 overflow-hidden" style={{ height: "calc(100vh - 57px)", background: "#120b22" }}>

        {/* LEFT */}
        <div style={{ ...leftRight, borderRight: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            <div style={{ marginBottom: 18 }}>
              <span style={secLabel}>Problem</span>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{problem || "Loading..."}</p>
            </div>
            {testCases.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <span style={secLabel}>Test Cases</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {testCases.map((tc, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 10px", fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                      <p><span style={{ color: "rgba(255,255,255,0.25)" }}>in:</span> {tc.input}</p>
                      <p><span style={{ color: "rgba(255,255,255,0.25)" }}>out:</span> {tc.expected}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <span style={secLabel}>Submissions</span>
              {submissions.length === 0
                ? <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No submissions yet.</p>
                : submissions.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 12 }}>
                    <span style={{ color: "rgba(255,255,255,0.35)" }}>#{s.attemptNumber}</span>
                    <span style={{ color: s.status === "Passed" ? "#4ade80" : "#f87171", fontWeight: 500 }}>{s.status} · {s.score}%</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* MIDDLE: Editor — unchanged from previous version */}
        <div className="col-span-2 flex flex-col overflow-hidden" style={{ background: editorBg }}>
          <div className="flex items-center justify-between px-3 py-1.5 shrink-0 border-b" style={{ background: darkMode ? "#2d2d2d" : "#f3f3f3", borderColor: darkMode ? "#3e3e3e" : "#d1d5db" }}>
            <div className="flex items-center gap-2">
              {isLocked
                ? <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border font-medium" style={{ background: darkMode ? "#3c3c3c" : "#f3f0ff", color: "#a78bfa", borderColor: darkMode ? "#6E5C86" : "#c4b5fd" }}><Lock size={11} />{language === "cpp" ? "C++" : "Python"}</span>
                : <select value={language} onChange={(e) => setLanguage(e.target.value)} className="text-xs px-2 py-1 rounded border" style={{ background: darkMode ? "#3c3c3c" : "#fff", color: darkMode ? "#d4d4d4" : "#111", borderColor: darkMode ? "#555" : "#d1d5db" }}><option value="python">Python</option><option value="cpp">C++</option></select>
              }
              <button type="button" onClick={() => setDarkMode((d) => !d)} className="p-1 rounded" style={{ background: darkMode ? "#3c3c3c" : "#e5e7eb", color: darkMode ? "#d4d4d4" : "#374151" }}>{darkMode ? <Sun size={13} /> : <Moon size={13} />}</button>
              <button type="button" onClick={() => setShowStdin((s) => !s)} className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium" style={{ background: showStdin ? "#6E5C86" : (darkMode ? "#3c3c3c" : "#e5e7eb"), color: showStdin ? "#fff" : (darkMode ? "#d4d4d4" : "#374151") }}><Terminal size={12} />stdin</button>
              <div className="flex items-center gap-1 text-xs" style={{ color: darkMode ? "#9cdcfe" : "#6b7280" }}>
                {isLinting ? <><Loader2 size={11} className="animate-spin opacity-60" /><span className="opacity-60">checking...</span></> : lintClean ? <span className="text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />no errors</span> : <span className="text-red-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />errors found</span>}
              </div>
              <span className="text-xs font-medium" style={{ color: darkMode ? "#9cdcfe" : "#6E5C86" }}>🏆 {score}%</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleRun} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition">▶ Run</button>
              <button type="button" onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition">Submit</button>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <Editor height="100%" language={monacoLang} value={code} onChange={(v) => setCode(v || "")} theme={darkMode ? "vs-dark" : "light"} onMount={handleEditorDidMount} options={{ fontSize: 13, fontFamily: "'Fira Code', Consolas, monospace", fontLigatures: true, minimap: { enabled: false }, scrollBeyondLastLine: false, automaticLayout: true, tabSize: language === "python" ? 4 : 2, insertSpaces: true, wordWrap: "on", lineNumbers: "on", renderLineHighlight: "line", cursorBlinking: "smooth", cursorSmoothCaretAnimation: "on", smoothScrolling: true, bracketPairColorization: { enabled: true }, formatOnType: true, formatOnPaste: true, autoIndent: "full", quickSuggestions: true, parameterHints: { enabled: true }, padding: { top: 8, bottom: 8 } }} />
          </div>
          {showStdin && (
            <div className="shrink-0 border-t px-3 py-2" style={{ background: darkMode ? "#252526" : "#f9fafb", borderColor: darkMode ? "#3e3e3e" : "#e5e7eb" }}>
              <label className="text-xs font-semibold block mb-1" style={{ color: darkMode ? "#9cdcfe" : "#6E5C86" }}>stdin — one value per line</label>
              <textarea value={stdin} onChange={(e) => setStdin(e.target.value)} rows={3} placeholder={"e.g.\n5\nhello"} className="w-full text-xs font-mono resize-none rounded px-2 py-1.5 outline-none" style={{ background: darkMode ? "#1e1e1e" : "#fff", color: darkMode ? "#d4d4d4" : "#111", border: `1px solid ${darkMode ? "#555" : "#d1d5db"}` }} />
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div style={{ ...leftRight, borderLeft: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Output */}
          <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
            <span style={secLabel}>Output</span>
            <div style={{ background: "#0d1117", color: "#4ade80", borderRadius: 8, padding: "10px 12px", height: 88, overflowY: "auto", fontFamily: "monospace", fontSize: 11, whiteSpace: "pre-wrap" }}>{output || "Run your code to see output..."}</div>
          </div>

          {/* AI Help */}
          <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
            <span style={secLabel}>AI Help</span>
            {userRole === "student" && aiAssistant && (
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
                Hints: {hintsUsed}{hintLimit != null ? `/${hintLimit}` : ""}
                {coolLeft > 0 && <span style={{ color: "#fbbf24" }}> · {coolLeft}s</span>}
              </p>
            )}
            {hintError && <p style={{ fontSize: 11, color: "#f87171", marginBottom: 8 }}>{hintError}</p>}
            <button type="button" onClick={handleGetHint} disabled={getHintDisabled} style={{ width: "100%", padding: "9px", borderRadius: 8, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, cursor: getHintDisabled ? "not-allowed" : "pointer", opacity: getHintDisabled ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              {hintLoading && <Loader2 size={12} className="animate-spin" />}Get Hint
            </button>
            {userRole !== "student" && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>Adaptive hints visible to students only.</p>}
          </div>

          {/* Chat */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
              {chatMessages.length === 0
                ? <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", padding: 4 }}>Ask a question below.</p>
                : chatMessages.map((m, i) => (
                  <div key={i} style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, fontSize: 11, background: m.role === "user" ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)", border: m.role === "user" ? "1px solid rgba(139,92,246,0.2)" : "1px solid rgba(255,255,255,0.07)", color: m.role === "user" ? "rgba(196,181,253,0.9)" : "rgba(255,255,255,0.55)", marginLeft: m.role === "user" ? 10 : 0, marginRight: m.role !== "user" ? 10 : 0 }}>
                    {m.role === "hint" && <span style={{ fontSize: 10, fontWeight: 700, color: "#b298da", display: "block", marginBottom: 4 }}>Hint</span>}
                    <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
                  </div>
                ))
              }
            </div>
            <div style={{ padding: "8px 10px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 6 }}>
              <input className="ew-input" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChat()} placeholder="Ask the AI..." disabled={chatBusy || (userRole === "student" && coolLeft > 0)} style={{ flex: 1, padding: "7px 10px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans',sans-serif", fontSize: 11, outline: "none" }} />
              <button type="button" onClick={handleChat} disabled={chatBusy || !chatInput.trim() || (userRole === "student" && coolLeft > 0)} style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.25)", color: "rgba(196,181,253,0.9)", fontSize: 11, cursor: "pointer", opacity: (chatBusy || !chatInput.trim() || (userRole === "student" && coolLeft > 0)) ? 0.4 : 1 }}>
                {chatBusy ? <Loader2 size={11} className="animate-spin" /> : "Ask"}
              </button>
            </div>
          </div>

          {/* Bottom buttons */}
          <div style={{ padding: "8px 10px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
            {userRole === "student" && hasReply && (
              <button type="button" onClick={() => setShowReplyModal(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
                <MessageSquare size={12} />Instructor replied — tap to view
                <span style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#4ade80" }} className="animate-pulse" />
              </button>
            )}
            {userRole === "student" && (
              <button type="button" onClick={openHelpModal} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 8, background: "rgba(142,125,165,0.1)", border: "1px solid rgba(142,125,165,0.2)", color: "rgba(178,152,218,0.8)", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(142,125,165,0.2)"; e.currentTarget.style.color = "rgba(255,255,255,0.9)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(142,125,165,0.1)"; e.currentTarget.style.color = "rgba(178,152,218,0.8)" }}
              >
                <LifeBuoy size={12} />{helpRequest ? "Send Another Help Request" : "Ask Instructor for Help"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(10,5,25,0.75)", backdropFilter: "blur(10px)" }}>
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }} transition={{ duration: 0.25 }} style={{ background: "rgba(22,12,46,0.97)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: "100%", maxWidth: 440, overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(135deg,rgba(142,125,165,0.3),rgba(110,92,134,0.2))", padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><LifeBuoy size={16} color="#b298da" /><span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 15, color: "rgba(255,255,255,0.9)" }}>Request Instructor Help</span></div>
                <button type="button" onClick={() => setShowHelpModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}><X size={16} /></button>
              </div>
              <div style={{ padding: "20px 22px" }}>
                {helpSent ? (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}><CheckCircle size={24} color="#4ade80" /></div>
                    <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 16, color: "rgba(255,255,255,0.9)", marginBottom: 8 }}>Request Sent!</h3>
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 18 }}>Your instructor has been notified. You'll see their reply here when they respond.</p>
                    <button type="button" onClick={() => setShowHelpModal(false)} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "none", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Close</button>
                  </div>
                ) : (
                  <>
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 14, lineHeight: 1.6 }}>Describe where you're stuck. Your instructor will see your current code and submission history.</p>
                    <textarea className="ew-input" value={helpMessage} onChange={(e) => setHelpMessage(e.target.value)} placeholder="e.g. I'm stuck on the loop logic..." rows={4} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 8 }} />
                    {helpError && <p style={{ fontSize: 11, color: "#f87171", marginBottom: 8 }}>{helpError}</p>}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button type="button" onClick={() => setShowHelpModal(false)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                      <button type="button" onClick={handleSendHelpRequest} disabled={!helpMessage.trim() || helpSending} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "none", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: (!helpMessage.trim() || helpSending) ? "not-allowed" : "pointer", opacity: (!helpMessage.trim() || helpSending) ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        {helpSending && <Loader2 size={13} className="animate-spin" />}{helpSending ? "Sending..." : "Send Request"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Modal */}
      <AnimatePresence>
        {showReplyModal && helpRequest?.reply && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(10,5,25,0.75)", backdropFilter: "blur(10px)" }}>
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }} transition={{ duration: 0.25 }} style={{ background: "rgba(22,12,46,0.97)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: "100%", maxWidth: 440, overflow: "hidden" }}>
              <div style={{ background: "rgba(34,197,94,0.12)", borderBottom: "1px solid rgba(34,197,94,0.15)", padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}><MessageSquare size={16} color="#4ade80" /><span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 15, color: "rgba(255,255,255,0.9)" }}>Instructor's Reply</span></div>
                <button type="button" onClick={() => setShowReplyModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}><X size={16} /></button>
              </div>
              <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Your message</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{helpRequest.message}</p>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Instructor's reply</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10, padding: "12px 14px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{helpRequest.reply}</p>
                  {helpRequest.repliedAt && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 6 }}>{new Date(helpRequest.repliedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
                </div>
                <button type="button" onClick={() => setShowReplyModal(false)} style={{ width: "100%", padding: "10px", borderRadius: 10, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>Got it!</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default ExerciseWorkspace