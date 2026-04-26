import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Copy, User, Loader2, Check } from "lucide-react"
import { motion } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function CourseStudents() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course,   setCourse]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState("")
  const [copied,   setCopied]   = useState(false)

  useEffect(() => {
    const fetchCourseStudents = async () => {
      setLoading(true); setError("")
      try {
        const token = localStorage.getItem("token")
        if (!token) { setError("No authentication token found"); setCourse(null); return }
        const resp = await fetch(`${API_BASE_URL}/courses/${id}/students`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await resp.json()
        if (!resp.ok) { setError(data.detail || "Failed to load course students"); setCourse(null); return }
        setCourse({
          courseId: data.courseId,
          courseName: data.courseName,
          code: data.enrollmentCode || data.courseId || "",
          students: Array.isArray(data.students) ? data.students : [],
        })
      } catch { setError("Failed to load students. Please try again."); setCourse(null) }
      finally { setLoading(false) }
    }
    fetchCourseStudents()
  }, [id])

  const inviteLink = course ? `${window.location.origin}/join-course/${course.code}` : ""

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const S = { // style helpers
    card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 26px", marginBottom: 24 },
    label: { fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, display: "block" },
    h1: { fontFamily: "'DM Sans',sans-serif", fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginBottom: 6 },
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.3)", fontSize: 13, padding: "40px 0", fontFamily: "'DM Sans',sans-serif" }}>
      <Loader2 size={18} className="animate-spin" style={{ color: "#8E7DA5" }} /> Loading students...
    </div>
  )

  if (error) return (
    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 18px", color: "#f87171", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
      {error}
    </div>
  )

  if (!course) return null

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <h1 style={S.h1}>Course Enrollment</h1>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 28 }}>
        {course.students.length} student{course.students.length !== 1 ? "s" : ""} enrolled
      </p>

      {/* Invite link */}
      <div style={S.card}>
        <span style={S.label}>Invitation Link</span>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={inviteLink}
            readOnly
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)", fontFamily: "'DM Sans',sans-serif", fontSize: 12,
              outline: "none",
            }}
          />
          <button
            onClick={copyLink}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "10px 18px",
              borderRadius: 10, cursor: "pointer",
              background: copied ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg,#8E7DA5,#6E5C86)",
              border: copied ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(178,152,218,0.25)",
              color: copied ? "#4ade80" : "white",
              fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
          </button>
        </div>
      </div>

      {/* Students list */}
      <div style={S.card}>
        <span style={S.label}>Enrolled Students</span>
        {course.students.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <User size={32} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 12px" }} />
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No students enrolled yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {course.students.map((student, index) => (
              <motion.div
                key={student.studentId || index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 14px", borderRadius: 10,
                  borderBottom: index < course.students.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(142,125,165,0.3), rgba(110,92,134,0.2))",
                    border: "1px solid rgba(178,152,218,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 600, color: "rgba(178,152,218,0.8)",
                  }}>
                    {(student.name || "?")[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)", marginBottom: 2 }}>
                      {student.name || "Unnamed Student"}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      {student.email || "No email"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/instructor/course/${id}/students/${student.studentId || index}/report`)}
                  style={{
                    padding: "7px 14px", borderRadius: 8,
                    background: "rgba(142,125,165,0.15)", border: "1px solid rgba(142,125,165,0.2)",
                    color: "rgba(178,152,218,0.8)", fontFamily: "'DM Sans',sans-serif",
                    fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(142,125,165,0.25)"; e.currentTarget.style.color = "rgba(255,255,255,0.9)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(142,125,165,0.15)"; e.currentTarget.style.color = "rgba(178,152,218,0.8)" }}
                >
                  View Report
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseStudents