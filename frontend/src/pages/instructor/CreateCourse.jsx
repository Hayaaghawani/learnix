// ─────────────────────────────────────────────────────────────────────────────
// CreateCourse.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2 } from "lucide-react"

const API_BASE_URL_CC = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

export function CreateCourse() {
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) { navigate("/"); return }
    try { const p = JSON.parse(storedUser); if (p.role !== "instructor") { navigate("/") } } catch { navigate("/") }
  }, [navigate])

  const [gradingType, setGradingType] = useState("first-second-final")
  const [course, setCourse] = useState({ name: "", code: "", languageUsed: "", startDate: "", endDate: "", description: "", first: 0, second: 0, midterm: 0, final: 0, coursework: 0 })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [allConcepts, setAllConcepts] = useState([])
  const [selectedConceptIds, setSelectedConceptIds] = useState(() => new Set())
  const [conceptsLoading, setConceptsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token"); if (!token) { setConceptsLoading(false); return }
    ;(async () => {
      try { const res = await fetch(`${API_BASE_URL_CC}/exercises/ai-catalog`, { headers: { Authorization: `Bearer ${token}` } }); if (res.ok) { const d = await res.json(); setAllConcepts(d.concepts || []) } }
      catch {} finally { setConceptsLoading(false) }
    })()
  }, [])

  const toggleConcept = (id) => setSelectedConceptIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const handleChange = (e) => setCourse({ ...course, [e.target.name]: e.target.value })

  const validateWeights = () => {
    let total = 0
    if (gradingType === "first-second-final") total = Number(course.first) + Number(course.second) + Number(course.final) + Number(course.coursework)
    if (gradingType === "mid-final") total = Number(course.midterm) + Number(course.final) + Number(course.coursework)
    if (gradingType === "af") total = Number(course.coursework)
    return total === 100
  }

  const handleCreate = async () => {
    if (!course.name || !course.code || !course.languageUsed || !course.startDate || !course.endDate) { setError("Please fill all required fields"); return }
    if (!validateWeights()) { setError("Assessment weights must equal 100%"); return }
    const token = localStorage.getItem("token"); const storedUser = localStorage.getItem("user")
    let parsedUser = null; try { parsedUser = JSON.parse(storedUser) } catch {}
    if (!token) { setError("You must be logged in"); return }
    if (!parsedUser || parsedUser.role !== "instructor") { setError("Only instructors can create courses."); return }
    setLoading(true); setError("")
    try {
      const res = await fetch(`${API_BASE_URL_CC}/courses/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ courseName: course.name, description: course.description, languageUsed: course.languageUsed, startDate: course.startDate, endDate: course.endDate, conceptIds: Array.from(selectedConceptIds) }) })
      if (!res.ok) { const e = await res.json(); setError(e.detail || "Failed to create course"); return }
      navigate("/instructor")
    } catch { setError("Failed to create course. Please try again.") }
    finally { setLoading(false) }
  }

  const S = {
    page:  { minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif", padding: "40px" },
    card:  { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 26px", marginBottom: 20 },
    label: { fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 8 },
    input: { width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box" },
  }

  const gradingTabs = [
    { id: "first-second-final", label: "First / Second / Final" },
    { id: "mid-final",          label: "Midterm / Final"        },
    { id: "af",                 label: "A–F Coursework"         },
  ]

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap'); .cc-input::placeholder{color:rgba(255,255,255,0.2);} .cc-input:focus{border-color:rgba(178,152,218,0.5)!important;box-shadow:0 0 0 3px rgba(142,125,165,0.12);} option{background:#1e0f38;color:rgba(255,255,255,0.8);}`}</style>

      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 4 }}>Create Course</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 28 }}>Set up a new course for your students</p>
        </motion.div>

        {/* Basic Info */}
        <div style={S.card}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18 }}>Basic Information</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[["name","Course Name"], ["code","Course Code"], ["languageUsed","Programming Language"]].map(([name,ph]) => (
              <input key={name} className="cc-input" name={name} placeholder={ph} onChange={handleChange} style={{ ...S.input, gridColumn: name === "languageUsed" ? "1 / -1" : undefined }} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[["startDate","Start Date","date"], ["endDate","End Date","date"]].map(([name,ph,type]) => (
              <div key={name}>
                <label style={S.label}>{ph}</label>
                <input className="cc-input" type={type} name={name} onChange={handleChange} style={{ ...S.input, colorScheme: "dark" }} />
              </div>
            ))}
          </div>
          <label style={S.label}>Description (optional)</label>
          <textarea className="cc-input" name="description" placeholder="Brief course description..." onChange={handleChange} rows={3} style={{ ...S.input, resize: "none" }} />
        </div>

        {/* Concepts */}
        <div style={S.card}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Course Concepts</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 14, lineHeight: 1.5 }}>Select topics this course covers — these drive AI exercise mode targeting.</p>
          {conceptsLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.3)", fontSize: 12 }}><Loader2 size={13} className="animate-spin" /> Loading concepts…</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, maxHeight: 200, overflowY: "auto", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 12 }}>
              {allConcepts.map((c) => (
                <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={selectedConceptIds.has(c.id)} onChange={() => toggleConcept(c.id)} style={{ accentColor: "#6E5C86" }} />
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{c.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Grading */}
        <div style={S.card}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Grading Structure</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {gradingTabs.map((t) => (
              <button key={t.id} onClick={() => setGradingType(t.id)} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", background: gradingType === t.id ? "rgba(142,125,165,0.2)" : "rgba(255,255,255,0.04)", border: gradingType === t.id ? "1px solid rgba(178,152,218,0.3)" : "1px solid rgba(255,255,255,0.08)", color: gradingType === t.id ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)", transition: "all 0.2s" }}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {gradingType === "first-second-final" && (
              <>{[["first","First Exam %"], ["second","Second Exam %"], ["final","Final Exam %"]].map(([n,p]) => (
                <div key={n}><label style={S.label}>{p}</label><input className="cc-input" type="number" name={n} style={S.input} onChange={handleChange} /></div>
              ))}</>
            )}
            {gradingType === "mid-final" && (
              <>{[["midterm","Midterm %"], ["final","Final %"]].map(([n,p]) => (
                <div key={n}><label style={S.label}>{p}</label><input className="cc-input" type="number" name={n} style={S.input} onChange={handleChange} /></div>
              ))}</>
            )}
            <div><label style={S.label}>Quizzes / Assignments %</label><input className="cc-input" type="number" name="coursework" style={S.input} onChange={handleChange} /></div>
          </div>
        </div>

        <AnimatePresence>
          {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", color: "#f87171", fontSize: 13, marginBottom: 16 }}>{error}</motion.div>}
        </AnimatePresence>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => navigate("/instructor")} style={{ padding: "11px 20px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleCreate} disabled={loading} style={{ padding: "11px 24px", borderRadius: 10, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8 }}
            onMouseEnter={e => !loading && (e.currentTarget.style.boxShadow = "0 6px 20px rgba(110,92,134,0.4)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
          >
            {loading ? <><Loader2 size={14} className="animate-spin" />Creating...</> : "Create Course"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateCourse