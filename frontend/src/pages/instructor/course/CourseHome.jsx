import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { BookOpen, Users, FileText, BarChart3, Brain } from "lucide-react"
import { motion } from "framer-motion"

function CourseHome() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)

  useEffect(() => {
    const courses = JSON.parse(localStorage.getItem("courses")) || []
    setCourse(courses[id])
  }, [id])

  if (!course) return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", color: "rgba(255,255,255,0.4)", fontSize: 14, padding: "40px 0" }}>
      Loading course...
    </div>
  )

  const SECTIONS = [
    { label: "Exercises",      desc: "Manage exercises and assignments",        Icon: BookOpen,  to: "exercises" },
    { label: "Enrollment",     desc: "View enrolled students and reports",       Icon: Users,     to: "students"  },
    { label: "Course Material",desc: "Upload learning resources",               Icon: FileText,  to: "material"  },
    { label: "AI Defaults",    desc: "Configure AI learning modes",             Icon: Brain,     to: "ai"        },
    { label: "Analytics",      desc: "Course performance insights",             Icon: BarChart3, to: "analytics" },
  ]

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginBottom: 6 }}>{course.name}</h1>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 32 }}>{course.description}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {SECTIONS.map(({ label, desc, Icon, to }, i) => {
          const [hovered, setHovered] = useState(false)
          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.4 }}
              onClick={() => navigate(`/instructor/course/${id}/${to}`)}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              style={{
                background: hovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                border: hovered ? "1px solid rgba(178,152,218,0.3)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: "24px", cursor: "pointer",
                transform: hovered ? "translateY(-3px)" : "translateY(0)",
                transition: "all 0.25s", boxShadow: hovered ? "0 10px 30px rgba(0,0,0,0.25)" : "none",
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(142,125,165,0.15)", border: "1px solid rgba(142,125,165,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Icon size={18} color={hovered ? "#b298da" : "rgba(178,152,218,0.5)"} style={{ transition: "color 0.2s" }} />
              </div>
              <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.85)", marginBottom: 6 }}>{label}</h3>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>{desc}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default CourseHome