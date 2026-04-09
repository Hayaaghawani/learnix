import { useParams, useNavigate } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import { Plus, Trash2, Loader2 } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
const LANGUAGES = ["Python", "C", "C++", "Java", "JavaScript"]

function CreateExercise() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState("details") // "details" | "preview"

  // Form state
  const [title, setTitle] = useState("")
  const [problemStatement, setProblemStatement] = useState("")
  const [aiMode, setAiMode] = useState("beginner")
  const [solution, setSolution] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Test cases
  const [testCases, setTestCases] = useState([{ input: "", output: "" }])

  const addTestCase = () => {
    if (testCases.length < 3) setTestCases([...testCases, { input: "", output: "" }])
  }
  const removeTestCase = (index) => {
    if (testCases.length > 1) setTestCases(testCases.filter((_, i) => i !== index))
  }
  const updateTestCase = (index, field, value) => {
    const updated = [...testCases]
    updated[index][field] = value
    setTestCases(updated)
  }

  // Preview state
  const [previewCode, setPreviewCode] = useState("")
  const [previewLang, setPreviewLang] = useState("Python")
  const [previewRunning, setPreviewRunning] = useState(false)
  const [previewResult, setPreviewResult] = useState(null)

  const runCode = async () => {
    if (!previewCode.trim()) return
    setPreviewRunning(true)
    setPreviewResult(null)

    const expectedOutputs = testCases
      .filter(tc => tc.output.trim())
      .map((tc, i) => `Case ${i + 1}: expected output = "${tc.output}"`)
      .join("\n")

    const prompt = `You are a code evaluator. The programming exercise is:
"${problemStatement || "(no problem statement)"}"

Language: ${previewLang}

The instructor wrote this solution:
\`\`\`${previewLang.toLowerCase()}
${previewCode}
\`\`\`

${expectedOutputs ? `Expected outputs:\n${expectedOutputs}` : "No expected outputs defined — evaluate whether the solution looks logically correct."}

Reply ONLY in this exact JSON format with no extra text:
{"passed": true or false, "feedback": "one or two sentences explaining what is correct or what is wrong"}`

    try {
      const response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      })
      const data = await response.json()
      const text = data.content?.map(b => b.text || "").join("") || ""
      const clean = text.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(clean)
      setPreviewResult(parsed)
    } catch {
      setPreviewResult({ passed: false, feedback: "Could not evaluate. Please try again." })
    } finally {
      setPreviewRunning(false)
    }
  }

  // Save exercise
  const saveExercise = async () => {
    if (title.trim().length > 100) {
  setError("Title must be under 100 characters")
  return
}
    if (!problemStatement.trim()) { setError("Problem statement is required"); return }
    if (!solution.trim()) { setError("Canonical solution is required"); return }
    if (!dueDate) { setError("Due date is required"); return }

    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) { setError("No authentication token found"); setLoading(false); return }

      const typeId = "7f39d2ca-4339-4e43-9cf1-f91f7df65bfe"

      const response = await fetch(`${API_BASE_URL}/exercises/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: id,
          typeId: typeId,
          title: title.trim(),
          difficultyLevel: "Easy",
          exerciseType: aiMode,
          keyConcept: problemStatement.trim(),
          problem: problemStatement.trim(),
          referenceSolution: solution.trim(),
          dueDate: dueDate,
          testCases: testCases
            .filter(tc => tc.output.trim())
            .map(tc => ({ input: tc.input, expectedOutput: tc.output }))
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Failed to create exercise: ${response.status}`)
      }

      navigate(`/instructor/course/${id}/exercises`)
    } catch (err) {
      setError(err.message || "Failed to create exercise. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F1F7]">

      {/* ── TOP TAB BAR ── */}
      <div className="bg-white border-b border-gray-200 px-10 pt-8 pb-0">
        <h1 className="text-2xl font-semibold text-[#3e2764] mb-6">Create Exercise</h1>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-6 py-2.5 rounded-t-lg text-sm font-medium transition-all ${
              activeTab === "details"
                ? "bg-[#F4F1F7] text-[#3e2764] border border-b-0 border-gray-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Exercise Details
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-6 py-2.5 rounded-t-lg text-sm font-medium transition-all ${
              activeTab === "preview"
                ? "bg-[#F4F1F7] text-[#3e2764] border border-b-0 border-gray-200"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Preview & Test
          </button>
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="px-10 py-8">

        {/* DETAILS TAB */}
        {activeTab === "details" && (
          <div className="bg-white p-8 rounded-xl shadow space-y-6 max-w-3xl mx-auto">

            {/* Title */}
            <div>
              <label className="font-medium block mb-2">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border p-3 rounded-lg"
                placeholder="e.g. Sum of a List"
              />
            </div>

            {/* Problem Statement */}
            <div>
              <label className="font-medium block mb-2">Problem Statement</label>
              <textarea
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                className="w-full border p-3 rounded-lg"
                rows={4}
                placeholder="Describe what the student needs to solve..."
              />
            </div>

            {/* AI Assistance Mode */}
            <div>
              <label className="font-medium block mb-2">AI Assistance Mode</label>
              <select
                value={aiMode}
                onChange={(e) => setAiMode(e.target.value)}
                className="border p-3 rounded-lg w-full"
              >
                <option value="beginner">Beginner — Full hints allowed</option>
                <option value="intermediate">Intermediate — Partial hints only</option>
                <option value="senior">Senior — Minimal guidance</option>
                <option value="professional">Professional — No AI help</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="font-medium block mb-2">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border p-3 rounded-lg w-full"
              />
            </div>

            {/* Canonical Solution */}
            <div>
              <label className="font-medium block mb-2">Canonical Solution</label>
              <textarea
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                className="w-full border p-3 rounded-lg font-mono text-sm"
                rows={5}
                placeholder="Write the reference solution here..."
              />
            </div>

            {/* Test Cases */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="font-medium">
                  Test Cases{" "}
                  <span className="text-gray-400 font-normal text-sm">(optional, max 3)</span>
                </label>
                {testCases.length < 3 && (
                  <button
                    onClick={addTestCase}
                    className="flex items-center gap-1 text-sm text-[#6E5C86] hover:text-[#3e2764] font-medium"
                  >
                    <Plus size={14} /> Add
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {testCases.map((tc, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Case {index + 1}</span>
                      {testCases.length > 1 && (
                        <button onClick={() => removeTestCase(index)} className="text-red-400 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Input</label>
                        <input
                          value={tc.input}
                          onChange={(e) => updateTestCase(index, "input", e.target.value)}
                          className="w-full border p-2 rounded-lg text-sm font-mono"
                          placeholder="e.g. 1 2 3"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Expected Output</label>
                        <input
                          value={tc.output}
                          onChange={(e) => updateTestCase(index, "output", e.target.value)}
                          className="w-full border p-2 rounded-lg text-sm font-mono"
                          placeholder="e.g. 6"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={saveExercise}
                disabled={loading}
                className="flex-1 bg-[#8E7DA5] text-white py-3 rounded-lg hover:bg-[#7B6A96] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading
                  ? <><Loader2 className="animate-spin" size={18} /> Creating...</>
                  : <><Plus size={18} /> Create Exercise</>
                }
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className="px-6 py-3 border border-[#8E7DA5] text-[#8E7DA5] rounded-lg hover:bg-purple-50 text-sm font-medium"
              >
                Preview →
              </button>
            </div>
          </div>
        )}

        {/* PREVIEW TAB */}
        {activeTab === "preview" && (
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Exercise snapshot */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="font-semibold text-[#3e2764] text-lg mb-4">Exercise Preview</h2>
              <div className="bg-[#F4F1F7] rounded-lg p-5 space-y-3">
                <p className="font-semibold text-gray-800">
                  {title || <span className="text-gray-400 italic font-normal">No title yet</span>}
                </p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {problemStatement || <span className="italic text-gray-400">No problem statement yet</span>}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full capitalize">
                    {aiMode}
                  </span>
                  {dueDate && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      Due: {new Date(dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {testCases.some(tc => tc.output.trim()) && (
                  <div className="pt-1">
                    <p className="text-xs text-gray-400 mb-2">Test cases:</p>
                    <div className="space-y-1">
                      {testCases.filter(tc => tc.output.trim()).map((tc, i) => (
                        <div key={i} className="font-mono text-xs bg-white border border-gray-200 px-3 py-1.5 rounded flex gap-4">
                          {tc.input && <span><span className="text-gray-400">in:</span> {tc.input}</span>}
                          <span><span className="text-gray-400">out:</span> {tc.output}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Code tester */}
            <div className="bg-white rounded-xl shadow p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-[#3e2764] text-lg">Test Your Solution</h2>
                <select
                  value={previewLang}
                  onChange={(e) => setPreviewLang(e.target.value)}
                  className="border text-sm p-1.5 rounded-lg text-gray-600"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <textarea
                value={previewCode}
                onChange={(e) => setPreviewCode(e.target.value)}
                className="w-full border p-4 rounded-lg font-mono text-sm bg-gray-900 text-green-400"
                rows={8}
                placeholder={`# write your ${previewLang} solution here...`}
                spellCheck={false}
              />

              <button
                onClick={runCode}
                disabled={previewRunning || !previewCode.trim()}
                className="w-full bg-[#3e2764] text-white py-2.5 rounded-lg hover:bg-[#2e1d4a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {previewRunning
                  ? <><Loader2 className="animate-spin" size={15} /> Evaluating...</>
                  : "Check Solution"
                }
              </button>

              {previewResult && (
                <div className={`rounded-lg p-4 text-sm ${
                  previewResult.passed
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}>
                  <p className="font-medium mb-1">
                    {previewResult.passed ? "✓ Looks correct" : "✗ Issues found"}
                  </p>
                  <p className="text-xs leading-relaxed">{previewResult.feedback}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab("details")}
              className="text-sm text-[#6E5C86] hover:text-[#3e2764] font-medium"
            >
              ← Back to Details
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateExercise