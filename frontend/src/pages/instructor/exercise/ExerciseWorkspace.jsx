import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "react-router-dom"
import Editor from "@monaco-editor/react"
import { Loader2, LifeBuoy, X, CheckCircle, MessageSquare, Sun, Moon, Terminal, Lock } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000"
const LINT_DEBOUNCE_MS = 1200

function parseCppErrors(errorText, monacoInstance) {
  const markers = []
  for (const line of errorText.split("\n")) {
    const match = line.match(/code:(\d+):(\d+):\s*(error|warning|note):\s*(.+)/)
    if (match) {
      markers.push({
        startLineNumber: parseInt(match[1]),
        startColumn:     parseInt(match[2]),
        endLineNumber:   parseInt(match[1]),
        endColumn:       parseInt(match[2]) + 10,
        message:         match[4].trim(),
        severity: match[3] === "error"
          ? monacoInstance.MarkerSeverity.Error
          : match[3] === "warning"
          ? monacoInstance.MarkerSeverity.Warning
          : monacoInstance.MarkerSeverity.Info,
      })
    }
  }
  return markers
}

function parsePythonErrors(errorText, monacoInstance) {
  const markers = []
  const lineMatches = [...errorText.matchAll(/line (\d+)/g)]
  const errorMatch  = errorText.match(
    /(SyntaxError|IndentationError|NameError|TypeError|ValueError|AttributeError|ImportError|KeyError|IndexError|ZeroDivisionError):\s*(.+)/
  )
  if (lineMatches.length > 0 && errorMatch) {
    const lineNum = parseInt(lineMatches[lineMatches.length - 1][1])
    markers.push({
      startLineNumber: lineNum, startColumn: 1,
      endLineNumber:   lineNum, endColumn:   200,
      message:  `${errorMatch[1]}: ${errorMatch[2].trim()}`,
      severity: monacoInstance.MarkerSeverity.Error,
    })
  }
  return markers
}

function ExerciseWorkspace() {
  const { id } = useParams()
  const editorRef    = useRef(null)
  const monacoRef    = useRef(null)
  const lintTimerRef = useRef(null)

  const [code,       setCode]       = useState("")
  const [output,     setOutput]     = useState("")
  const [language,   setLanguage]   = useState("python")
  const [languageLock, setLanguageLock] = useState("both") // "python" | "cpp" | "both"
  const [stdin,      setStdin]      = useState("")
  const [showStdin,  setShowStdin]  = useState(false)
  const [darkMode,   setDarkMode]   = useState(true)
  const [isLinting,  setIsLinting]  = useState(false)
  const [lintClean,  setLintClean]  = useState(true)

  const [submissions, setSubmissions] = useState([])
  const [score,       setScore]       = useState(0)
  const [testCases,   setTestCases]   = useState([])
  const [problem,     setProblem]     = useState("")
  const [userRole,    setUserRole]    = useState(null)
  const [aiAssistant, setAiAssistant] = useState(null)
  const [coolLeft,    setCoolLeft]    = useState(0)
  const [chatInput,   setChatInput]   = useState("")
  const [chatMessages,setChatMessages]= useState([])
  const [hintLoading, setHintLoading] = useState(false)
  const [chatBusy,    setChatBusy]    = useState(false)
  const [hintError,   setHintError]   = useState("")

  const [showHelpModal,  setShowHelpModal]  = useState(false)
  const [helpMessage,    setHelpMessage]    = useState("")
  const [helpSending,    setHelpSending]    = useState(false)
  const [helpSent,       setHelpSent]       = useState(false)
  const [helpError,      setHelpError]      = useState("")
  const [helpRequest,    setHelpRequest]    = useState(null)
  const [showReplyModal, setShowReplyModal] = useState(false)

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}")
      setUserRole(u.role || null)
    } catch { setUserRole(null) }
  }, [])

  // ── Marker helpers ─────────────────────────────────────────────────────────
  const applyMarkers = useCallback((errorText) => {
    if (!editorRef.current || !monacoRef.current) return
    const model = editorRef.current.getModel()
    if (!model) return
    const markers = errorText
      ? language === "cpp"
        ? parseCppErrors(errorText, monacoRef.current)
        : parsePythonErrors(errorText, monacoRef.current)
      : []
    monacoRef.current.editor.setModelMarkers(model, "sandbox", markers)
    setLintClean(markers.length === 0)
  }, [language])

  const clearMarkers = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return
    const model = editorRef.current.getModel()
    if (model) monacoRef.current.editor.setModelMarkers(model, "sandbox", [])
    setLintClean(true)
  }, [])

  // ── Debounced lint ─────────────────────────────────────────────────────────
  const runLint = useCallback(async (currentCode, currentLanguage) => {
    if (!currentCode.trim()) { clearMarkers(); return }
    setIsLinting(true)
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API_BASE_URL}/sandbox/lint`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ code: currentCode, language: currentLanguage }),
      })
      if (!res.ok) return
      const data = await res.json()
      applyMarkers(data.errors || "")
    } catch {}
    finally { setIsLinting(false) }
  }, [applyMarkers, clearMarkers])

  useEffect(() => {
    if (lintTimerRef.current) clearTimeout(lintTimerRef.current)
    lintTimerRef.current = setTimeout(() => runLint(code, language), LINT_DEBOUNCE_MS)
    return () => clearTimeout(lintTimerRef.current)
  }, [code, language, runLint])

  useEffect(() => { clearMarkers() }, [language, clearMarkers])

  const loadExercise = useCallback(async () => {
    const token = localStorage.getItem("token")
    const res   = await fetch(`${API_BASE_URL}/exercises/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data  = await res.json()
    setProblem(data.problem || "")

    // ── Apply language lock from exercise ──────────────────────────────────
    const lock = data.languageLock || "both"
    setLanguageLock(lock)
    if (lock !== "both") setLanguage(lock) // force the correct language

    if (data.testCases) {
      setTestCases(
        data.testCases.filter((tc) => tc.isVisible)
          .map((tc) => ({ input: tc.input, expected: tc.expectedOutput }))
      )
    }
    if (data.aiAssistant) {
      setAiAssistant(data.aiAssistant)
      setCoolLeft(data.aiAssistant.secondsUntilNextAiResponse || 0)
    } else {
      setAiAssistant(null); setCoolLeft(0)
    }
    return data
  }, [id])

  const loadHelpRequest = useCallback(async () => {
    const token = localStorage.getItem("token")
    try {
      const res  = await fetch(`${API_BASE_URL}/exercises/${id}/my-help-request`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setHelpRequest(data.request || null)
    } catch {}
  }, [id])

  useEffect(() => {
    const saved = localStorage.getItem(`code-${id}`)
    if (saved) setCode(saved)
  }, [id])

  useEffect(() => { localStorage.setItem(`code-${id}`, code) }, [code, id])

  useEffect(() => {
    const token = localStorage.getItem("token")
    loadExercise().catch(() => setProblem("Failed to load problem."))
    fetch(`${API_BASE_URL}/sandbox/attempts/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setSubmissions(data.attempts || []))
      .catch(() => {})
  }, [id, loadExercise])

  useEffect(() => { if (userRole === "student") loadHelpRequest() }, [userRole, loadHelpRequest])

  useEffect(() => {
    if (userRole !== "student" || helpRequest?.reply) return
    const interval = setInterval(() => loadHelpRequest(), 10000)
    return () => clearInterval(interval)
  }, [userRole, helpRequest?.reply, loadHelpRequest])

  useEffect(() => { if (helpRequest?.reply) setShowReplyModal(true) }, [helpRequest?.reply])

  useEffect(() => {
    if (coolLeft <= 0) return undefined
    const t = setTimeout(() => setCoolLeft((c) => Math.max(0, c - 1)), 1000)
    return () => clearTimeout(t)
  }, [coolLeft])

  const hintsUsed  = aiAssistant?.hintsUsed ?? 0
  const hintLimit  = aiAssistant?.hintLimit
  const atHintLimit = hintLimit != null && hintsUsed >= hintLimit
  const getHintDisabled =
    userRole !== "student" || !aiAssistant?.enableAdaptiveHints ||
    atHintLimit || coolLeft > 0 || hintLoading

  const isLocked   = languageLock !== "both"
  const editorBg   = darkMode ? "#1e1e1e" : "#ffffff"
  const monacoLang = language === "cpp" ? "cpp" : "python"

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current  = editor
    monacoRef.current  = monaco
  }

  const handleRun = async () => {
    setOutput("Running..."); clearMarkers()
    const token = localStorage.getItem("token")
    try {
      const res  = await fetch(`${API_BASE_URL}/sandbox/run`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ code, language, stdin }),
      })
      const data = await res.json()
      const err  = data.compile_output || data.stderr || ""
      if (err && !data.stdout) { setOutput(err); applyMarkers(err) }
      else { setOutput(data.stdout || "No output"); clearMarkers() }
    } catch { setOutput("Error: Could not reach server") }
  }

  const handleSubmit = async () => {
    setOutput("Judging..."); clearMarkers()
    const token = localStorage.getItem("token")
    try {
      const res  = await fetch(`${API_BASE_URL}/sandbox/submit`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ code, language, exercise_id: id }),
      })
      const data = await res.json()
      setScore(data.score ?? 0)
      setOutput(`Passed ${data.passed ?? 0}/${data.total ?? 0} test cases — Score: ${data.score ?? 0}%`)
      setSubmissions((prev) => [{
        attemptNumber: data.attempt_id?.slice(0, 8) ?? "?",
        status: data.status, score: data.score ?? 0, passedTestCases: data.passed ?? 0,
      }, ...prev])
    } catch { setOutput("Error: Could not reach server") }
  }

  const handleGetHint = async () => {
    if (getHintDisabled) return
    setHintError(""); setHintLoading(true)
    const token = localStorage.getItem("token")
    try {
      const res  = await fetch(`${API_BASE_URL}/exercises/${id}/hint`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ message: null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setHintError(typeof data.detail === "string" ? data.detail : "Could not get hint."); await loadExercise(); return }
      setChatMessages((prev) => [...prev, { role: "hint", text: data.hint || "" }])
      setCoolLeft(data.secondsUntilNextAiResponse ?? aiAssistant?.cooldownSeconds ?? 0)
      await loadExercise()
    } catch { setHintError("Network error. Try again.") }
    finally { setHintLoading(false) }
  }

  const handleChat = async () => {
    const msg = chatInput.trim()
    if (!msg || chatBusy) return
    if (userRole !== "student") {
      setChatMessages((prev) => [...prev, { role: "user", text: msg }, { role: "ai", text: "Sign in as a student to use AI chat." }])
      setChatInput(""); return
    }
    setChatBusy(true); setChatInput("")
    setChatMessages((prev) => [...prev, { role: "user", text: msg }])
    const token = localStorage.getItem("token")
    try {
      const res  = await fetch(`${API_BASE_URL}/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ message: msg, exercise_id: id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setChatMessages((prev) => [...prev, { role: "ai", text: typeof data.detail === "string" ? data.detail : "Chat failed." }]); await loadExercise(); return }
      setChatMessages((prev) => [...prev, { role: "ai", text: data.response || "" }])
      const cd = aiAssistant?.cooldownSeconds ?? 0
      if (cd > 0) setCoolLeft(cd)
      await loadExercise()
    } catch { setChatMessages((prev) => [...prev, { role: "ai", text: "Network error." }]) }
    finally { setChatBusy(false) }
  }

  const openHelpModal = () => { setHelpMessage(""); setHelpError(""); setHelpSent(false); setShowHelpModal(true) }

  const handleSendHelpRequest = async () => {
    if (!helpMessage.trim() || helpSending) return
    setHelpSending(true); setHelpError("")
    const token = localStorage.getItem("token")
    try {
      const res  = await fetch(`${API_BASE_URL}/exercises/${id}/help-request`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ message: helpMessage.trim(), code_snapshot: code, language }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setHelpError(typeof data.detail === "string" ? data.detail : "Could not send request."); return }
      setHelpSent(true); await loadHelpRequest()
    } catch { setHelpError("Network error. Please try again.") }
    finally { setHelpSending(false) }
  }

  const hasReply = helpRequest?.reply

  return (
    <>
      <div className="grid grid-cols-4 overflow-hidden" style={{ height: "calc(100vh - 57px)" }}>

        {/* ── LEFT ── */}
        <div className="col-span-1 flex flex-col overflow-hidden border-r bg-white">
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            <div>
              <h2 className="font-semibold text-gray-800 mb-1">Problem</h2>
              <p className="whitespace-pre-wrap text-gray-600 leading-relaxed">{problem || "Loading..."}</p>
            </div>
            {testCases.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-1.5">Test Cases</h3>
                <div className="space-y-1.5">
                  {testCases.map((tc, i) => (
                    <div key={i} className="bg-gray-50 border rounded p-2 text-xs font-mono">
                      <p><span className="text-gray-500">in:</span> {tc.input}</p>
                      <p><span className="text-gray-500">out:</span> {tc.expected}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-700 mb-1.5">Submissions</h3>
              {submissions.length === 0 ? (
                <p className="text-gray-400 text-xs">No submissions yet.</p>
              ) : (
                <div className="space-y-1">
                  {submissions.map((s, i) => (
                    <div key={i} className="flex justify-between text-xs border-b pb-1">
                      <span className="text-gray-500">#{s.attemptNumber}</span>
                      <span className={s.status === "Passed" ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                        {s.status} · {s.score}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MIDDLE: Editor ── */}
        <div className="col-span-2 flex flex-col overflow-hidden" style={{ background: editorBg }}>

          {/* Toolbar */}
          <div
            className="flex items-center justify-between px-3 py-1.5 shrink-0 border-b"
            style={{ background: darkMode ? "#2d2d2d" : "#f3f3f3", borderColor: darkMode ? "#3e3e3e" : "#d1d5db" }}
          >
            <div className="flex items-center gap-2">

              {/* Language control — locked or free */}
              {isLocked ? (
                <span
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border font-medium"
                  style={{ background: darkMode ? "#3c3c3c" : "#f3f0ff", color: "#a78bfa", borderColor: darkMode ? "#6E5C86" : "#c4b5fd" }}
                  title={`Language locked to ${language === "cpp" ? "C++" : "Python"} by instructor`}
                >
                  <Lock size={11} />
                  {language === "cpp" ? "C++" : "Python"}
                </span>
              ) : (
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="text-xs px-2 py-1 rounded border"
                  style={{ background: darkMode ? "#3c3c3c" : "#fff", color: darkMode ? "#d4d4d4" : "#111", borderColor: darkMode ? "#555" : "#d1d5db" }}
                >
                  <option value="python">Python</option>
                  <option value="cpp">C++</option>
                </select>
              )}

              <button
                type="button" onClick={() => setDarkMode((d) => !d)}
                className="p-1 rounded"
                style={{ background: darkMode ? "#3c3c3c" : "#e5e7eb", color: darkMode ? "#d4d4d4" : "#374151" }}
              >
                {darkMode ? <Sun size={13} /> : <Moon size={13} />}
              </button>

              <button
                type="button" onClick={() => setShowStdin((s) => !s)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                style={{
                  background: showStdin ? "#6E5C86" : (darkMode ? "#3c3c3c" : "#e5e7eb"),
                  color:      showStdin ? "#fff"    : (darkMode ? "#d4d4d4" : "#374151"),
                }}
              >
                <Terminal size={12} /> stdin
              </button>

              {/* Lint indicator */}
              <div className="flex items-center gap-1 text-xs" style={{ color: darkMode ? "#9cdcfe" : "#6b7280" }}>
                {isLinting ? (
                  <><Loader2 size={11} className="animate-spin opacity-60" /><span className="opacity-60">checking...</span></>
                ) : lintClean ? (
                  <span className="text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> no errors
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> errors found
                  </span>
                )}
              </div>

              <span className="text-xs font-medium" style={{ color: darkMode ? "#9cdcfe" : "#6E5C86" }}>
                🏆 {score}%
              </span>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={handleRun} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition">▶ Run</button>
              <button type="button" onClick={handleSubmit} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition">Submit</button>
            </div>
          </div>

          {/* Monaco */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Editor
              height="100%"
              language={monacoLang}
              value={code}
              onChange={(v) => setCode(v || "")}
              theme={darkMode ? "vs-dark" : "light"}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 13,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: language === "python" ? 4 : 2,
                insertSpaces: true,
                wordWrap: "on",
                lineNumbers: "on",
                renderLineHighlight: "line",
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
                formatOnType: true,
                formatOnPaste: true,
                autoIndent: "full",
                quickSuggestions: true,
                parameterHints: { enabled: true },
                padding: { top: 8, bottom: 8 },
              }}
            />
          </div>

          {showStdin && (
            <div className="shrink-0 border-t px-3 py-2" style={{ background: darkMode ? "#252526" : "#f9fafb", borderColor: darkMode ? "#3e3e3e" : "#e5e7eb" }}>
              <label className="text-xs font-semibold block mb-1" style={{ color: darkMode ? "#9cdcfe" : "#6E5C86" }}>
                stdin — one value per line
              </label>
              <textarea
                value={stdin} onChange={(e) => setStdin(e.target.value)} rows={3}
                placeholder={"e.g.\n5\nhello world"}
                className="w-full text-xs font-mono resize-none rounded px-2 py-1.5 outline-none"
                style={{ background: darkMode ? "#1e1e1e" : "#fff", color: darkMode ? "#d4d4d4" : "#111", border: `1px solid ${darkMode ? "#555" : "#d1d5db"}` }}
              />
            </div>
          )}
        </div>

        {/* ── RIGHT ── */}
        <div className="col-span-1 flex flex-col overflow-hidden border-l bg-white">
          <div className="shrink-0 p-3 border-b">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Output</h2>
            <div className="bg-gray-900 text-green-400 rounded-lg p-2.5 h-24 overflow-auto font-mono text-xs whitespace-pre-wrap">
              {output || "Run your code to see output..."}
            </div>
          </div>

          <div className="shrink-0 px-3 pt-2.5 pb-2 border-b">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">AI Help</h2>
            {userRole === "student" && aiAssistant && (
              <p className="text-xs text-gray-400 mb-1.5">
                Hints: {hintsUsed}{hintLimit != null ? `/${hintLimit}` : ""}
                {coolLeft > 0 && <span className="text-amber-500"> · {coolLeft}s</span>}
              </p>
            )}
            {hintError && <p className="text-xs text-red-500 mb-1.5">{hintError}</p>}
            <button
              type="button" onClick={handleGetHint} disabled={getHintDisabled}
              className="w-full bg-[#6E5C86] text-white py-1.5 rounded text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition hover:bg-[#5a4a70]"
            >
              {hintLoading && <Loader2 size={13} className="animate-spin" />} Get Hint
            </button>
            {userRole !== "student" && <p className="text-xs text-gray-400 mt-1">Adaptive hints visible to students only.</p>}
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {chatMessages.length === 0 ? (
                <p className="text-gray-400 text-xs p-1">Ask a question below.</p>
              ) : (
                chatMessages.map((m, i) => (
                  <div key={i} className={`rounded-lg px-2 py-1.5 text-xs ${m.role === "user" ? "bg-purple-100 text-purple-900 ml-3" : "bg-gray-50 border text-gray-800 mr-3"}`}>
                    {m.role === "hint" && <span className="text-xs font-bold text-[#6E5C86] block mb-0.5">Hint</span>}
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  </div>
                ))
              )}
            </div>
            <div className="shrink-0 p-2 border-t flex gap-1.5 bg-white">
              <input
                value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
                placeholder="Ask the AI..."
                disabled={chatBusy || (userRole === "student" && coolLeft > 0)}
                className="flex-1 border rounded px-2 py-1.5 text-xs"
              />
              <button
                type="button" onClick={handleChat}
                disabled={chatBusy || !chatInput.trim() || (userRole === "student" && coolLeft > 0)}
                className="bg-purple-500 text-white px-2.5 py-1.5 rounded text-xs disabled:opacity-40"
              >
                {chatBusy ? <Loader2 size={12} className="animate-spin" /> : "Ask"}
              </button>
            </div>
          </div>

          <div className="shrink-0 p-2 border-t space-y-1.5">
            {userRole === "student" && hasReply && (
              <button type="button" onClick={() => setShowReplyModal(true)} className="flex items-center gap-2 w-full bg-green-50 border border-green-300 text-green-800 hover:bg-green-100 transition py-1.5 px-2.5 rounded-lg text-xs font-medium">
                <MessageSquare size={13} className="text-green-600" />
                Instructor replied — tap to view
                <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </button>
            )}
            {userRole === "student" && (
              <button type="button" onClick={openHelpModal} className="flex items-center justify-center gap-1.5 w-full border border-[#6E5C86] text-[#6E5C86] hover:bg-[#6E5C86] hover:text-white transition py-1.5 rounded-lg text-xs font-medium">
                <LifeBuoy size={13} />
                {helpRequest ? "Send Another Help Request" : "Ask Instructor for Help"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Help Request Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-[#6E5C86] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white"><LifeBuoy size={18} /><span className="font-semibold">Request Instructor Help</span></div>
              <button type="button" onClick={() => setShowHelpModal(false)} className="text-white/70 hover:text-white"><X size={18} /></button>
            </div>
            <div className="px-6 py-5">
              {helpSent ? (
                <div className="flex flex-col items-center py-4 text-center gap-3">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center"><CheckCircle size={30} className="text-green-600" /></div>
                  <h3 className="text-lg font-semibold text-gray-800">Request Sent!</h3>
                  <p className="text-sm text-gray-500">Your instructor has been notified. You'll see their reply here when they respond.</p>
                  <button type="button" onClick={() => setShowHelpModal(false)} className="mt-2 w-full py-2.5 rounded-lg bg-[#6E5C86] text-white text-sm font-medium hover:bg-[#5a4a70] transition">Close</button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-3">Describe where you're stuck. Your instructor will see your current code and submission history.</p>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your message</label>
                  <textarea value={helpMessage} onChange={(e) => setHelpMessage(e.target.value)} placeholder="e.g. I'm stuck on the loop logic..." rows={4} className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6E5C86]/40 focus:border-[#6E5C86] transition" />
                  {helpError && <p className="text-xs text-red-600 mt-1.5">{helpError}</p>}
                  <div className="flex gap-3 mt-4">
                    <button type="button" onClick={() => setShowHelpModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm font-medium">Cancel</button>
                    <button type="button" onClick={handleSendHelpRequest} disabled={!helpMessage.trim() || helpSending} className="flex-1 py-2.5 rounded-lg bg-[#6E5C86] text-white hover:bg-[#5a4a70] transition text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {helpSending && <Loader2 size={14} className="animate-spin" />}
                      {helpSending ? "Sending..." : "Send Request"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructor Reply Modal */}
      {showReplyModal && helpRequest?.reply && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-green-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white"><MessageSquare size={18} /><span className="font-semibold">Instructor's Reply</span></div>
              <button type="button" onClick={() => setShowReplyModal(false)} className="text-white/70 hover:text-white"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Your message</p>
                <p className="text-sm text-gray-600 bg-gray-50 border rounded-lg px-3 py-2 whitespace-pre-wrap">{helpRequest.message}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Instructor's reply</p>
                <p className="text-sm text-gray-800 bg-green-50 border border-green-200 rounded-lg px-3 py-3 whitespace-pre-wrap">{helpRequest.reply}</p>
                {helpRequest.repliedAt && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {new Date(helpRequest.repliedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              <button type="button" onClick={() => setShowReplyModal(false)} className="w-full py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition">Got it!</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ExerciseWorkspace