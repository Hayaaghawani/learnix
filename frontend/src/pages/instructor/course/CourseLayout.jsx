import { Outlet, useParams, NavLink, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { BookOpen, Users, FileText, BarChart3, Brain, Loader2 } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const NAV_ITEMS = [
  { to: "exercises", label: "Exercises",  Icon: BookOpen  },
  { to: "students",  label: "Students",   Icon: Users     },
  { to: "material",  label: "Materials",  Icon: FileText  },
  { to: "ai",        label: "AI Modes",   Icon: Brain     },
  { to: "analytics", label: "Analytics",  Icon: BarChart3 },
]

function CourseLayout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState("")

  useEffect(() => { fetchCourse() }, [id])

  const fetchCourse = async () => {
    setLoading(true); setError("")
    try {
      const token = localStorage.getItem("token")
      if (!token) { setError("No authentication token found"); setLoading(false); return }
      const res = await fetch(`${API_BASE_URL}/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Failed: ${res.status}`)
      setCourse(await res.json())
    } catch {
      setError("Failed to load course details")
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#120b22", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        .sidebar-link { display:flex; align-items:center; gap:10px; padding:9px 14px; border-radius:10px; font-size:13px; font-weight:400; color:rgba(255,255,255,0.45); transition:all 0.2s; text-decoration:none; }
        .sidebar-link:hover { color:rgba(255,255,255,0.85); background:rgba(255,255,255,0.06); }
        .sidebar-link.active { color:rgba(255,255,255,0.92); background:rgba(142,125,165,0.18); border:1px solid rgba(178,152,218,0.2); font-weight:500; }
        .sidebar-link.active .nav-icon { color:#b298da; }
        .nav-icon { color:rgba(255,255,255,0.3); transition:color 0.2s; }
        .sidebar-link:hover .nav-icon { color:rgba(255,255,255,0.7); }
      `}</style>

      {/* ── Sidebar ── */}
      <div style={{
        width: 220, flexShrink: 0,
        background: "rgba(255,255,255,0.03)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column",
        padding: "28px 16px",
        position: "sticky", top: 57, height: "calc(100vh - 57px)",
      }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16, paddingLeft: 6 }}>
          Course
        </p>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={`/instructor/course/${id}/${to}`}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <Icon size={15} className="nav-icon" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Course header strip */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "14px 32px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          {loading ? (
            <Loader2 size={14} className="animate-spin" style={{ color: "#8E7DA5" }} />
          ) : error ? (
            <span style={{ fontSize: 12, color: "#f87171" }}>{error}</span>
          ) : course ? (
            <>
              <button
                onClick={() => navigate("/instructor")}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
              >
                Dashboard
              </button>
              <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>/</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{course.courseName}</span>
              <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>/</span>
              <span style={{ fontSize: 12, color: "rgba(178,152,218,0.6)" }}>
                {course.languageUsed} · {new Date(course.startDate).toLocaleDateString()} – {new Date(course.endDate).toLocaleDateString()}
              </span>
            </>
          ) : null}
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: "auto", padding: "32px" }}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default CourseLayout