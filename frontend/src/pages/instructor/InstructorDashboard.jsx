import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Bell, BookOpen, AlertTriangle, Trash2, Loader2, LifeBuoy, Plus, RefreshCw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

// ── Confirm delete modal (replaces window.confirm) ───────────────────────────
function DeleteModal({ courseName, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(10,5,25,0.75)", backdropFilter: "blur(10px)" }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: "rgba(28,16,50,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 20,
          padding: "32px",
          width: "100%",
          maxWidth: 380,
        }}
      >
        <div className="flex justify-center mb-5">
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Trash2 size={20} color="#f87171" />
          </div>
        </div>
        <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 17, color: "rgba(255,255,255,0.92)", textAlign: "center", marginBottom: 8 }}>
          Delete Course?
        </h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.38)", textAlign: "center", marginBottom: 24, lineHeight: 1.6 }}>
          <span style={{ color: "rgba(255,255,255,0.6)" }}>"{courseName}"</span> will be permanently deleted along with all its exercises and data.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px", borderRadius: 10,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.55)",
            fontFamily: "'DM Sans',sans-serif", fontSize: 13,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.09)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
          >
            Cancel
          </button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px", borderRadius: 10,
            background: "linear-gradient(135deg,#ef4444,#dc2626)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "white",
            fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500,
            cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(239,68,68,0.35)"; e.currentTarget.style.transform = "translateY(-1px)" }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)" }}
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Course card ───────────────────────────────────────────────────────────────
function CourseCard({ course, instructorUsername, onDelete, onNavigate, index }) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
        border: hovered ? "1px solid rgba(178,152,218,0.3)" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "24px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.3)" : "none",
        backdropFilter: "blur(12px)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle top glow on hover */}
      {hovered && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.5), transparent)",
        }} />
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0 pr-3">
          <h3 style={{
            fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 15,
            color: "rgba(255,255,255,0.88)", marginBottom: 4,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {course.courseName}
          </h3>
          {instructorUsername && (
            <p style={{
              fontFamily: "'DM Sans',sans-serif", fontSize: 11,
              color: "rgba(255,255,255,0.25)", letterSpacing: "0.02em",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              Code: <span style={{ color: "rgba(178,152,218,0.6)", fontWeight: 500 }}>{instructorUsername}{course.courseId.slice(0, 8)}</span>
            </p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          style={{
            padding: "6px", borderRadius: 8, border: "none", background: "transparent",
            color: "rgba(255,255,255,0.2)", cursor: "pointer",
            transition: "all 0.2s", flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.1)" }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.2)"; e.currentTarget.style.background = "transparent" }}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <p style={{
        fontFamily: "'DM Sans',sans-serif", fontSize: 12,
        color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginBottom: 16,
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {course.description || "No description provided"}
      </p>

      <div className="flex justify-between items-center">
        <span style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 11,
          color: "rgba(178,152,218,0.7)", background: "rgba(142,125,165,0.12)",
          border: "1px solid rgba(142,125,165,0.2)", borderRadius: 6,
          padding: "2px 8px",
        }}>
          {course.languageUsed || "—"}
        </span>
        <span style={{
          fontFamily: "'DM Sans',sans-serif", fontSize: 11,
          color: "rgba(255,255,255,0.25)",
        }}>
          {course.startDate ? new Date(course.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
        </span>
      </div>
    </motion.div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
function InstructorDashboard() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [user, setUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null) // { courseId, courseName }

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)) }
      catch (e) { console.warn("Unable to parse stored user:", e) }
    }
    fetchCourses()
  }, [])

  const instructorUsername = user?.email?.split("@")[0]?.toLowerCase() || ""
  const firstName = user?.firstname || "Instructor"

  const fetchCourses = async () => {
    setLoading(true); setError("")
    try {
      const token = localStorage.getItem("token")
      if (!token) { setError("No authentication token found"); setLoading(false); return }
      const response = await fetch(`${API_BASE_URL}/courses/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error(`Failed to fetch courses: ${response.status}`)
      const data = await response.json()
      setCourses(data.courses || [])
    } catch (err) {
      console.error("Error fetching courses:", err)
      setError("Failed to load courses. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const { courseId } = deleteTarget
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.detail || "Failed to delete course")
        return
      }
      setCourses(courses.filter(c => c.courseId !== courseId))
    } catch (err) {
      console.error("Error deleting course:", err)
      alert("Failed to delete course. Please try again.")
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@1,300&display=swap');
      `}</style>

      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -120, left: -120, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(110,92,134,0.18) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(62,39,100,0.2) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", right: "20%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(142,125,165,0.07) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1280, margin: "0 auto", padding: "40px 40px 60px" }}>

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "linear-gradient(135deg, rgba(142,125,165,0.18) 0%, rgba(110,92,134,0.12) 100%)",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 20,
            padding: "32px 36px",
            marginBottom: 40,
            backdropFilter: "blur(16px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative gradient line at top */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 1,
            background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.4), transparent)",
          }} />

          <div>
            <p style={{ fontSize: 12, color: "rgba(178,152,218,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>
              Instructor Portal
            </p>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.92)", marginBottom: 6, lineHeight: 1.2 }}>
              Welcome back, {firstName}
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
              Manage your courses, track student progress, and respond to help requests.
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>

            {/* Notifications */}
            <button
              onClick={() => navigate("/instructor/notifications")}
              title="Notifications"
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "white" }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)" }}
            >
              <Bell size={17} />
            </button>

            {/* Help Requests */}
            <button
              onClick={() => navigate("/instructor/help-requests")}
              title="Student Help Requests"
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "white" }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)" }}
            >
              <LifeBuoy size={17} />
            </button>

            {/* Separator */}
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.1)" }} />

            {/* Create Course */}
            <button
              onClick={() => navigate("/instructor/create-course")}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 20px", borderRadius: 10,
                background: "linear-gradient(135deg, #8E7DA5, #6E5C86)",
                border: "1px solid rgba(178,152,218,0.25)",
                color: "white", fontFamily: "'DM Sans',sans-serif",
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                transition: "all 0.25s", letterSpacing: "0.02em",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(110,92,134,0.45)"; e.currentTarget.style.transform = "translateY(-1px)" }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)" }}
            >
              <Plus size={15} />
              Create Course
            </button>
          </div>
        </motion.div>

        {/* ── MY COURSES ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <BookOpen size={17} color="rgba(178,152,218,0.7)" />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.8)", letterSpacing: "0.02em" }}>
                My Courses
              </h2>
              {!loading && (
                <span style={{
                  fontSize: 11, color: "rgba(178,152,218,0.6)",
                  background: "rgba(142,125,165,0.12)", border: "1px solid rgba(142,125,165,0.2)",
                  borderRadius: 99, padding: "1px 8px",
                }}>
                  {courses.length}
                </span>
              )}
            </div>
            {!loading && (
              <button
                onClick={fetchCourses}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, color: "rgba(255,255,255,0.3)",
                  background: "none", border: "none", cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
              >
                <RefreshCw size={12} /> Refresh
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 0", color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
              <Loader2 size={22} className="animate-spin" style={{ color: "#8E7DA5" }} />
              Loading your courses...
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 12, padding: "16px 20px",
                color: "#f87171", fontSize: 13, display: "flex", alignItems: "center", gap: 10,
              }}
            >
              {error}
              <button onClick={fetchCourses} style={{ color: "#f87171", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
                Try again
              </button>
            </motion.div>
          ) : courses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                textAlign: "center", padding: "60px 40px",
                background: "rgba(255,255,255,0.03)",
                border: "1px dashed rgba(255,255,255,0.1)",
                borderRadius: 16,
              }}
            >
              <BookOpen size={40} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 16px" }} />
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 20 }}>
                No courses created yet
              </p>
              <button
                onClick={() => navigate("/instructor/create-course")}
                style={{
                  padding: "10px 24px", borderRadius: 10,
                  background: "linear-gradient(135deg, #8E7DA5, #6E5C86)",
                  border: "1px solid rgba(178,152,218,0.25)",
                  color: "white", fontFamily: "'DM Sans',sans-serif",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}
              >
                Create Your First Course
              </button>
            </motion.div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 48 }}>
              {courses.map((course, i) => (
                <CourseCard
                  key={course.courseId}
                  course={course}
                  instructorUsername={instructorUsername}
                  index={i}
                  onNavigate={() => navigate(`/instructor/course/${course.courseId}/exercises`)}
                  onDelete={() => setDeleteTarget({ courseId: course.courseId, courseName: course.courseName })}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* ── ACADEMIC ALERTS ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <AlertTriangle size={17} color="rgba(251,191,36,0.7)" />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.8)", letterSpacing: "0.02em" }}>
              Academic Alerts
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Plagiarism alert */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              style={{
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.18)",
                borderRadius: 14, padding: "20px 22px",
                transition: "all 0.25s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.11)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.28)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.07)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.18)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 15 }}>🚨</span>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, color: "#f87171" }}>
                  Potential Plagiarism Detected
                </p>
              </div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(248,113,113,0.65)", lineHeight: 1.6 }}>
                High similarity detected in "Sum of Array" assignment.
              </p>
            </motion.div>

            {/* AI over-reliance alert */}
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              style={{
                background: "rgba(251,191,36,0.06)",
                border: "1px solid rgba(251,191,36,0.15)",
                borderRadius: 14, padding: "20px 22px",
                transition: "all 0.25s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(251,191,36,0.1)"; e.currentTarget.style.borderColor = "rgba(251,191,36,0.25)" }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(251,191,36,0.06)"; e.currentTarget.style.borderColor = "rgba(251,191,36,0.15)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 15 }}>🤖</span>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13, color: "#fbbf24" }}>
                  AI Over-reliance Warning
                </p>
              </div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(251,191,36,0.55)", lineHeight: 1.6 }}>
                A student requested multiple hints without attempts.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            courseName={deleteTarget.courseName}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default InstructorDashboard