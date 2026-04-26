import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, Loader2, Sun, Moon, Terminal, Play, CheckCircle2, XCircle, Lock } from "lucide-react"
import Editor from "@monaco-editor/react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const LANG_OPTIONS = [
  { value: "python", label: "Python only", icon: "🐍" },
  { value: "cpp",    label: "C++ only",    icon: "⚙️" },
  { value: "both",   label: "Both",        icon: "🔓" },
]

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
        const res = await fetch(`${API_BASE_URL}/exercises/types/course/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const modes = (data.types || []).map((t) => ({
          value: t.name.toLowerCase(),
          typeId: t.typeId,
          label: t.isSystemPresent ? `${t.name} — System` : `${t.name} — Custom`,
        }))
        setAvailableModes(modes)
        if (modes.length > 0)
          setAiMode((prev) => (modes.some((m) => m.value === prev) ? prev : modes[0].value))
      } catch {
        setError("Failed to load exercise modes.")
      }
    }
    fetchModes()
  }, [id])

  const [testCases, setTestCases] = useState([{ input: "", output: "", isVisible: true }])
  const addTestCase    = () => setTestCases([...testCases, { input: "", output: "", isVisible: true }])
  const removeTestCase = (i) => { if (testCases.length > 1) setTestCases(testCases.filter((_, idx) => idx !== i)) }
  const updateTestCase = (i, field, value) => { const u = [...testCases]; u[i][field] = value; setTestCases(u) }
  const toggleVisible  = (i) => { const u = [...testCases]; u[i].isVisible = !u[i].isVisible; setTestCases(u) }

  // ── Preview / sandbox state ───────────────────────────────────────────────
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const chatEndRef = useRef(null)

  const defaultLang = languageLock === "both" ? "python" : languageLock

  const [previewCode,    setPreviewCode]    = useState("")
  const [previewLang,    setPreviewLang]    = useState(defaultLang)
  const [previewDark,    setPreviewDark]    = useState(true)
  const [previewStdin,   setPreviewStdin]   = useState("")
  const [showStdin,      setShowStdin]      = useState(false)
  const [previewOutput,  setPreviewOutput]  = useState("")
  const [previewRunning, setPreviewRunning] = useState(false)
  const [previewJudging, setPreviewJudging] = useState(false)
  const [testResults,    setTestResults]    = useState(null)

  // AI hint / chat state (preview uses Anthropic API directly)
  const [hintLoading,   setHintLoading]   = useState(false)
  const [chatMessages,  setChatMessages]  = useState([])
  const [chatInput,     setChatInput]     = useState("")
  const [chatBusy,      setChatBusy]      = useState(false)

  useEffect(() => {
    if (languageLock !== "both") setPreviewLang(languageLock)
  }, [languageLock])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const editorBg   = previewDark ? "#1e1e1e" : "#ffffff"
  const monacoLang = previewLang === "cpp" ? "cpp" : "python"
  const isLocked   = languageLock !== "both"

  const handleEditorMount = (editor, monaco) => {
    editorRef.current  = editor
    monacoRef.current  = monaco
  }

  // ── Sandbox run ───────────────────────────────────────────────────────────
  const runPreview = async () => {
    if (!previewCode.trim()) return
    setPreviewRunning(true)
    setPreviewOutput("Running...")
    setTestResults(null)
    const token = localStorage.getItem("token")
    try {
      const res  = await fetch(`${API_BASE_URL}/sandbox/run`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ code: previewCode, language: previewLang, stdin: previewStdin }),
      })
      const data = await res.json()
      const err  = data.compile_output || data.stderr || ""
      setPreviewOutput(err && !data.stdout ? err : data.stdout || "No output")
    } catch {
      setPreviewOutput("Error: Could not reach server")
    } finally {
      setPreviewRunning(false)
    }
  }

  // ── Judge against test cases ──────────────────────────────────────────────
  const runAgainstTestCases = async () => {
    const valid = testCases.filter((tc) => tc.output.trim())
    if (!valid.length) { setPreviewOutput("No test cases defined yet."); return }
    if (!previewCode.trim()) { setPreviewOutput("Write some code first."); return }
    setPreviewJudging(true)
    setPreviewOutput("Judging...")
    setTestResults(null)
    const token   = localStorage.getItem("token")
    const results = []
    let passed    = 0
    for (const tc of valid) {
      try {
        const res  = await fetch(`${API_BASE_URL}/sandbox/run`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ code: previewCode, language: previewLang, stdin: tc.input || "" }),
        })
        const data = await res.json()
        const got  = (data.stdout || "").trim()
        const ok   = got === tc.output.trim()
        if (ok) passed++
        results.push({ input: tc.input, expected: tc.output, got, passed: ok, error: data.compile_output || data.stderr || "" })
        if ((data.compile_output || "").trim()) { setPreviewOutput(data.compile_output); break }
      } catch {
        results.push({ input: tc.input, expected: tc.output, got: "", passed: false, error: "Network error" })
      }
    }
    setTestResults({ passed, total: valid.length, results })
    setPreviewOutput(`Passed ${passed}/${valid.length} test cases`)
    setPreviewJudging(false)
  }

  // ── AI hint (calls Anthropic API directly in preview) ─────────────────────
  const getPreviewHint = async () => {
    if (hintLoading || !problemStatement.trim()) return
    setHintLoading(true)
    const prompt = `You are a helpful programming tutor. The exercise problem is:

"${problemStatement}"

The instructor is previewing this exercise. Give a short, helpful pedagogical hint for this problem — as if you were guiding a student. Do NOT reveal the full solution. Keep it to 2-3 sentences.`

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }],
        }),
      })
      const data = await res.json()
      const text = (data.content || []).map((b) => b.text || "").join("")
      setChatMessages((prev) => [...prev, { role: "hint", text: text || "Could not generate hint." }])
    } catch {
      setChatMessages((prev) => [...prev, { role: "hint", text: "Could not reach AI. Check your connection." }])
    } finally {
      setHintLoading(false)
    }
  }

  // ── AI chat (calls Anthropic API directly in preview) ─────────────────────
  const sendPreviewChat = async () => {
    const msg = chatInput.trim()
    if (!msg || chatBusy) return
    setChatBusy(true)
    setChatInput("")
    setChatMessages((prev) => [...prev, { role: "user", text: msg }])

    const context = problemStatement
      ? `The exercise problem is:\n"${problemStatement}"\n\n`
      : ""

    const codeContext = previewCode.trim()
      ? `The current code is:\n\`\`\`\n${previewCode}\n\`\`\`\n\n`
      : ""

    const prompt = `${context}${codeContext}A student asks: "${msg}"

Answer helpfully and pedagogically. Do not give the complete solution. Keep your answer concise.`

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          messages: [{ role: "user", content: prompt }],
        }),
      })
      const data = await res.json()
      const text = (data.content || []).map((b) => b.text || "").join("")
      setChatMessages((prev) => [...prev, { role: "ai", text: text || "No response." }])
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", text: "Network error." }])
    } finally {
      setChatBusy(false)
    }
  }

  // ── Save exercise ─────────────────────────────────────────────────────────
  const saveExercise = async () => {
    if (!title.trim())             { setError("Exercise title is required"); return }
    if (title.trim().length > 100) { setError("Title must be under 100 characters"); return }
    if (!problemStatement.trim())  { setError("Problem statement is required"); return }
    if (!solution.trim())          { setError("Canonical solution is required"); return }
    if (!dueDate)                  { setError("Due date is required"); return }
    const valid  = testCases.filter((tc) => tc.output.trim())
    if (!valid.length) { setError("At least one test case is required"); return }
    const typeId = modeToTypeIdMap[aiMode]
    if (!typeId)       { setError("Invalid exercise mode selected"); return }

    setLoading(true); setError("")
    try {
      const token = localStorage.getItem("token")
      const res   = await fetch(`${API_BASE_URL}/exercises/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({
          courseId:          id,
          typeId,
          title:             title.trim(),
          difficultyLevel:   "Easy",
          exerciseType:      "coding",
          problem:           problemStatement.trim(),
          referenceSolution: solution.trim(),
          dueDate,
          languageLock,
          testCases: valid.map((tc) => ({
            input:          tc.input,
            expectedOutput: tc.output,
            isVisible:      tc.isVisible,
          })),
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || `Failed: ${res.status}`) }
      navigate(`/instructor/course/${id}/exercises`)
    } catch (err) {
      setError(err.message || "Failed to create exercise.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F1F7]">

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-10 pt-8 pb-0">
        <h1 className="text-2xl font-semibold text-[#3e2764] mb-6">Create Exercise</h1>
        <div className="flex gap-1">
          {[["details", "Exercise Details"], ["preview", "Preview & Test"]].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-t-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-[#F4F1F7] text-[#3e2764] border border-b-0 border-gray-200"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-10 py-8">

        {/* ── DETAILS TAB ─────────────────────────────────────────────────── */}
        {activeTab === "details" && (
          <div className="bg-white p-8 rounded-xl shadow space-y-6 max-w-3xl mx-auto">

            <div>
              <label className="font-medium block mb-2">Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-3 rounded-lg" placeholder="e.g. Sum of a List" />
            </div>

            <div>
              <label className="font-medium block mb-2">Problem Statement</label>
              <textarea value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} className="w-full border p-3 rounded-lg" rows={4} placeholder="Describe what the student needs to solve..." />
            </div>

            <div>
              <label className="font-medium block mb-2">AI Assistance Mode</label>
              <select value={aiMode} onChange={(e) => setAiMode(e.target.value)} className="border p-3 rounded-lg w-full">
                {availableModes.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            {/* Language Lock */}
            <div>
              <label className="font-medium block mb-1">Allowed Language</label>
              <p className="text-xs text-gray-400 mb-3">Controls which language(s) students can use in the code editor.</p>
              <div className="grid grid-cols-3 gap-3">
                {LANG_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLanguageLock(opt.value)}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all font-medium text-sm ${
                      languageLock === opt.value
                        ? "border-[#6E5C86] bg-[#6E5C86]/10 text-[#3e2764]"
                        : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span>{opt.label}</span>
                    {languageLock === opt.value && opt.value !== "both" && (
                      <span className="flex items-center gap-1 text-xs text-[#6E5C86]">
                        <Lock size={11} /> Locked
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-medium block mb-2">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="border p-3 rounded-lg w-full" />
            </div>

            <div>
              <label className="font-medium block mb-2">Canonical Solution</label>
              <textarea value={solution} onChange={(e) => setSolution(e.target.value)} className="w-full border p-3 rounded-lg font-mono text-sm" rows={5} placeholder="Write the reference solution here..." />
            </div>

            {/* Test Cases */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="font-medium">
                  Test Cases <span className="text-red-400 font-normal text-sm">(at least 1 required)</span>
                </label>
                <button onClick={addTestCase} className="flex items-center gap-1 text-sm text-[#6E5C86] hover:text-[#3e2764] font-medium">
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {testCases.map((tc, i) => (
                  <div key={i} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Case {i + 1}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleVisible(i)}
                          className={`text-xs px-2 py-1 rounded-full font-medium border transition-all ${
                            tc.isVisible ? "bg-green-50 text-green-700 border-green-300" : "bg-gray-100 text-gray-500 border-gray-300"
                          }`}
                        >
                          {tc.isVisible ? "👁 Visible" : "🔒 Hidden"}
                        </button>
                        {testCases.length > 1 && (
                          <button onClick={() => removeTestCase(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Input</label>
                        <textarea value={tc.input} onChange={(e) => updateTestCase(i, "input", e.target.value)} className="w-full border p-2 rounded-lg text-sm font-mono" placeholder={"e.g.\n3\n1 2 3"} rows={3} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Expected Output</label>
                        <input value={tc.output} onChange={(e) => updateTestCase(i, "output", e.target.value)} className="w-full border p-2 rounded-lg text-sm font-mono" placeholder="e.g. 6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

            <div className="flex gap-3">
              <button onClick={saveExercise} disabled={loading} className="flex-1 bg-[#8E7DA5] text-white py-3 rounded-lg hover:bg-[#7B6A96] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="animate-spin" size={18} /> Creating...</> : <><Plus size={18} /> Create Exercise</>}
              </button>
              <button onClick={() => setActiveTab("preview")} className="px-6 py-3 border border-[#8E7DA5] text-[#8E7DA5] rounded-lg hover:bg-purple-50 text-sm font-medium">
                Preview →
              </button>
            </div>
          </div>
        )}

        {/* ── PREVIEW TAB ──────────────────────────────────────────────────── */}
        {activeTab === "preview" && (
          <div
            className="rounded-xl overflow-hidden shadow-xl border border-gray-200"
            style={{ height: "calc(100vh - 220px)", display: "grid", gridTemplateColumns: "1fr 2fr 1fr" }}
          >

            {/* ── Left: Problem + test cases + results ── */}
            <div className="flex flex-col overflow-hidden border-r bg-white">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">

                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-xs font-medium">
                  👁 Instructor preview — testing as a student would
                </div>

                {/* Language badge */}
                <div>
                  {isLocked ? (
                    <span className="flex items-center gap-1.5 text-xs bg-[#6E5C86]/10 text-[#3e2764] border border-[#6E5C86]/30 px-2.5 py-1 rounded-full font-medium w-fit">
                      <Lock size={11} /> Locked to {languageLock === "cpp" ? "C++" : "Python"}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full w-fit block">🔓 Both languages allowed</span>
                  )}
                </div>

                <div>
                  <h2 className="font-semibold text-gray-800 mb-1">{title || <span className="text-gray-400 italic font-normal">No title set</span>}</h2>
                  <p className="whitespace-pre-wrap text-gray-600 leading-relaxed text-sm">
                    {problemStatement || <span className="italic text-gray-400">No problem statement yet</span>}
                  </p>
                </div>

                {testCases.some((tc) => tc.output.trim() && tc.isVisible) && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1.5 text-sm">Visible Test Cases</h3>
                    <div className="space-y-1.5">
                      {testCases.filter((tc) => tc.output.trim() && tc.isVisible).map((tc, i) => (
                        <div key={i} className="bg-gray-50 border rounded p-2 text-xs font-mono">
                          {tc.input && <p><span className="text-gray-500">in:</span> {tc.input}</p>}
                          <p><span className="text-gray-500">out:</span> {tc.output}</p>
                        </div>
                      ))}
                    </div>
                    {testCases.filter((tc) => tc.output.trim() && !tc.isVisible).length > 0 && (
                      <p className="text-xs text-gray-400 italic mt-1.5">
                        + {testCases.filter((tc) => tc.output.trim() && !tc.isVisible).length} hidden case(s)
                      </p>
                    )}
                  </div>
                )}

                {testResults && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1.5 text-sm">
                      Results — {testResults.passed}/{testResults.total} passed
                    </h3>
                    <div className="space-y-2">
                      {testResults.results.map((r, i) => (
                        <div key={i} className={`rounded-lg px-3 py-2 text-xs border ${r.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                          <div className="flex items-center gap-1.5 font-medium mb-1">
                            {r.passed ? <CheckCircle2 size={13} className="text-green-600" /> : <XCircle size={13} className="text-red-500" />}
                            Case {i + 1} — {r.passed ? "Passed" : "Failed"}
                          </div>
                          {r.input && <p className="text-gray-500 font-mono">in: {r.input}</p>}
                          <p className="text-gray-500 font-mono">expected: {r.expected}</p>
                          {!r.passed && <p className="text-red-600 font-mono">got: {r.got || r.error || "no output"}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 p-3 border-t">
                <button onClick={() => setActiveTab("details")} className="text-xs text-[#6E5C86] hover:text-[#3e2764] font-medium">
                  ← Back to Details
                </button>
              </div>
            </div>

            {/* ── Middle: Monaco editor ── */}
            <div className="flex flex-col overflow-hidden" style={{ background: editorBg }}>

              {/* Toolbar */}
              <div
                className="flex items-center justify-between px-3 py-1.5 shrink-0 border-b"
                style={{ background: previewDark ? "#2d2d2d" : "#f3f3f3", borderColor: previewDark ? "#3e3e3e" : "#d1d5db" }}
              >
                <div className="flex items-center gap-2">
                  {isLocked ? (
                    <span
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded border font-medium"
                      style={{ background: previewDark ? "#3c3c3c" : "#f3f0ff", color: "#a78bfa", borderColor: previewDark ? "#6E5C86" : "#c4b5fd" }}
                    >
                      <Lock size={11} /> {previewLang === "cpp" ? "C++" : "Python"}
                    </span>
                  ) : (
                    <select
                      value={previewLang}
                      onChange={(e) => setPreviewLang(e.target.value)}
                      className="text-xs px-2 py-1 rounded border"
                      style={{ background: previewDark ? "#3c3c3c" : "#fff", color: previewDark ? "#d4d4d4" : "#111", borderColor: previewDark ? "#555" : "#d1d5db" }}
                    >
                      <option value="python">Python</option>
                      <option value="cpp">C++</option>
                    </select>
                  )}

                  <button
                    type="button" onClick={() => setPreviewDark((d) => !d)}
                    className="p-1 rounded"
                    style={{ background: previewDark ? "#3c3c3c" : "#e5e7eb", color: previewDark ? "#d4d4d4" : "#374151" }}
                  >
                    {previewDark ? <Sun size={13} /> : <Moon size={13} />}
                  </button>

                  <button
                    type="button" onClick={() => setShowStdin((s) => !s)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                    style={{
                      background: showStdin ? "#6E5C86" : (previewDark ? "#3c3c3c" : "#e5e7eb"),
                      color:      showStdin ? "#fff"    : (previewDark ? "#d4d4d4" : "#374151"),
                    }}
                  >
                    <Terminal size={12} /> stdin
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button" onClick={runPreview} disabled={previewRunning || previewJudging}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition disabled:opacity-40 flex items-center gap-1"
                  >
                    {previewRunning ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />} Run
                  </button>
                  <button
                    type="button" onClick={runAgainstTestCases} disabled={previewRunning || previewJudging}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition disabled:opacity-40 flex items-center gap-1"
                  >
                    {previewJudging ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Test All Cases
                  </button>
                </div>
              </div>

              {/* Monaco */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <Editor
                  height="100%"
                  language={monacoLang}
                  value={previewCode}
                  onChange={(v) => setPreviewCode(v || "")}
                  theme={previewDark ? "vs-dark" : "light"}
                  onMount={handleEditorMount}
                  options={{
                    fontSize: 13,
                    fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                    fontLigatures: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: previewLang === "python" ? 4 : 2,
                    insertSpaces: true,
                    wordWrap: "on",
                    lineNumbers: "on",
                    renderLineHighlight: "line",
                    cursorBlinking: "smooth",
                    bracketPairColorization: { enabled: true },
                    formatOnType: true,
                    autoIndent: "full",
                    quickSuggestions: true,
                    padding: { top: 8, bottom: 8 },
                  }}
                />
              </div>

              {showStdin && (
                <div className="shrink-0 border-t px-3 py-2" style={{ background: previewDark ? "#252526" : "#f9fafb", borderColor: previewDark ? "#3e3e3e" : "#e5e7eb" }}>
                  <label className="text-xs font-semibold block mb-1" style={{ color: previewDark ? "#9cdcfe" : "#6E5C86" }}>
                    stdin — one value per line
                  </label>
                  <textarea
                    value={previewStdin} onChange={(e) => setPreviewStdin(e.target.value)} rows={3}
                    placeholder={"e.g.\n5\nhello world"}
                    className="w-full text-xs font-mono resize-none rounded px-2 py-1.5 outline-none"
                    style={{ background: previewDark ? "#1e1e1e" : "#fff", color: previewDark ? "#d4d4d4" : "#111", border: `1px solid ${previewDark ? "#555" : "#d1d5db"}` }}
                  />
                </div>
              )}
            </div>

            {/* ── Right: Output + AI Hints + Chat + Save ── */}
            <div className="flex flex-col overflow-hidden border-l bg-white">

              {/* Output */}
              <div className="shrink-0 px-3 pt-3 pb-2 border-b">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Output</h2>
                <div className="bg-gray-900 text-green-400 rounded-lg p-2.5 h-20 overflow-auto font-mono text-xs whitespace-pre-wrap">
                  {previewOutput || "Run your code to see output..."}
                </div>
              </div>

              {/* AI Help */}
              <div className="shrink-0 px-3 pt-2.5 pb-2 border-b">
                <div className="flex items-center justify-between mb-1.5">
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Help</h2>
                  <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Preview mode</span>
                </div>
                <button
                  type="button"
                  onClick={getPreviewHint}
                  disabled={hintLoading || !problemStatement.trim()}
                  className="w-full bg-[#6E5C86] text-white py-1.5 rounded text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition hover:bg-[#5a4a70]"
                  title={!problemStatement.trim() ? "Add a problem statement first" : ""}
                >
                  {hintLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                  {hintLoading ? "Generating hint..." : "Get Hint"}
                </button>
                {!problemStatement.trim() && (
                  <p className="text-xs text-gray-400 mt-1 text-center">Add a problem statement to enable hints</p>
                )}
              </div>

              {/* Chat */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {chatMessages.length === 0 ? (
                    <p className="text-gray-400 text-xs p-1">Ask a question or get a hint to see AI responses here.</p>
                  ) : (
                    chatMessages.map((m, i) => (
                      <div
                        key={i}
                        className={`rounded-lg px-2 py-1.5 text-xs ${
                          m.role === "user"
                            ? "bg-purple-100 text-purple-900 ml-3"
                            : "bg-gray-50 border text-gray-800 mr-3"
                        }`}
                      >
                        {m.role === "hint" && (
                          <span className="text-xs font-bold text-[#6E5C86] block mb-0.5">💡 Hint</span>
                        )}
                        <span className="whitespace-pre-wrap">{m.text}</span>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="shrink-0 p-2 border-t flex gap-1.5 bg-white">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendPreviewChat()}
                    placeholder="Ask the AI..."
                    disabled={chatBusy}
                    className="flex-1 border rounded px-2 py-1.5 text-xs"
                  />
                  <button
                    type="button" onClick={sendPreviewChat}
                    disabled={chatBusy || !chatInput.trim()}
                    className="bg-purple-500 text-white px-2.5 py-1.5 rounded text-xs disabled:opacity-40"
                  >
                    {chatBusy ? <Loader2 size={12} className="animate-spin" /> : "Ask"}
                  </button>
                </div>
              </div>

              {/* Save button */}
              <div className="shrink-0 p-2 border-t space-y-1.5">
                {testResults && (
                  <div className={`rounded-lg px-2.5 py-2 text-xs font-medium flex items-center gap-1.5 ${
                    testResults.passed === testResults.total
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {testResults.passed === testResults.total ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {testResults.passed === testResults.total ? "All cases pass ✓" : `${testResults.passed}/${testResults.total} passed`}
                  </div>
                )}
                <button
                  onClick={saveExercise} disabled={loading}
                  className="w-full bg-[#8E7DA5] hover:bg-[#7B6A96] text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition"
                >
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : <><Plus size={15} /> Create Exercise</>}
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