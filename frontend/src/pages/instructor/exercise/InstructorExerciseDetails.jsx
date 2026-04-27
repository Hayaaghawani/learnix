import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Calendar, Clock, Code2, Eye, EyeOff,
  Users, CheckCircle2, XCircle, BarChart2, Loader2,
  BookOpen, Cpu, Trophy, AlertCircle, ChevronDown,
  ChevronUp, TrendingUp, Zap, HardDrive, Lightbulb
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

// ── Dark tooltip for recharts ─────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "rgba(18,8,36,0.97)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "8px 12px", fontFamily: "'DM Sans',sans-serif", fontSize: 12 }}>
      {label && <p style={{ color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#b298da", fontWeight: 500 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, index }) {
  const p = {
    purple: { bg: "rgba(142,125,165,0.12)", border: "rgba(142,125,165,0.22)", text: "#b298da" },
    green:  { bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.18)",   text: "#4ade80" },
    blue:   { bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.18)",  text: "#60a5fa" },
    amber:  { bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.18)",  text: "#fbbf24" },
    red:    { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.18)",   text: "#f87171" },
  }
  const c = p[color] || p.purple
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.06, duration: 0.4 }}
      style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 9, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} color={c.text} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{label}</p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 20, fontWeight: 700, color: c.text, lineHeight: 1 }}>{value}</p>
        {sub && <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.22)", marginTop: 3 }}>{sub}</p>}
      </div>
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
function InstructorExerciseDetails() {
  const { exerciseId, courseId } = useParams()
  const navigate = useNavigate()

  const [exercise,    setExercise]    = useState(null)
  const [attempts,    setAttempts]    = useState([])
  const [dbStats,     setDbStats]     = useState(null)   // pre-computed from backend
  const [aiType,      setAiType]      = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState("")
  const [showSolution, setShowSolution] = useState(false)
  const [expandedTc,  setExpandedTc]  = useState(null)
  const [expandedCode, setExpandedCode] = useState(null) // show submitted code per row

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError("")
      try {
        const token   = localStorage.getItem("token")
        const headers = { Authorization: `Bearer ${token}` }

        // 1. Exercise details
        const exRes = await fetch(`${API_BASE_URL}/exercises/${exerciseId}`, { headers })
        if (!exRes.ok) throw new Error("Could not load exercise")
        const exData = await exRes.json()
        setExercise(exData)

        // 2. AI type
        if (exData.typeId) {
          const tr = await fetch(`${API_BASE_URL}/exercises/types/course/${exData.courseId}`, { headers })
          if (tr.ok) { const td = await tr.json(); setAiType((td.types || []).find(t => t.typeId === exData.typeId) || null) }
        }

        // 3. ALL student attempts for this exercise (new instructor endpoint)
        //    Falls back to the generic /sandbox/attempts endpoint if the
        //    instructor-specific one isn't registered yet.
        try {
          const ar = await fetch(`${API_BASE_URL}/attempts/exercise/${exerciseId}/all`, { headers })
          if (ar.ok) {
            const ad = await ar.json()
            setAttempts(ad.attempts || [])
            setDbStats(ad.stats   || null)
          } else {
            // fallback
            const fr = await fetch(`${API_BASE_URL}/sandbox/attempts/${exerciseId}`, { headers })
            if (fr.ok) { const fd = await fr.json(); setAttempts(fd.attempts || []) }
          }
        } catch {
          const fr = await fetch(`${API_BASE_URL}/sandbox/attempts/${exerciseId}`, { headers })
          if (fr.ok) { const fd = await fr.json(); setAttempts(fd.attempts || []) }
        }

      } catch (e) { setError(e.message || "Failed to load exercise details") }
      finally { setLoading(false) }
    }
    load()
  }, [exerciseId, courseId])

  // ── Derived stats (computed client-side as fallback if dbStats absent) ──────
  const totalSubs    = dbStats?.total      ?? attempts.length
  const passedCount  = dbStats?.passed     ?? attempts.filter(a => a.status === "Passed").length
  const failedCount  = dbStats?.failed     ?? (totalSubs - passedCount)
  const passRate     = dbStats?.passRate   ?? (totalSubs ? Math.round(passedCount / totalSubs * 100) : 0)
  const avgScore     = dbStats?.avgScore   ?? (totalSubs ? Math.round(attempts.reduce((s, a) => s + (a.score || 0), 0) / totalSubs) : 0)
  const highScore    = dbStats?.highScore  ?? (totalSubs ? Math.max(...attempts.map(a => a.score || 0)) : 0)
  const uniqueCount  = dbStats?.uniqueStudents ?? (new Set(attempts.map(a => a.userId).filter(Boolean)).size || totalSubs)
  const totalHints   = dbStats?.totalHints ?? attempts.reduce((s, a) => s + (a.hintCount || 0), 0)
  const avgRuntime   = dbStats?.avgRuntimeMs
  const avgMemory    = dbStats?.avgMemoryKb

  // ── Chart data ─────────────────────────────────────────────────────────────
  const pieData = [
    { name: "Passed", value: passedCount },
    { name: "Failed", value: failedCount },
  ].filter(d => d.value > 0)
  const PIE_COLORS = ["#4ade80", "#f87171"]

  const scoreBuckets = [
    { range: "0–19",   min: 0,  max: 19  },
    { range: "20–39",  min: 20, max: 39  },
    { range: "40–59",  min: 40, max: 59  },
    { range: "60–79",  min: 60, max: 79  },
    { range: "80–100", min: 80, max: 100 },
  ].map(b => ({
    range: b.range,
    Submissions: attempts.filter(a => (a.score || 0) >= b.min && (a.score || 0) <= b.max).length,
  }))

  const timeline = attempts.slice(0, 25).map((a, i) => ({
    attempt: `#${a.attemptNumber || i + 1}`,
    Score:   Math.round(a.score || 0),
  }))

  // Per-student best score summary
  const perStudent = Object.values(
    attempts.reduce((acc, a) => {
      const key = a.userId || a.studentEmail || `s${a.attemptNumber}`
      if (!acc[key]) acc[key] = { name: a.studentName || a.studentEmail || "Student", attempts: 0, bestScore: 0, passed: false, hints: 0 }
      acc[key].attempts++
      if ((a.score || 0) > acc[key].bestScore) acc[key].bestScore = a.score || 0
      if (a.status === "Passed") acc[key].passed = true
      acc[key].hints += a.hintCount || 0
      return acc
    }, {})
  )

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#120b22", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={30} className="animate-spin" style={{ color: "#8E7DA5" }} />
    </div>
  )
  if (error) return (
    <div style={{ minHeight: "100vh", background: "#120b22", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "40px", textAlign: "center" }}>
        <AlertCircle size={34} style={{ color: "#f87171", margin: "0 auto 12px" }} />
        <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 16, fontSize: 14 }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ color: "#b298da", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>← Go back</button>
      </div>
    </div>
  )
  if (!exercise) return null

  const visibleTc = (exercise.testCases || []).filter(tc => tc.isVisible)
  const hiddenTc  = (exercise.testCases || []).filter(tc => !tc.isVisible)
  const dueDate   = exercise.dueDate   ? new Date(exercise.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "No due date"
  const createdAt = exercise.createdAt ? new Date(exercise.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"

  const card   = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px", marginBottom: 14 }
  const secLbl = { fontSize: 9, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14, display: "block" }
  const metaR  = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }

  const scoreColor = (s) => s >= 80 ? "#4ade80" : s >= 50 ? "#fbbf24" : "#f87171"

  return (
    <div style={{ minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>

      {/* ── Header ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "13px 32px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => navigate(`/instructor/course/${courseId}/exercises`)}
          style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(178,152,218,0.65)", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif", transition: "color 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.color = "#b298da"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(178,152,218,0.65)"}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
        <h1 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.84)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{exercise.title}</h1>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>Created {createdAt}</span>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1260, margin: "0 auto" }}>

        {/* ── Stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, marginBottom: 20 }}>
          <StatCard index={0} icon={Users}       label="Total Submissions"  value={totalSubs}              color="purple" />
          <StatCard index={1} icon={CheckCircle2} label="Pass Rate"         value={`${passRate}%`}         color="green"  sub={`${passedCount} passed`} />
          <StatCard index={2} icon={Trophy}       label="Avg Score"         value={`${avgScore}%`}         color="blue"   sub={`Best: ${highScore}%`} />
          <StatCard index={3} icon={TrendingUp}   label="Students"          value={uniqueCount}            color="purple" sub="attempted" />
          <StatCard index={4} icon={Lightbulb}    label="Total Hints Used"  value={totalHints}             color="amber" />
          {avgRuntime != null && <StatCard index={5} icon={Zap}         label="Avg Runtime"   value={`${avgRuntime}ms`}  color="blue" />}
          {avgMemory  != null && <StatCard index={6} icon={HardDrive}   label="Avg Memory"    value={`${avgMemory}KB`}   color="purple" />}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 18 }}>

          {/* ── LEFT ── */}
          <div>

            {/* Problem */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <BookOpen size={15} color="#8E7DA5" />
                <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Problem Statement</p>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.48)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {exercise.problem || <span style={{ fontStyle: "italic", color: "rgba(255,255,255,0.2)" }}>No problem statement.</span>}
              </p>
            </motion.div>

            {/* Analytics charts */}
            {totalSubs > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} style={card}>
                <span style={secLbl}>Submission Analytics — {totalSubs} total attempts from {uniqueCount} student{uniqueCount !== 1 ? "s" : ""}</span>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

                  {/* Score distribution */}
                  <div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginBottom: 10 }}>Score Distribution</p>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={scoreBuckets} barSize={22}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="range" tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.22)", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} width={22} />
                        <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                        <Bar dataKey="Submissions" fill="#8E7DA5" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pass/fail pie */}
                  <div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginBottom: 6 }}>Pass / Fail</p>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={3}>
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                        </Pie>
                        <Tooltip content={<DarkTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 2 }}>
                      {pieData.map((d, i) => (
                        <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: PIE_COLORS[i] }} />
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>{d.name}: {d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Score trend */}
                {timeline.length > 1 && (
                  <div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginBottom: 8 }}>Score Trend (latest {timeline.length} submissions)</p>
                    <ResponsiveContainer width="100%" height={90}>
                      <LineChart data={timeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="attempt" tick={{ fill: "rgba(255,255,255,0.22)", fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis domain={[0,100]} tick={{ fill: "rgba(255,255,255,0.22)", fontSize: 9 }} axisLine={false} tickLine={false} width={22} />
                        <Tooltip content={<DarkTooltip />} />
                        <Line type="monotone" dataKey="Score" stroke="#b298da" strokeWidth={2} dot={{ r: 3, fill: "#b298da", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Per-student summary ── */}
            {perStudent.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} style={card}>
                <span style={secLbl}>Per-Student Summary ({perStudent.length} student{perStudent.length !== 1 ? "s" : ""})</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 70px 60px", gap: 6, padding: "5px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 7, marginBottom: 4 }}>
                  {["Student", "Attempts", "Best Score", "Status", "Hints"].map(h => (
                    <span key={h} style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
                  ))}
                </div>
                <div style={{ maxHeight: 240, overflowY: "auto" }}>
                  {perStudent.sort((a, b) => b.bestScore - a.bestScore).map((s, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 70px 80px 70px 60px", gap: 6, padding: "8px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textAlign: "center" }}>{s.attempts}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                          <div style={{ width: `${s.bestScore}%`, height: "100%", background: scoreColor(s.bestScore), borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(s.bestScore), minWidth: 28 }}>{Math.round(s.bestScore)}%</span>
                      </div>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, fontWeight: 500, width: "fit-content",
                        background: s.passed ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
                        border: `1px solid ${s.passed ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.15)"}`,
                        color: s.passed ? "#4ade80" : "#f87171",
                      }}>{s.passed ? "Passed" : "Failed"}</span>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>{s.hints}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── All raw attempts ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <BarChart2 size={15} color="#8E7DA5" />
                <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>All Submission Details</p>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{totalSubs} total</span>
              </div>
              {attempts.length === 0 ? (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No submissions yet.</p>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 70px 80px 70px 70px 70px", gap: 6, padding: "5px 8px", background: "rgba(255,255,255,0.03)", borderRadius: 7, marginBottom: 4 }}>
                    {["Student / #", "Status", "Score", "TC Passed", "Runtime", "Memory", "Hints"].map(h => (
                      <span key={h} style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
                    ))}
                  </div>
                  <div style={{ maxHeight: 360, overflowY: "auto" }}>
                    {attempts.map((a, i) => {
                      const codeOpen = expandedCode === i
                      return (
                        <div key={i}>
                          <div
                            style={{ display: "grid", gridTemplateColumns: "1.4fr 90px 70px 80px 70px 70px 70px", gap: 6, padding: "9px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", cursor: "pointer", transition: "background 0.15s" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            onClick={() => setExpandedCode(codeOpen ? null : i)}
                          >
                            {/* Student name + attempt# */}
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {a.studentName || a.studentEmail || `Attempt #${a.attemptNumber || i+1}`}
                              </p>
                              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontFamily: "monospace" }}>#{a.attemptNumber || i+1}</p>
                            </div>
                            {/* Status */}
                            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, fontWeight: 500, width: "fit-content",
                              background: a.status === "Passed" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
                              border: `1px solid ${a.status === "Passed" ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.15)"}`,
                              color: a.status === "Passed" ? "#4ade80" : "#f87171",
                            }}>{a.status}</span>
                            {/* Score */}
                            <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(a.score || 0) }}>{Math.round(a.score ?? 0)}%</span>
                            {/* TC passed */}
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                              {a.passedTestCases != null
                                ? `${a.passedTestCases}/${exercise.testCases?.length || (a.execPassedCount != null ? a.execPassedCount + (a.execFailedCount || 0) : "?")}`
                                : (a.execPassedCount != null ? `${a.execPassedCount}/${a.execPassedCount + (a.execFailedCount||0)}` : "—")}
                            </span>
                            {/* Runtime */}
                            <span style={{ fontSize: 11, color: a.runtimeMs != null ? "rgba(96,165,250,0.8)" : "rgba(255,255,255,0.2)" }}>
                              {a.runtimeMs != null ? `${a.runtimeMs}ms` : "—"}
                            </span>
                            {/* Memory */}
                            <span style={{ fontSize: 11, color: a.memoryKb != null ? "rgba(178,152,218,0.7)" : "rgba(255,255,255,0.2)" }}>
                              {a.memoryKb != null ? `${a.memoryKb}KB` : "—"}
                            </span>
                            {/* Hints */}
                            <span style={{ fontSize: 12, color: (a.hintCount || 0) > 0 ? "#fbbf24" : "rgba(255,255,255,0.25)" }}>
                              {a.hintCount ?? 0}
                            </span>
                          </div>

                          {/* Expandable submitted code + stderr */}
                          <AnimatePresence>
                            {codeOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                                <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                  {a.submittedCode && (
                                    <>
                                      <p style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Submitted Code</p>
                                      <pre style={{ background: "#0d1117", color: "#4ade80", borderRadius: 8, padding: "10px 12px", fontSize: 11, fontFamily: "monospace", overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: 200 }}>
                                        {a.submittedCode}
                                      </pre>
                                    </>
                                  )}
                                  {a.stderr && (
                                    <div style={{ marginTop: 8 }}>
                                      <p style={{ fontSize: 9, color: "rgba(239,68,68,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Stderr / Errors</p>
                                      <pre style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)", color: "#f87171", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontFamily: "monospace", overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: 100 }}>
                                        {a.stderr}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>↑ Click a row to expand submitted code & error output</p>
                </>
              )}
            </motion.div>

            {/* Test cases */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} style={card}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Code2 size={15} color="#8E7DA5" />
                <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Test Cases</p>
                <div style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.15)", color: "#4ade80" }}>{visibleTc.length} visible</span>
                  {hiddenTc.length > 0 && <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 99, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}>{hiddenTc.length} hidden</span>}
                </div>
              </div>
              {(exercise.testCases || []).length === 0
                ? <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No test cases defined.</p>
                : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {(exercise.testCases || []).map((tc, i) => (
                      <div key={tc.testCaseId || i} style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, overflow: "hidden" }}>
                        <button onClick={() => setExpandedTc(expandedTc === i ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "rgba(255,255,255,0.03)", border: "none", cursor: "pointer" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {tc.isVisible ? <Eye size={12} color="#4ade80" /> : <EyeOff size={12} color="rgba(255,255,255,0.2)" />}
                            <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>Case {i + 1}</span>
                            <span style={{ fontSize: 9, padding: "1px 7px", borderRadius: 99, background: tc.isVisible ? "rgba(34,197,94,0.09)" : "rgba(255,255,255,0.04)", color: tc.isVisible ? "#4ade80" : "rgba(255,255,255,0.22)", border: `1px solid ${tc.isVisible ? "rgba(34,197,94,0.16)" : "rgba(255,255,255,0.07)"}` }}>
                              {tc.isVisible ? "Visible" : "Hidden"}
                            </span>
                          </div>
                          {expandedTc === i ? <ChevronUp size={12} color="rgba(255,255,255,0.18)" /> : <ChevronDown size={12} color="rgba(255,255,255,0.18)" />}
                        </button>
                        <AnimatePresence>
                          {expandedTc === i && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.16 }} style={{ overflow: "hidden" }}>
                              <div style={{ padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {[["Input", tc.input || "(empty)"], ["Expected Output", tc.expectedOutput || "(empty)"]].map(([lbl, val]) => (
                                  <div key={lbl}>
                                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{lbl}</p>
                                    <pre style={{ background: "rgba(255,255,255,0.04)", borderRadius: 7, padding: "7px 10px", fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.58)", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{val}</pre>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )
              }
            </motion.div>

            {/* Reference solution */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Code2 size={15} color="#8E7DA5" />
                  <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>Reference Solution</p>
                </div>
                <button onClick={() => setShowSolution(v => !v)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#b298da", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  {showSolution ? <EyeOff size={12} /> : <Eye size={12} />}{showSolution ? "Hide" : "Show"}
                </button>
              </div>
              <AnimatePresence mode="wait">
                {showSolution
                  ? <motion.pre key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "#0d1117", color: "#4ade80", borderRadius: 9, padding: "13px 15px", fontSize: 12, fontFamily: "monospace", overflowX: "auto", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{exercise.referenceSolution || "No solution provided."}</motion.pre>
                  : <motion.div key="h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 9, padding: "22px", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.16)", fontStyle: "italic" }}>Solution hidden — click "Show" to reveal</motion.div>
                }
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ── RIGHT sidebar ── */}
          <div>

            {/* Exercise info */}
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }} style={card}>
              <span style={secLbl}>Exercise Info</span>
              {[
                [Calendar, "Due Date",   dueDate],
                [BarChart2, "Difficulty", exercise.difficultyLevel || "—"],
                [Code2,    "Type",       exercise.exerciseType    || "—"],
                ...(exercise.prerequisites ? [[BookOpen, "Prerequisites", exercise.prerequisites]] : []),
              ].map(([Icon, label, value], idx, arr) => (
                <div key={label} style={{ ...metaR, borderBottom: idx < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon size={12} color="#8E7DA5" />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.32)" }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.68)", textAlign: "right", maxWidth: 130, wordBreak: "break-word" }}>{value}</span>
                </div>
              ))}
              <div style={{ ...metaR, borderBottom: "none", marginTop: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={12} color="#8E7DA5" />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.32)" }}>Status</span>
                </div>
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99,
                  background: exercise.isActive ? "rgba(34,197,94,0.09)"   : "rgba(255,255,255,0.04)",
                  border:     `1px solid ${exercise.isActive ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.07)"}`,
                  color:      exercise.isActive ? "#4ade80" : "rgba(255,255,255,0.28)"
                }}>{exercise.isActive ? "Active" : "Inactive"}</span>
              </div>
            </motion.div>

            {/* Performance summary */}
            {totalSubs > 0 && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.17 }} style={card}>
                <span style={secLbl}>Performance Summary</span>
                {[
                  ["Total Attempts",  totalSubs],
                  ["Passed",          `${passedCount} (${passRate}%)`],
                  ["Failed",          `${failedCount} (${100-passRate}%)`],
                  ["Average Score",   `${avgScore}%`],
                  ["Best Score",      `${highScore}%`],
                  ["Avg Hints / Sub", totalSubs ? (totalHints / totalSubs).toFixed(1) : "—"],
                  ...(avgRuntime != null ? [["Avg Runtime",  `${avgRuntime} ms`]] : []),
                  ...(avgMemory  != null ? [["Avg Memory",   `${avgMemory} KB`]]  : []),
                ].map(([label, value], i, arr) => (
                  <div key={label} style={{ ...metaR, borderBottom: i < arr.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.32)" }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.72)" }}>{value}</span>
                  </div>
                ))}

                {/* Progress bars */}
                <div style={{ marginTop: 14 }}>
                  {[
                    ["Pass rate", passRate, "#4ade80", "rgba(34,197,94,0.15)"],
                    ["Avg score", avgScore, "#60a5fa", "rgba(59,130,246,0.12)"],
                  ].map(([lbl, val, col, trackCol]) => (
                    <div key={lbl} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>{lbl}</span>
                        <span style={{ fontSize: 10, color: col, fontWeight: 600 }}>{val}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 99, background: trackCol, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${val}%`, borderRadius: 99, background: col, transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AI Mode */}
            {aiType && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }} style={card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Cpu size={14} color="#8E7DA5" />
                  <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>AI Mode</p>
                  <span style={{ marginLeft: "auto", fontSize: 9, padding: "2px 8px", borderRadius: 99, background: "rgba(142,125,165,0.12)", border: "1px solid rgba(142,125,165,0.2)", color: "#b298da", textTransform: "capitalize" }}>{aiType.name}</span>
                </div>
                {[
                  ["Adaptive Hints",    aiType.enableAdaptiveHints ? "Enabled" : "Disabled", aiType.enableAdaptiveHints ? "#4ade80" : null],
                  ...(aiType.enableAdaptiveHints && aiType.hintLimit != null ? [["Hint Limit", `${aiType.hintLimit}`, null]] : []),
                  ...(aiType.cooldownSeconds > 0 ? [["Cooldown", `${aiType.cooldownSeconds}s`, null]] : []),
                  ["Error Explanation", aiType.enableErrorExplanation ? "On" : "Off", aiType.enableErrorExplanation ? "#60a5fa" : null],
                  ["RAG",              aiType.enableRag ? "On" : "Off", aiType.enableRag ? "#b298da" : null],
                  ["Solution Policy",  (aiType.showSolutionPolicy || "after_submission").replace(/_/g, " "), null],
                ].map(([label, value, color], i, arr) => (
                  <div key={label} style={{ ...metaR, borderBottom: i < arr.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.32)" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: color || "rgba(255,255,255,0.62)", textTransform: "capitalize" }}>{value}</span>
                  </div>
                ))}
                {aiType.description && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", fontStyle: "italic", paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 6, lineHeight: 1.5 }}>{aiType.description}</p>}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstructorExerciseDetails