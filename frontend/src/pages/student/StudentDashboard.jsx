import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, BookOpen, RefreshCw, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const LANG_COLORS = {
  python:     { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.25)",  text: "#60a5fa" },
  "c++":      { bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.25)",  text: "#fb923c" },
  c:          { bg: "rgba(234,179,8,0.12)",   border: "rgba(234,179,8,0.25)",   text: "#facc15" },
  java:       { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)",   text: "#f87171" },
  javascript: { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.25)",   text: "#4ade80" },
  default:    { bg: "rgba(142,125,165,0.12)", border: "rgba(142,125,165,0.25)", text: "#b298da" },
}
const getLang = (lang) => LANG_COLORS[(lang || "").toLowerCase()] || LANG_COLORS.default

const deadlineColor = (dateStr) => {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
  if (diff <= 3) return "#f87171"
  if (diff <= 7) return "#fb923c"
  return "rgba(255,255,255,0.3)"
}

function StudentDashboard() {
  const navigate = useNavigate()
  const [joinInput, setJoinInput]           = useState("")
  const [courses, setCourses]               = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState("")
  const [joinError, setJoinError]           = useState("")
  const [joinSuccess, setJoinSuccess]       = useState("")
  const [joining, setJoining]               = useState(false)
  const [unreadCount, setUnreadCount]       = useState(0)
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
  const [deadlinesLoading, setDeadlinesLoading]   = useState(false)
  const [studentName, setStudentName]       = useState("")
  const [initials, setInitials]             = useState("ST")

  const parseJoinKey = (value) => {
    const trimmed = value.trim(); if (!trimmed) return ""
    try { const url = new URL(trimmed); const segs = url.pathname.split("/").filter(Boolean); return segs.length ? segs[segs.length - 1] : trimmed } catch { return trimmed }
  }

  const handleJoin = async () => {
    const key = parseJoinKey(joinInput); if (!key) return
    setJoinError(""); setJoinSuccess(""); setJoining(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/courses/join`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ joinKey: key }) })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.detail || "Invalid join code. Please try again."); return }
      setJoinSuccess(data.message || "Successfully joined the course!"); setJoinInput(""); fetchCourses()
    } catch { setJoinError("Something went wrong. Please try again.") }
    finally { setJoining(false) }
  }

  const fetchCourses = async () => {
    setLoading(true); setError("")
    try {
      const token = localStorage.getItem("token"); if (!token) { setError("Please log in."); setCourses([]); return }
      const res = await fetch(`${API_BASE_URL}/courses/my`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || "Failed to load courses."); setCourses([]); return }
      const nextCourses = data.courses || []; setCourses(nextCourses); fetchUpcomingDeadlines(nextCourses)
    } catch { setError("Failed to load courses."); setCourses([]); setUpcomingDeadlines([]) }
    finally { setLoading(false) }
  }

  const fetchUpcomingDeadlines = async (courseList) => {
    if (!courseList?.length) { setUpcomingDeadlines([]); return }
    setDeadlinesLoading(true)
    try {
      const token = localStorage.getItem("token"); if (!token) { setUpcomingDeadlines([]); return }
      const responses = await Promise.all(courseList.map(c => fetch(`${API_BASE_URL}/exercises/course/${c.courseId}`, { headers: { Authorization: `Bearer ${token}` } })))
      const payloads  = await Promise.all(responses.map(r => r.ok ? r.json() : { exercises: [] }))
      const today = new Date(); today.setHours(0,0,0,0)
      const deadlines = []
      payloads.forEach((payload, i) => {
        const course = courseList[i]
        ;(payload.exercises || []).forEach(ex => {
          if (!ex.dueDate) return; const due = new Date(ex.dueDate); due.setHours(0,0,0,0); if (due < today) return
          deadlines.push({ id: ex.exerciseId, title: ex.title, date: ex.dueDate, courseName: course.courseName })
        })
      })
      deadlines.sort((a, b) => new Date(a.date) - new Date(b.date))
      setUpcomingDeadlines(deadlines.slice(0, 8))
    } catch { setUpcomingDeadlines([]) }
    finally { setDeadlinesLoading(false) }
  }

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token"); if (!token) return
      const res = await fetch(`${API_BASE_URL}/notifications/my`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return; const data = await res.json()
      setUnreadCount((data.notifications || []).filter(n => !n.isRead).length)
    } catch {}
  }

  const fetchStudentName = async () => {
    try {
      const token = localStorage.getItem("token"); if (!token) return
      const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return; const data = await res.json()
      const first = data.user?.firstname || ""; const last = data.user?.lastname || ""
      setStudentName(first); setInitials(`${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "ST")
    } catch {}
  }

  useEffect(() => { fetchCourses(); fetchUnreadCount(); fetchStudentName() }, [])

  const S = { page: { minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" }, card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "22px 24px", marginBottom: 20 } }

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap'); .join-input::placeholder{color:rgba(255,255,255,0.2);} .join-input:focus{border-color:rgba(178,152,218,0.5)!important;outline:none;box-shadow:0 0 0 3px rgba(142,125,165,0.12);}`}</style>

      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -100, left: -120, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(110,92,134,0.18) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(62,39,100,0.2) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "36px 40px 60px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ ...S.card, background: "linear-gradient(135deg, rgba(142,125,165,0.18), rgba(110,92,134,0.1))", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.4), transparent)" }} />
          <div>
            <p style={{ fontSize: 11, color: "rgba(178,152,218,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Student Portal</p>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: "rgba(255,255,255,0.92)", marginBottom: 4 }}>Welcome back, {studentName || "Student"} 👋</h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              Enrolled in {courses.length} course{courses.length !== 1 ? "s" : ""}
              {unreadCount > 0 && ` · `}
              {unreadCount > 0 && <span style={{ color: "#fbbf24" }}>{unreadCount} unread</span>}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => navigate("/student/notifications")} title="Notifications" style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "white" }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)" }}>
              <Bell size={17} />
              {unreadCount > 0 && <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", color: "white", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
            <button onClick={() => navigate("/profile")} title="Profile" style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#8E7DA5,#5a4570)", border: "1px solid rgba(178,152,218,0.35)", color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>{initials}</button>
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
          <div>
            {/* Join a course */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={S.card}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Join a Course</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>Ask your instructor for the enrollment code</p>
              <div style={{ display: "flex", gap: 10 }}>
                <input className="join-input" type="text" value={joinInput} onChange={e => { setJoinInput(e.target.value); setJoinError(""); setJoinSuccess("") }} onKeyDown={e => e.key === "Enter" && handleJoin()} placeholder="Paste enrollment code or link..." style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }} />
                <button onClick={handleJoin} disabled={joining || !joinInput.trim()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: (joining || !joinInput.trim()) ? "not-allowed" : "pointer", opacity: (joining || !joinInput.trim()) ? 0.5 : 1 }}>
                  <Plus size={14} />{joining ? "Joining..." : "Join"}
                </button>
              </div>
              <AnimatePresence>
                {joinError   && <motion.p initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ fontSize:12, color:"#f87171", marginTop:10 }}>{joinError}</motion.p>}
                {joinSuccess && <motion.p initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ fontSize:12, color:"#4ade80", marginTop:10 }}>✓ {joinSuccess}</motion.p>}
              </AnimatePresence>
            </motion.div>

            {/* My Courses */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <BookOpen size={16} color="rgba(178,152,218,0.7)" />
                <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>My Courses</span>
                {!loading && <span style={{ fontSize: 10, color: "rgba(178,152,218,0.5)", background: "rgba(142,125,165,0.1)", border: "1px solid rgba(142,125,165,0.15)", borderRadius: 99, padding: "1px 8px" }}>{courses.length}</span>}
                <button onClick={fetchCourses} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                  onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
                ><RefreshCw size={12} />Refresh</button>
              </div>

              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>⏳ Loading your courses...</div>
              ) : error ? (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", color: "#f87171", fontSize: 13 }}>{error}</div>
              ) : courses.length === 0 ? (
                <div style={{ ...S.card, textAlign: "center", padding: "48px 40px" }}>
                  <BookOpen size={36} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>No courses yet</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Paste your enrollment code above to get started</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {courses.map((course, i) => {
                    const lc = getLang(course.languageUsed)
                    return (
                      <motion.div key={course.courseId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        onClick={() => navigate(`/student/course/${course.courseId}`)}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderTop: `2px solid ${lc.border}`, borderRadius: 14, padding: "18px 20px", cursor: "pointer", transition: "all 0.25s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{course.courseName}</h4>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: lc.bg, border: `1px solid ${lc.border}`, color: lc.text, fontWeight: 500, whiteSpace: "nowrap", marginLeft: 8 }}>{course.languageUsed || "General"}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.5, marginBottom: 12, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{course.description || "No description available."}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>📅 {course.startDate ? new Date(course.startDate).toLocaleDateString() : "TBD"}</p>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right sidebar: upcoming deadlines */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} style={{ ...S.card, alignSelf: "start", position: "sticky", top: 20 }}>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Upcoming Deadlines</p>
            {deadlinesLoading ? (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Loading deadlines...</p>
            ) : upcomingDeadlines.length === 0 ? (
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No upcoming deadlines.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {upcomingDeadlines.map((item) => (
                  <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.7)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.title}</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{item.courseName}</p>
                    </div>
                    <span style={{ fontSize: 11, color: deadlineColor(item.date), fontWeight: 500, marginLeft: 10, whiteSpace: "nowrap", flexShrink: 0 }}>{new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard