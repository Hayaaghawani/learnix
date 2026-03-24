import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import CodeMirror from "@uiw/react-codemirror"
import { python } from "@codemirror/lang-python"
import { javascript } from "@codemirror/lang-javascript"
function ExerciseWorkspace() {
  const { id } = useParams()

  // ---------------- STATE ----------------
  const [code, setCode] = useState("")
  const [output, setOutput] = useState("")
  const [language, setLanguage] = useState("python")
  const [timeLeft, setTimeLeft] = useState(600)
  const [submissions, setSubmissions] = useState([])
  const [score, setScore] = useState(0)

  const [testCases] = useState([
    { input: "1 2 3", expected: "6" },
    { input: "2 3 4", expected: "9" }
  ])

  // ---------------- AUTO SAVE ----------------
  useEffect(() => {
    const saved = localStorage.getItem(`code-${id}`)
    if (saved) setCode(saved)
  }, [id])

  useEffect(() => {
    localStorage.setItem(`code-${id}`, code)
  }, [code, id])

  // ---------------- TIMER ----------------
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // ---------------- RUN CODE ----------------
  const handleRun = () => {
    // Fake execution (replace later with Judge0)
    let result = ""

    if (code.includes("print")) {
      result = "Simulated Output"
    } else {
      result = "Error: No print statement"
    }

    setOutput(result)
  }

  // ---------------- SUBMIT ----------------
  const handleSubmit = () => {
    let passed = 0

    testCases.forEach((tc) => {
      // Fake check (replace with real backend)
      if (output.includes(tc.expected)) {
        passed++
      }
    })

    const finalScore = Math.round((passed / testCases.length) * 100)
    setScore(finalScore)

    setSubmissions((prev) => [
      ...prev,
      {
        date: new Date().toLocaleString(),
        result: finalScore === 100 ? "Passed ✅" : "Failed ❌",
        score: finalScore
      }
    ])
  }

  // ---------------- UI ----------------
  return (
    <div className="grid grid-cols-4 h-screen">

      {/* LEFT PANEL */}
      <div className="col-span-1 p-4 border-r overflow-auto">
        <h2 className="text-lg font-semibold mb-2">Problem</h2>
        <p className="mb-4">
          Write a program that prints "Hello World" 5 times.
        </p>

        <h3 className="font-semibold mb-2">Test Cases</h3>
        {testCases.map((tc, index) => (
          <div key={index} className="border p-2 mb-2 rounded">
            <p><b>Input:</b> {tc.input}</p>
            <p><b>Expected:</b> {tc.expected}</p>
          </div>
        ))}

        <h3 className="font-semibold mt-4">Submissions</h3>
        {submissions.map((s, i) => (
          <div key={i} className="text-sm border-b py-1">
            {s.date} - {s.result} ({s.score}%)
          </div>
        ))}
      </div>

      {/* CENTER PANEL */}
      <div className="col-span-2 p-4 flex flex-col">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="border p-1 rounded"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleRun}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Run
            </button>

            <button
              onClick={handleSubmit}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Editor */}
       <textarea
  className="w-full h-[60vh] border p-2"
  value={code}
  onChange={(e) => setCode(e.target.value)}
/>
        {/* Timer + Score */}
        <div className="flex justify-between mt-2">
          <p>⏱ Time Left: {timeLeft}s</p>
          <p>🏆 Score: {score}%</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="col-span-1 p-4 border-l flex flex-col">
        
        <h2 className="font-semibold mb-2">Output</h2>
        <div className="bg-black text-green-400 p-3 h-40 overflow-auto mb-4">
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