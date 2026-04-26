import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Calendar, Clock, Code2, Eye, EyeOff, Users, CheckCircle2, XCircle, BarChart2, Loader2, BookOpen, Cpu, Trophy, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { motion } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    purple: { bg: "rgba(142,125,165,0.12)", border: "rgba(142,125,165,0.2)", text: "#b298da" },
    green:  { bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.15)",  text: "#4ade80" },
    blue:   { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.15)", text: "#60a5fa" },
    amber:  { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.15)", text: "#fbbf24" },
  }
  const c = colors[color] || colors.purple
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}>
      <Icon size={20} color={c.text} />
      <div>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 20, fontWeight: 700, color: c.text }}>{value}</p>
      </div>
    </div>
  )
}

function InstructorExerciseDetails() {
  const { exerciseId, courseId } = useParams()
  const navigate = useNavigate()
  const [exercise, setExercise]       = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [aiType, setAiType]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState("")
  const [showSolution, setShowSolution] = useState(false)
  const [expandedTc, setExpandedTc]   = useState(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError("")
      try {
        const token = localStorage.getItem("token"); const headers = { Authorization: `Bearer ${token}` }
        const exRes = await fetch(`${API_BASE_URL}/exercises/${exerciseId}`, { headers })
        if (!exRes.ok) throw new Error("Could not load exercise")
        const exData = await exRes.json(); setExercise(exData)
        if (exData.typeId) {
          const typesRes = await fetch(`${API_BASE_URL}/exercises/types/course/${exData.courseId}`, { headers })
          if (typesRes.ok) { const td = await typesRes.json(); setAiType((td.types || []).find(t => t.typeId === exData.typeId) || null) }
        }
        try {
          const subRes = await fetch(`${API_BASE_URL}/sandbox/attempts/${exerciseId}`, { headers })
          if (subRes.ok) { const sd = await subRes.json(); setSubmissions(sd.attempts || []) }
        } catch {}
      } catch (e) { setError(e.message || "Failed to load exercise details") }
      finally { setLoading(false) }
    }
    load()
  }, [exerciseId])

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#120b22", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={32} className="animate-spin" style={{ color: "#8E7DA5" }} />
    </div>
  )
  if (error) return (
    <div style={{ minHeight: "100vh", background: "#120b22", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "40px", textAlign: "center" }}>
        <AlertCircle size={36} style={{ color: "#f87171", margin: "0 auto 12px" }} />
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ color: "#b298da", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>← Go back</button>
      </div>
    </div>
  )
  if (!exercise) return null

  const visibleTc  = (exercise.testCases || []).filter(tc => tc.isVisible)
  const hiddenTc   = (exercise.testCases || []).filter(tc => !tc.isVisible)
  const totalSubs  = submissions.length
  const passedSubs = submissions.filter(s => s.status === "Passed").length
  const avgScore   = totalSubs ? Math.round(submissions.reduce((a, s) => a + (s.score || 0), 0) / totalSubs) : 0
  const passRate   = totalSubs ? Math.round((passedSubs / totalSubs) * 100) : 0
  const dueDate    = exercise.dueDate ? new Date(exercise.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "No due date"
  const createdAt  = exercise.createdAt ? new Date(exercise.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"

  const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "22px 24px", marginBottom: 16 }
  const secLabel  = { fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }
  const metaRow   = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }

  return (
    <div style={{ minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "14px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate(`/instructor/course/${courseId}/exercises`)} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(178,152,218,0.7)", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
          <ArrowLeft size={15} /> Back
        </button>
        <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
        <h1 style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.85)", flex: 1 }}>{exercise.title}</h1>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Created {createdAt}</span>
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
          <StatCard icon={Users}        label="Total Submissions" value={totalSubs}       color="purple" />
          <StatCard icon={CheckCircle2} label="Pass Rate"         value={`${passRate}%`}  color="green"  />
          <StatCard icon={Trophy}       label="Avg Score"         value={`${avgScore}%`}  color="blue"   />
          <StatCard icon={BarChart2}    label="Test Cases"        value={exercise.testCases?.length || 0} color="amber" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>

          {/* Left */}
          <div>
            {/* Problem */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <BookOpen size={16} color="#8E7DA5" />
                <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Problem Statement</p>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{exercise.problem || <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.2)" }}>No problem statement.</span>}</p>
            </div>

            {/* Test cases */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Code2 size={16} color="#8E7DA5" />
                <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Test Cases</p>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{visibleTc.length} visible · {hiddenTc.length} hidden</span>
              </div>
              {(exercise.testCases || []).length === 0 ? <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No test cases defined.</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(exercise.testCases || []).map((tc, i) => (
                    <div key={tc.testCaseId || i} style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
                      <button onClick={() => setExpandedTc(expandedTc === i ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "none", cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {tc.isVisible ? <Eye size={13} color="#4ade80" /> : <EyeOff size={13} color="rgba(255,255,255,0.2)" />}
                          <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>Case {i + 1}</span>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: tc.isVisible ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", color: tc.isVisible ? "#4ade80" : "rgba(255,255,255,0.25)", border: `1px solid ${tc.isVisible ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}` }}>{tc.isVisible ? "Visible" : "Hidden"}</span>
                        </div>
                        {expandedTc === i ? <ChevronUp size={13} color="rgba(255,255,255,0.2)" /> : <ChevronDown size={13} color="rgba(255,255,255,0.2)" />}
                      </button>
                      {expandedTc === i && (
                        <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          {[["Input", tc.input || "(empty)"], ["Expected Output", tc.expectedOutput]].map(([lbl, val]) => (
                            <div key={lbl}>
                              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{lbl}</p>
                              <pre style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px", fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.6)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{val}</pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reference solution */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Code2 size={16} color="#8E7DA5" />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Reference Solution</p>
                </div>
                <button onClick={() => setShowSolution(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#b298da", background: "none", border: "none", cursor: "pointer" }}>
                  {showSolution ? <EyeOff size={12} /> : <Eye size={12} />}{showSolution ? "Hide" : "Show"}
                </button>
              </div>
              {showSolution
                ? <pre style={{ background: "#0d1117", color: "#4ade80", borderRadius: 10, padding: "14px 16px", fontSize: 12, fontFamily: "monospace", overflowX: "auto", whiteSpace: "pre-wrap" }}>{exercise.referenceSolution || "No solution provided."}</pre>
                : <div style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 10, padding: "20px", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>Solution hidden — click "Show" to reveal</div>
              }
            </div>

            {/* Submissions */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <BarChart2 size={16} color="#8E7DA5" />
                <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Student Submissions</p>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{totalSubs} total</span>
              </div>
              {submissions.length === 0
                ? <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No submissions yet.</p>
                : submissions.slice(0, 10).map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {s.status === "Passed" ? <CheckCircle2 size={14} color="#4ade80" /> : <XCircle size={14} color="#f87171" />}
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Attempt #{s.attemptNumber || i + 1}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: s.status === "Passed" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${s.status === "Passed" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, color: s.status === "Passed" ? "#4ade80" : "#f87171", fontWeight: 500 }}>{s.status}</span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", width: 40, textAlign: "right" }}>{s.score ?? "—"}%</span>
                    </div>
                  </div>
                ))
              }
              {submissions.length > 10 && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic", paddingTop: 8 }}>Showing 10 of {submissions.length}</p>}
            </div>
          </div>

          {/* Right */}
          <div>
            {/* Exercise info */}
            <div style={cardStyle}>
              <p style={{ ...secLabel, marginBottom: 14 }}>Exercise Info</p>
              {[
                [Calendar, "Due Date", dueDate],
                [BarChart2, "Difficulty", exercise.difficultyLevel || "—"],
                [Code2, "Type", exercise.exerciseType || "—"],
                exercise.prerequisites ? [BookOpen, "Prerequisites", exercise.prerequisites] : null,
              ].filter(Boolean).map(([Icon, label, value]) => (
                <div key={label} style={{ ...metaRow }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Icon size={13} color="#8E7DA5" />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>{value}</span>
                </div>
              ))}
              <div style={{ ...metaRow, borderBottom: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Clock size={13} color="#8E7DA5" />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Status</span>
                </div>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: exercise.isActive ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${exercise.isActive ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}`, color: exercise.isActive ? "#4ade80" : "rgba(255,255,255,0.3)" }}>
                  {exercise.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* AI Mode */}
            {aiType && (
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Cpu size={15} color="#8E7DA5" />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>AI Mode</p>
                </div>
                {[
                  ["Mode Name", aiType.name],
                  ["Adaptive Hints", aiType.enableAdaptiveHints ? "Enabled" : "Disabled", aiType.enableAdaptiveHints ? "#4ade80" : null],
                  aiType.enableAdaptiveHints && aiType.hintLimit != null ? ["Hint Limit", `${aiType.hintLimit} hints`] : null,
                  aiType.cooldownSeconds > 0 ? ["AI Cooldown", `${aiType.cooldownSeconds}s`] : null,
                  ["Error Explanation", aiType.enableErrorExplanation ? "Enabled" : "Disabled", aiType.enableErrorExplanation ? "#60a5fa" : null],
                  ["RAG", aiType.enableRag ? "Enabled" : "Disabled", aiType.enableRag ? "#b298da" : null],
                  ["Show Solution", (aiType.showSolutionPolicy || "after_submission").replace(/_/g, " ")],
                ].filter(Boolean).map(([label, value, color], i, arr) => (
                  <div key={label} style={{ ...metaRow, borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: color || "rgba(255,255,255,0.7)", textTransform: "capitalize" }}>{value}</span>
                  </div>
                ))}
                {aiType.description && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 4 }}>{aiType.description}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstructorExerciseDetails