import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Calendar, Clock, Code2, Eye, EyeOff,
  Users, CheckCircle2, XCircle, BarChart2, Loader2,
  BookOpen, Cpu, Trophy, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function StatCard({ icon: Icon, label, value, color = "purple" }) {
  const colors = {
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    green:  "bg-green-50  text-green-700  border-green-100",
    blue:   "bg-blue-50   text-blue-700   border-blue-100",
    amber:  "bg-amber-50  text-amber-700  border-amber-100",
  }
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${colors[color]}`}>
      <div className="shrink-0">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  )
}

function InstructorExerciseDetails() {
  const { exerciseId, courseId } = useParams()
  const navigate = useNavigate()

  const [exercise, setExercise]     = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [aiType, setAiType]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState("")
  const [showSolution, setShowSolution] = useState(false)
  const [expandedTc, setExpandedTc] = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        const headers = { Authorization: `Bearer ${token}` }

        // fetch exercise
        const exRes = await fetch(`${API_BASE_URL}/exercises/${exerciseId}`, { headers })
        if (!exRes.ok) throw new Error("Could not load exercise")
        const exData = await exRes.json()
        setExercise(exData)

        // fetch AI type info using typeId
        if (exData.typeId) {
          const typesRes = await fetch(
            `${API_BASE_URL}/exercises/types/course/${exData.courseId}`,
            { headers }
          )
          if (typesRes.ok) {
            const typesData = await typesRes.json()
            const found = (typesData.types || []).find(t => t.typeId === exData.typeId)
            setAiType(found || null)
          }
        }

        // fetch submissions/attempts for this exercise
        try {
          const subRes = await fetch(
            `${API_BASE_URL}/sandbox/attempts/${exerciseId}`,
            { headers }
          )
          if (subRes.ok) {
            const subData = await subRes.json()
            setSubmissions(subData.attempts || [])
          }
        } catch {
          // submissions optional
        }
      } catch (e) {
        setError(e.message || "Failed to load exercise details")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [exerciseId])

  if (loading) return (
    <div className="min-h-screen bg-[#F4F1F7] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#8E7DA5]" size={36} />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#F4F1F7] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow p-8 text-center max-w-md">
        <AlertCircle className="text-red-400 mx-auto mb-3" size={40} />
        <p className="text-gray-700 font-medium">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-[#6E5C86] hover:underline"
        >
          ← Go back
        </button>
      </div>
    </div>
  )

  if (!exercise) return null

  const visibleTc  = (exercise.testCases || []).filter(tc => tc.isVisible)
  const hiddenTc   = (exercise.testCases || []).filter(tc => !tc.isVisible)
  const totalSubs  = submissions.length
  const passedSubs = submissions.filter(s => s.status === "Passed").length
  const avgScore   = totalSubs
    ? Math.round(submissions.reduce((a, s) => a + (s.score || 0), 0) / totalSubs)
    : 0
  const passRate   = totalSubs ? Math.round((passedSubs / totalSubs) * 100) : 0

  const dueDate = exercise.dueDate
    ? new Date(exercise.dueDate).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
      })
    : "No due date"

  const createdAt = exercise.createdAt
    ? new Date(exercise.createdAt).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      })
    : "—"

  return (
    <div className="min-h-screen bg-[#F4F1F7]">

      {/* Header bar */}
      <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center gap-4">
        <button
          onClick={() => navigate(`/instructor/course/${courseId}/exercises`)}
          className="flex items-center gap-1.5 text-[#6E5C86] hover:text-[#3e2764] text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Back to Exercises
        </button>
        <span className="text-gray-300">|</span>
        <h1 className="text-lg font-semibold text-[#3e2764] truncate">{exercise.title}</h1>
        <span className="ml-auto text-xs text-gray-400">Created {createdAt}</span>
      </div>

      <div className="px-8 py-8 max-w-5xl mx-auto space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users}        label="Total Submissions" value={totalSubs}       color="purple" />
          <StatCard icon={CheckCircle2} label="Pass Rate"         value={`${passRate}%`}  color="green"  />
          <StatCard icon={Trophy}       label="Avg Score"         value={`${avgScore}%`}  color="blue"   />
          <StatCard icon={BarChart2}    label="Test Cases"        value={exercise.testCases?.length || 0} color="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT col — main info */}
          <div className="lg:col-span-2 space-y-5">

            {/* Problem statement */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={18} className="text-[#6E5C86]" />
                <h2 className="font-semibold text-[#3e2764]">Problem Statement</h2>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {exercise.problem || <span className="italic text-gray-400">No problem statement.</span>}
              </p>
            </div>

            {/* Test cases */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Code2 size={18} className="text-[#6E5C86]" />
                <h2 className="font-semibold text-[#3e2764]">Test Cases</h2>
                <span className="ml-auto text-xs text-gray-400">
                  {visibleTc.length} visible · {hiddenTc.length} hidden
                </span>
              </div>

              {(exercise.testCases || []).length === 0 ? (
                <p className="text-sm text-gray-400 italic">No test cases defined.</p>
              ) : (
                <div className="space-y-2">
                  {(exercise.testCases || []).map((tc, i) => (
                    <div
                      key={tc.testCaseId || i}
                      className="border border-gray-100 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedTc(expandedTc === i ? null : i)}
                        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {tc.isVisible
                            ? <Eye size={14} className="text-green-500" />
                            : <EyeOff size={14} className="text-gray-400" />
                          }
                          <span className="font-medium text-gray-700">Case {i + 1}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tc.isVisible
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {tc.isVisible ? "Visible" : "Hidden"}
                          </span>
                        </div>
                        {expandedTc === i
                          ? <ChevronUp size={14} className="text-gray-400" />
                          : <ChevronDown size={14} className="text-gray-400" />
                        }
                      </button>
                      {expandedTc === i && (
                        <div className="px-4 py-3 grid grid-cols-2 gap-3 bg-white">
                          <div>
                            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Input</p>
                            <pre className="bg-gray-50 rounded-lg p-2 text-xs font-mono text-gray-700 whitespace-pre-wrap break-all">
                              {tc.input || <span className="italic text-gray-400">empty</span>}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wide">Expected Output</p>
                            <pre className="bg-gray-50 rounded-lg p-2 text-xs font-mono text-gray-700 whitespace-pre-wrap break-all">
                              {tc.expectedOutput}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reference solution */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Code2 size={18} className="text-[#6E5C86]" />
                  <h2 className="font-semibold text-[#3e2764]">Reference Solution</h2>
                </div>
                <button
                  onClick={() => setShowSolution(v => !v)}
                  className="text-xs flex items-center gap-1.5 text-[#6E5C86] hover:text-[#3e2764] font-medium transition-colors"
                >
                  {showSolution ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showSolution ? "Hide" : "Show"} Solution
                </button>
              </div>
              {showSolution ? (
                <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {exercise.referenceSolution || "No solution provided."}
                </pre>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-400 italic">
                  Solution hidden — click "Show Solution" to reveal
                </div>
              )}
            </div>

            {/* Recent submissions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={18} className="text-[#6E5C86]" />
                <h2 className="font-semibold text-[#3e2764]">Student Submissions</h2>
                <span className="ml-auto text-xs text-gray-400">{totalSubs} total</span>
              </div>
              {submissions.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No submissions yet.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {submissions.slice(0, 10).map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        {s.status === "Passed"
                          ? <CheckCircle2 size={15} className="text-green-500" />
                          : <XCircle      size={15} className="text-red-400"   />
                        }
                        <span className="text-gray-600">Attempt #{s.attemptNumber || i + 1}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          s.status === "Passed"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-600"
                        }`}>
                          {s.status}
                        </span>
                        <span className="text-gray-500 text-xs w-14 text-right">
                          {s.score ?? "—"}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {submissions.length > 10 && (
                    <p className="text-xs text-gray-400 italic pt-2">
                      Showing 10 of {submissions.length} submissions
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT col — metadata */}
          <div className="space-y-5">

            {/* Exercise info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-[#3e2764] mb-4">Exercise Info</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2 text-gray-600">
                  <Calendar size={15} className="mt-0.5 text-[#8E7DA5] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Due Date</p>
                    <p className="font-medium text-gray-700">{dueDate}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-gray-600">
                  <BarChart2 size={15} className="mt-0.5 text-[#8E7DA5] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Difficulty</p>
                    <p className="font-medium text-gray-700">{exercise.difficultyLevel || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-gray-600">
                  <Code2 size={15} className="mt-0.5 text-[#8E7DA5] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Exercise Type</p>
                    <p className="font-medium text-gray-700">{exercise.exerciseType || "—"}</p>
                  </div>
                </div>
                {exercise.prerequisites && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <BookOpen size={15} className="mt-0.5 text-[#8E7DA5] shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Prerequisites</p>
                      <p className="font-medium text-gray-700">{exercise.prerequisites}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2 text-gray-600">
                  <Clock size={15} className="mt-0.5 text-[#8E7DA5] shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Status</p>
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${
                      exercise.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {exercise.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Mode info */}
            {aiType && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu size={18} className="text-[#6E5C86]" />
                  <h2 className="font-semibold text-[#3e2764]">AI Mode</h2>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Mode Name</span>
                    <span className="font-medium text-gray-700 capitalize">{aiType.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Adaptive Hints</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      aiType.enableAdaptiveHints
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {aiType.enableAdaptiveHints ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  {aiType.enableAdaptiveHints && aiType.hintLimit != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Hint Limit</span>
                      <span className="font-medium text-gray-700">{aiType.hintLimit} hints</span>
                    </div>
                  )}
                  {aiType.cooldownSeconds > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">AI Cooldown</span>
                      <span className="font-medium text-gray-700">{aiType.cooldownSeconds}s</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Error Explanation</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      aiType.enableErrorExplanation
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {aiType.enableErrorExplanation ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">RAG</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      aiType.enableRag
                        ? "bg-purple-50 text-purple-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {aiType.enableRag ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Show Solution</span>
                    <span className="font-medium text-gray-700 capitalize text-xs">
                      {(aiType.showSolutionPolicy || "after_submission").replace(/_/g, " ")}
                    </span>
                  </div>
                  {aiType.description && (
                    <p className="text-xs text-gray-400 pt-1 border-t border-gray-50 italic">
                      {aiType.description}
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default InstructorExerciseDetails