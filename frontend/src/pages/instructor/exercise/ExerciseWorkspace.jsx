import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

function ExerciseWorkspace() {
  const { id } = useParams()

  const [code, setCode] = useState("")
  const [output, setOutput] = useState("")
  const [language, setLanguage] = useState("python")
  const [submissions, setSubmissions] = useState([])
  const [score, setScore] = useState(0)
  const [testCases, setTestCases] = useState([])
  const [problem, setProblem] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem(`code-${id}`)
    if (saved) setCode(saved)
  }, [id])

  useEffect(() => {
    localStorage.setItem(`code-${id}`, code)
  }, [code, id])

  useEffect(() => {
    const token = localStorage.getItem("token")

    fetch(`${API_BASE}/exercises/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setProblem(data.problem || "")
        if (data.testCases) {
          setTestCases(data.testCases.map(tc => ({
            input: tc.input,
            expected: tc.expectedOutput
          })))
        }
      })
      .catch(() => setProblem("Failed to load problem."))

    fetch(`${API_BASE}/sandbox/attempts/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => setSubmissions(data.attempts || []))
      .catch(() => {})
  }, [id])

  const handleRun = async () => {
    setOutput("Running...")
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API_BASE}/sandbox/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code, language, stdin: "" }),
      })
      const data = await res.json()
      setOutput(data.compile_output || data.stderr || data.stdout || "No output")
    } catch (e) {
      setOutput("Error: Could not reach server")
    }
  }

  const handleSubmit = async () => {
  setOutput("Judging...")
  const token = localStorage.getItem("token")
  try {
    const res = await fetch(`${API_BASE}/sandbox/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ code, language, exercise_id: id }),
    })
    const data = await res.json()
    setScore(data.score ?? 0)
    setOutput(`Passed ${data.passed ?? 0}/${data.total ?? 0} test cases — Score: ${data.score ?? 0}%`)
    setSubmissions(prev => [
      {
        attemptNumber: data.attempt_id?.slice(0, 8) ?? "?",
        status: data.status,
        score: data.score ?? 0,
        passedTestCases: data.passed ?? 0,
      },
      ...prev,
    ])
  } catch (e) {
    setOutput("Error: Could not reach server")
  }
}
  return (
    <div className="grid grid-cols-4 h-screen">

      <div className="col-span-1 p-4 border-r overflow-auto">
        <h2 className="text-lg font-semibold mb-2">Problem</h2>
        <p className="mb-4">{problem || "Loading..."}</p>

        <h3 className="font-semibold mb-2">Test Cases</h3>
        {testCases.length === 0 ? (
          <p className="text-sm text-gray-400">No test cases found.</p>
        ) : (
          testCases.map((tc, index) => (
            <div key={index} className="border p-2 mb-2 rounded">
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
            <button onClick={handleRun} className="bg-blue-500 text-white px-3 py-1 rounded">
              Run
            </button>
            <button onClick={handleSubmit} className="bg-green-600 text-white px-3 py-1 rounded">
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

      <div className="col-span-1 p-4 border-l flex flex-col">
        <h2 className="font-semibold mb-2">Output</h2>
        <div className="bg-black text-green-400 p-3 h-40 overflow-auto mb-4 font-mono text-sm whitespace-pre-wrap">
          {output || "Run your code to see output..."}
        </div>

        <h2 className="font-semibold mb-2">AI Hint</h2>
        <input
          placeholder="Ask for a hint..."
          className="border p-2 rounded mb-2"
        />
        <button className="bg-purple-500 text-white p-2 rounded">
          Ask
        </button>
      </div>

    </div>
  )
}

export default ExerciseWorkspace