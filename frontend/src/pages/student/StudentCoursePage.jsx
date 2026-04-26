// ─────────────────────────────────────────────────────────────────────────────
// StudentCoursePage.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Download, FileText, BookOpen, Loader2 } from "lucide-react"
import { motion } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
const FILE_ICONS = { pdf: "📄", slides: "📊", doc: "📃", notes: "📝", article: "📰", default: "📁" }

export function StudentCoursePage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab]   = useState("exercises")
  const [course, setCourse]         = useState(null)
  const [exercises, setExercises]   = useState([])
  const [materials, setMaterials]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState("")

  useEffect(() => { fetchCourseData() }, [courseId])

  const fetchCourseData = async () => {
    setLoading(true); setError("")
    try {
      const token = localStorage.getItem("token")
      if (!token) { setError("Please log in to view this course."); setLoading(false); return }
      const [courseRes, exRes, matRes] = await Promise.all([
        fetch(`${API_BASE_URL}/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/exercises/course/${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/materials/course/${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (!courseRes.ok) throw new Error("Failed to load course details.")
      setCourse(await courseRes.json())
      if (exRes.ok)  { const d = await exRes.json();  setExercises(d.exercises || []) }
      if (matRes.ok) { const d = await matRes.json(); setMaterials(d.materials || []) }
    } catch { setError("Failed to load course. Please try again.") }
    finally { setLoading(false) }
  }

  const handleDownload = (material) => {
    const link = document.createElement("a"); link.href = material.content; link.download = material.filename; link.click()
  }
  const handleView = (material) => {
    const base64 = material.content.split(",")[1]; const mimeType = material.content.split(";")[0].split(":")[1]
    const bytes = atob(base64); const arr = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
    window.open(URL.createObjectURL(new Blob([arr], { type: mimeType })), "_blank")
  }

  const S = { page: { minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif" }, card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" } }

  if (loading) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
      <Loader2 size={20} className="animate-spin" style={{ color: "#8E7DA5" }} />Loading course...
    </div>
  )
  if (error) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#f87171", fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>{error}</p>
    </div>
  )

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, rgba(142,125,165,0.22), rgba(110,92,134,0.14))", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "28px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.4), transparent)" }} />
        <div>
          <p style={{ fontSize: 10, color: "rgba(178,152,218,0.6)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>{course?.languageUsed || "Course"}</p>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,0.92)", marginBottom: 4 }}>{course?.courseName}</h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            {course?.startDate && course?.endDate ? `${new Date(course.startDate).toLocaleDateString()} — ${new Date(course.endDate).toLocaleDateString()}` : ""}
          </p>
        </div>
        <button onClick={() => navigate(`/student/course/${courseId}/report`)} style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "white" }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)" }}
        >View My Report</button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 40px" }}>

        {/* Description */}
        <div style={{ ...S.card, marginBottom: 24 }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Course Description</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>{course?.description || "No description available."}</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["exercises", `Exercises (${exercises.length})`], ["materials", `Materials (${materials.length})`]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", background: activeTab === tab ? "linear-gradient(135deg,#8E7DA5,#6E5C86)" : "rgba(255,255,255,0.04)", border: activeTab === tab ? "1px solid rgba(178,152,218,0.3)" : "1px solid rgba(255,255,255,0.08)", color: activeTab === tab ? "white" : "rgba(255,255,255,0.4)", transition: "all 0.2s" }}>{label}</button>
          ))}
        </div>

        {/* Exercises */}
        {activeTab === "exercises" && (
          exercises.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", padding: "48px" }}>
              <BookOpen size={36} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No exercises available yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {exercises.map((ex, i) => {
                const preview = (ex.problem || "").trim().replace(/\s+/g, " ")
                return (
                  <motion.div key={ex.exerciseId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ ...S.card, cursor: "default", transition: "all 0.25s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = "rgba(178,152,218,0.2)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{ex.title}</h3>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(142,125,165,0.12)", border: "1px solid rgba(142,125,165,0.2)", color: "#b298da", textTransform: "capitalize", whiteSpace: "nowrap", marginLeft: 8 }}>{ex.exerciseType}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginBottom: 10, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {preview ? `${preview.slice(0, 140)}${preview.length > 140 ? "…" : ""}` : "Open to view the problem statement."}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginBottom: 14 }}>Due: {ex.dueDate ? new Date(ex.dueDate).toLocaleDateString() : "No due date"}</p>
                    <button onClick={() => navigate(`/exercise/${ex.exerciseId}/workspace`)} style={{ padding: "8px 16px", borderRadius: 8, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 14px rgba(110,92,134,0.4)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                    >Open Exercise →</button>
                  </motion.div>
                )
              })}
            </div>
          )
        )}

        {/* Materials */}
        {activeTab === "materials" && (
          materials.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", padding: "48px" }}>
              <FileText size={36} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No materials uploaded yet.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {materials.map((mat, i) => (
                <motion.div key={mat.materialId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={S.card}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                    <span style={{ fontSize: 28 }}>{FILE_ICONS[mat.filetype] || FILE_ICONS.default}</span>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>{mat.title}</h3>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>{mat.filename}</p>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)", textTransform: "capitalize" }}>{mat.filetype}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {mat.filetype === "pdf" && (
                      <button onClick={() => handleView(mat)} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "none", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>View</button>
                    )}
                    <button onClick={() => handleDownload(mat)} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(178,152,218,0.8)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Download size={13} />Download
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default StudentCoursePage