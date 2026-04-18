import { useState, useEffect, useCallback } from "react"
import { useParams } from "react-router-dom"
import { Loader2 } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000"

function ExerciseWorkspace() {
  const { id } = useParams()

  const [code, setCode] = useState("")
  const [output, setOutput] = useState("")
  const [language, setLanguage] = useState("python")
  const [submissions, setSubmissions] = useState([])
  const [score, setScore] = useState(0)
  const [testCases, setTestCases] = useState([])
  const [problem, setProblem] = useState("")
  const [userRole, setUserRole] = useState(null)
  const [aiAssistant, setAiAssistant] = useState(null)
  const [coolLeft, setCoolLeft] = useState(0)
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState([])
  const [hintLoading, setHintLoading] = useState(false)
  const [chatBusy, setChatBusy] = useState(false)
  const [hintError, setHintError] = useState("")

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}")
      setUserRole(u.role || null)
    } catch {
      setUserRole(null)
    }
  }, [])

  const loadExercise = useCallback(async () => {
    const token = localStorage.getItem("token")
    const res = await fetch(`${API_BASE_URL}/exercises/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    setProblem(data.problem || "")
    if (data.testCases) {
      setTestCases(
        data.testCases
          .filter((tc) => tc.isVisible)
          .map((tc) => ({
            input: tc.input,
            expected: tc.expectedOutput,
          }))
      )
    }
    if (data.aiAssistant) {
      setAiAssistant(data.aiAssistant)
      setCoolLeft(data.aiAssistant.secondsUntilNextAiResponse || 0)
    } else {
      setAiAssistant(null)
      setCoolLeft(0)
    }
    return data
  }, [id])

  useEffect(() => {
    const saved = localStorage.getItem(`code-${id}`)
    if (saved) setCode(saved)
  }, [id])

  useEffect(() => {
    localStorage.setItem(`code-${id}`, code)
  }, [code, id])

  useEffect(() => {
    const token = localStorage.getItem("token")
    loadExercise().catch(() => setProblem("Failed to load problem."))

    fetch(`${API_BASE_URL}/sandbox/attempts/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setSubmissions(data.attempts || []))
      .catch(() => {})
  }, [id, loadExercise])

  useEffect(() => {
    if (coolLeft <= 0) return undefined
    const t = setTimeout(() => setCoolLeft((c) => Math.max(0, c - 1)), 1000)
    return () => clearTimeout(t)
  }, [coolLeft])

  const hintsUsed = aiAssistant?.hintsUsed ?? 0
  const hintLimit = aiAssistant?.hintLimit
  const atHintLimit = hintLimit != null && hintsUsed >= hintLimit
  const getHintDisabled =
    userRole !== "student" ||
    !aiAssistant?.enableAdaptiveHints ||
    atHintLimit ||
    coolLeft > 0 ||
    hintLoading

  const handleRun = async () => {
    setOutput("Running...")
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API_BASE_URL}/sandbox/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, language, stdin: "" }),
      })
      const data = await res.json()
      setOutput(data.compile_output || data.stderr || data.stdout || "No output")
    } catch {
      setOutput("Error: Could not reach server")
    }
  }

  const handleSubmit = async () => {
    setOutput("Judging...")
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API_BASE_URL}/sandbox/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, language, exercise_id: id }),
      })
      const data = await res.json()
      setScore(data.score ?? 0)
      setOutput(`Passed ${data.passed ?? 0}/${data.total ?? 0} test cases — Score: ${data.score ?? 0}%`)
      setSubmissions((prev) => [
        {
          attemptNumber: data.attempt_id?.slice(0, 8) ?? "?",
          status: data.status,
          score: data.score ?? 0,
          passedTestCases: data.passed ?? 0,
        },
        ...prev,
      ])
    } catch {
      setOutput("Error: Could not reach server")
    }
  }

  const handleGetHint = async () => {
    if (getHintDisabled) return
    setHintError("")
    setHintLoading(true)
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API_BASE_URL}/exercises/${id}/hint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setHintError(typeof data.detail === "string" ? data.detail : "Could not get hint.")
        await loadExercise()
        return
      }
      setChatMessages((prev) => [...prev, { role: "hint", text: data.hint || "" }])
      const cd = data.secondsUntilNextAiResponse ?? aiAssistant?.cooldownSeconds ?? 0
      setCoolLeft(cd)
      await loadExercise()
    } catch {
      setHintError("Network error. Try again.")
    } finally {
      setHintLoading(false)
    }
  }

  const handleChat = async () => {
    const msg = chatInput.trim()
    if (!msg || chatBusy) return
    if (userRole !== "student") {
      setChatMessages((prev) => [...prev, { role: "user", text: msg }, { role: "ai", text: "Sign in as a student to use AI chat with cooldowns." }])
      setChatInput("")
      return
    }
    setChatBusy(true)
    setChatInput("")
    setChatMessages((prev) => [...prev, { role: "user", text: msg }])
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg, exercise_id: id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const detail = typeof data.detail === "string" ? data.detail : "Chat failed."
        setChatMessages((prev) => [...prev, { role: "ai", text: detail }])
        await loadExercise()
        return
      }
      setChatMessages((prev) => [...prev, { role: "ai", text: data.response || "" }])
      const cd = aiAssistant?.cooldownSeconds ?? 0
      if (cd > 0) setCoolLeft(cd)
      await loadExercise()
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", text: "Network error." }])
    } finally {
      setChatBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-4 h-screen">

      <div className="col-span-1 p-4 border-r overflow-auto">
        <h2 className="text-lg font-semibold mb-2">Problem</h2>
        <p className="mb-4 whitespace-pre-wrap text-sm">{problem || "Loading..."}</p>

        <h3 className="font-semibold mb-2">Test Cases</h3>
        {testCases.length === 0 ? (
          <p className="text-sm text-gray-400">No test cases found.</p>
        ) : (
          testCases.map((tc, index) => (
            <div key={index} className="border p-2 mb-2 rounded text-sm">
              <p><b>Input:</b> {tc.input}</p>
              <p><b>Expected:</b> {tc.expected}</p>
            </div>
          ))
        )}

        <h3 className="font-semibold mt-4">Submissions</h3>
        {submissions.length === 0 ? (
          <p className="text-sm text-gray-400">No submissions yet.</p>
        ) : (
          submissions.map((s, i) => (
            <div key={i} className="text-sm border-b py-1 flex justify-between">
              <span>Attempt #{s.attemptNumber}</span>
              <span className={s.status === "Passed" ? "text-green-600" : "text-red-500"}>
                {s.status} ({s.score}%)
              </span>
            </div>
          ))
        )}
      </div>

      <div className="col-span-2 p-4 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>

          <div className="flex gap-2">
            <button type="button" onClick={handleRun} className="bg-blue-500 text-white px-3 py-1 rounded">
              Run
            </button>
            <button type="button" onClick={handleSubmit} className="bg-green-600 text-white px-3 py-1 rounded">
              Submit
            </button>
          </div>
        </div>

        <textarea
          className="w-full h-[65vh] border p-2 font-mono"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <div className="flex justify-end mt-2">
          <p>🏆 Score: {score}%</p>
        </div>
      </div>

      <div className="col-span-1 p-4 border-l flex flex-col overflow-hidden">
        <h2 className="font-semibold mb-2">Output</h2>
        <div className="bg-black text-green-400 p-3 h-32 overflow-auto mb-4 font-mono text-sm whitespace-pre-wrap shrink-0">
          {output || "Run your code to see output..."}
        </div>

        <h2 className="font-semibold mb-2">AI help</h2>
        {userRole === "student" && aiAssistant && (
          <p className="text-xs text-gray-500 mb-2">
            Hints used: {hintsUsed}
            {hintLimit != null ? ` / ${hintLimit}` : ""}
            {coolLeft > 0 ? ` · Wait ${coolLeft}s for next AI response` : ""}
          </p>
        )}
        {hintError && <p className="text-xs text-red-600 mb-2">{hintError}</p>}
        <button
          type="button"
          onClick={handleGetHint}
          disabled={getHintDisabled}
          className="bg-[#6E5C86] text-white p-2 rounded mb-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {hintLoading ? <Loader2 size={16} className="animate-spin" /> : null}
          Get Hint
        </button>
        {userRole !== "student" && (
          <p className="text-xs text-gray-400 mb-2">Students see the hint button when adaptive hints are on for the exercise type.</p>
        )}

        <div className="flex-1 flex flex-col min-h-0 border rounded-lg bg-gray-50">
          <div className="flex-1 overflow-y-auto p-2 space-y-2 text-sm">
            {chatMessages.length === 0 ? (
              <p className="text-gray-400 text-xs p-1">Ask a question below (cooldown applies).</p>
            ) : (
              chatMessages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-2 py-1.5 ${
                    m.role === "user" ? "bg-purple-100 text-purple-900 ml-4" : "bg-white border text-gray-800 mr-4"
                  }`}
                >
                  {m.role === "hint" && <span className="text-xs font-semibold text-[#6E5C86] block mb-0.5">Hint</span>}
                  <span className="whitespace-pre-wrap">{m.text}</span>
                </div>
              ))
            )}
          </div>
          <div className="p-2 border-t flex gap-2 bg-white">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleChat()}
              placeholder="Ask the AI..."
              disabled={chatBusy || (userRole === "student" && coolLeft > 0)}
              className="flex-1 border p-2 rounded text-sm"
            />
            <button
              type="button"
              onClick={handleChat}
              disabled={chatBusy || !chatInput.trim() || (userRole === "student" && coolLeft > 0)}
              className="bg-purple-500 text-white px-3 py-2 rounded text-sm disabled:opacity-40"
            >
              {chatBusy ? <Loader2 size={14} className="animate-spin" /> : "Ask"}
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}

export default ExerciseWorkspace
