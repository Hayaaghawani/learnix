// ─────────────────────────────────────────────────────────────────────────────
// JoinCourse.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"

const API_BASE_URL_JC = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

export function JoinCourse() {
  const { joinKey } = useParams()
  const navigate = useNavigate()
  const [status, setStatus]   = useState("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!joinKey) { setStatus("error"); setMessage("Invalid enrollment link."); return }
    const enroll = async () => {
      const token = localStorage.getItem("token")
      if (!token) { setStatus("error"); setMessage("You must be logged in to join a course."); return }
      try {
        const res = await fetch(`${API_BASE_URL_JC}/courses/join`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ joinKey }) })
        const data = await res.json()
        if (!res.ok) { setStatus("error"); setMessage(data.detail || data.message || "Unable to join this course."); return }
        setStatus("success"); setMessage(data.message || "You have been enrolled in the course.")
      } catch { setStatus("error"); setMessage("Unable to join the course. Please try again later.") }
    }
    enroll()
  }, [joinKey])

  const isSuccess = status === "success"
  const isError   = status === "error"

  return (
    <div style={{ minHeight: "100vh", background: "#120b22", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 420, textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginBottom: 6 }}>Join Course</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 32 }}>Using enrollment link: <span style={{ color: "rgba(178,152,218,0.7)", fontFamily: "monospace" }}>{joinKey}</span></p>

        {status === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "20px 0" }}>
            <Loader2 size={32} className="animate-spin" style={{ color: "#8E7DA5" }} />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Joining course, please wait...</p>
          </div>
        )}

        {isSuccess && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={26} color="#4ade80" />
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>Enrollment successful!</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{message}</p>
            <button onClick={() => navigate("/student")} style={{ padding: "11px 28px", borderRadius: 10, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", marginTop: 6 }}>Go to Dashboard</button>
          </div>
        )}

        {isError && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle size={26} color="#f87171" />
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>Enrollment failed</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>{message}</p>
            <button onClick={() => navigate("/student")} style={{ padding: "11px 28px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer", marginTop: 6 }}>Back to Dashboard</button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ContactPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { motion as m2 } from "framer-motion"

export function ContactPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#120b22", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@1,300&display=swap'); .ct-input::placeholder{color:rgba(255,255,255,0.2);} .ct-input:focus{border-color:rgba(178,152,218,0.5)!important;outline:none;box-shadow:0 0 0 3px rgba(142,125,165,0.12);}`}</style>
      <m2.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 22, padding: "44px 40px", width: "100%", maxWidth: 440, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.4), transparent)" }} />
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "2rem", color: "rgba(240,236,218,0.9)", marginBottom: 4 }}>Contact Us</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>We'd love to hear from you.</p>
        </div>
        <form style={{ display: "flex", flexDirection: "column", gap: 12 }} onSubmit={e => e.preventDefault()}>
          {[["text", "Your Name"], ["email", "Email Address"]].map(([type, ph]) => (
            <input key={ph} className="ct-input" type={type} placeholder={ph} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, boxSizing: "border-box" }} />
          ))}
          <textarea className="ct-input" placeholder="Your message..." rows={4} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, resize: "none", boxSizing: "border-box" }} />
          <button type="submit" style={{ marginTop: 4, padding: "12px", borderRadius: 10, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(110,92,134,0.4)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
            Send Message
          </button>
        </form>
      </m2.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AboutPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { motion as m3 } from "framer-motion"

export function AboutPage() {
  const sectionStyle = (alt) => ({ padding: "80px 40px", background: alt ? "rgba(255,255,255,0.025)" : "transparent", borderTop: "1px solid rgba(255,255,255,0.05)" })
  const heading = { fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.88)", fontFamily: "'DM Sans',sans-serif", marginBottom: 20 }
  const body    = { fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.85, fontFamily: "'DM Sans',sans-serif", maxWidth: 700 }
  const fade    = (delay = 0) => ({ initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay }, viewport: { once: true } })

  return (
    <div style={{ minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@1,300&display=swap');`}</style>

      {/* Hero */}
      <section style={{ padding: "100px 40px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(110,92,134,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <m3.div {...fade()}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(2.5rem,5vw,4rem)", color: "rgba(240,236,218,0.92)", marginBottom: 16 }}>About Learnix</h1>
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.6), transparent)", margin: "0 auto 28px" }} />
          <p style={{ ...body, margin: "0 auto 16px" }}>Learnix is a structured AI-guided learning platform designed to support foundational programming education within academically rigorous environments. Our platform integrates intelligent assistance directly into the learning process while preserving the principles of independent problem-solving, instructor oversight, and institutional integrity.</p>
          <p style={{ ...body, margin: "0 auto" }}>Designed with both educators and students in mind, Learnix bridges the evolving intersection between artificial intelligence and formal instruction, providing scalable, ethically grounded AI support tailored for early-stage computer science education.</p>
        </m3.div>
      </section>

      {/* Mission */}
      <section style={sectionStyle(true)}>
        <m3.div {...fade(0.1)} style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <h2 style={heading}>Our Mission</h2>
            <p style={body}>Our mission is to redefine the role of artificial intelligence in education. Rather than positioning AI as a source of immediate answers, Learnix functions as a guided instructional assistant — encouraging reflective thinking, progressive hint delivery, and instructor-configurable boundaries aligned with course objectives.</p>
          </div>
          <div style={{ padding: "24px 28px", background: "rgba(142,125,165,0.08)", border: "1px solid rgba(178,152,218,0.15)", borderRadius: 14, fontSize: 18, fontStyle: "italic", color: "rgba(178,152,218,0.8)", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.6 }}>
            "AI should guide the learner — not replace the learner."
          </div>
        </m3.div>
      </section>

      {/* Core Principles */}
      <section style={sectionStyle(false)}>
        <m3.div {...fade(0.1)} style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ ...heading, textAlign: "center" }}>Core Principles</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 32 }}>
            {["Ethical AI Integration", "Instructor Empowerment", "Structured Learning Paths", "Transparency & Accountability"].map((v, i) => (
              <m3.div key={v} {...fade(i * 0.08)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "20px 16px", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>{v}</m3.div>
            ))}
          </div>
        </m3.div>
      </section>

      {/* Research */}
      <section style={sectionStyle(true)}>
        <m3.div {...fade(0.1)} style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={heading}>Research & Educational Philosophy</h2>
          {["Learnix is informed by established research in computer science education, cognitive development, and instructional scaffolding. Studies consistently demonstrate that novice programmers benefit most from guided support that encourages problem decomposition, incremental reasoning, and reflective learning.",
            "Rather than delivering direct solutions, Learnix applies structured hinting, misconception detection, and progressive assistance aligned with course materials defined by instructors — mirroring effective teaching assistant interactions while maintaining consistency and scalability.",
            "Our philosophy centers on balancing technological innovation with pedagogical responsibility. Artificial intelligence, when integrated thoughtfully, should enhance cognitive development — not diminish it."].map((text, i) => (
            <p key={i} style={{ ...body, marginBottom: 16 }}>{text}</p>
          ))}
        </m3.div>
      </section>

      {/* Team */}
      <section style={{ padding: "60px 40px", textAlign: "center" }}>
        <m3.div {...fade(0.1)}>
          <h2 style={{ ...heading, textAlign: "center" }}>The Team Behind Learnix</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 20 }}>
            {["Tala Abu Mohammed", "Haya Alaghawani", "Hala Al Sallal"].map(name => (
              <span key={name} style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", fontWeight: 400 }}>{name}</span>
            ))}
          </div>
        </m3.div>
      </section>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PrivacyPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { motion as m4 } from "framer-motion"

export function PrivacyPage() {
  const sectionStyle = (alt) => ({ padding: "80px 40px", background: alt ? "rgba(255,255,255,0.025)" : "transparent", borderTop: "1px solid rgba(255,255,255,0.05)" })
  const heading = { fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.88)", fontFamily: "'DM Sans',sans-serif", marginBottom: 20 }
  const body    = { fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.85, fontFamily: "'DM Sans',sans-serif" }
  const fade    = (delay = 0) => ({ initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay }, viewport: { once: true } })

  return (
    <div style={{ minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Hero */}
      <section style={{ padding: "100px 40px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(110,92,134,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
        <m4.div {...fade()}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(2.5rem,5vw,4rem)", color: "rgba(240,236,218,0.92)", marginBottom: 16 }}>Privacy & Data Protection</h1>
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.6), transparent)", margin: "0 auto 28px" }} />
          <p style={{ ...body, maxWidth: 700, margin: "0 auto 14px" }}>Learnix is committed to protecting the privacy of its users. As an educational platform designed for structured programming learning, we collect limited information required to support personalized feedback, instructor supervision, and academic integrity within the learning environment.</p>
          <p style={{ ...body, maxWidth: 700, margin: "0 auto" }}>Our privacy practices prioritize transparency, responsible data handling, and strict access control to ensure that student and instructor data remains protected throughout the learning process.</p>
        </m4.div>
      </section>

      {/* What we collect */}
      <section style={sectionStyle(true)}>
        <m4.div {...fade(0.1)} style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <h2 style={heading}>What Information We Collect</h2>
            <p style={{ ...body, marginBottom: 14 }}>Learnix stores only the information required to support educational workflows — account information such as name, email address, and role (student or instructor).</p>
            <p style={body}>The platform also records learning interactions including code submissions, execution results, hint requests, and activity timestamps. These records help generate learning analytics and personalized reports that guide students toward improvement.</p>
          </div>
          <div style={{ padding: "24px 28px", background: "rgba(142,125,165,0.08)", border: "1px solid rgba(178,152,218,0.15)", borderRadius: 14, fontSize: 18, fontStyle: "italic", color: "rgba(178,152,218,0.8)", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.6 }}>
            "Data should support learning — never exploit it."
          </div>
        </m4.div>
      </section>

      {/* How data supports learning */}
      <section style={sectionStyle(false)}>
        <m4.div {...fade(0.1)} style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ ...heading, textAlign: "center", marginBottom: 36 }}>How Data Supports Learning</h2>
          {[
            "When students interact with exercises, the system records key learning interactions such as code submissions, execution results, and AI hint requests.",
            "These interactions are analyzed to identify learning patterns, common misconceptions, and areas where students may struggle with programming concepts.",
            "The system then generates personalized learning reports and instructor analytics dashboards to support data-driven teaching and targeted student improvement.",
          ].map((text, i) => (
            <m4.div key={i} {...fade(i * 0.1)} style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(142,125,165,0.15)", border: "1px solid rgba(178,152,218,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#b298da", flexShrink: 0 }}>{i + 1}</div>
              <p style={body}>{text}</p>
            </m4.div>
          ))}
        </m4.div>
      </section>

      {/* Security */}
      <section style={sectionStyle(true)}>
        <m4.div {...fade(0.1)} style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={heading}>Security & Responsible Data Use</h2>
          {["Learnix implements security practices designed to protect user information and maintain system integrity. Data is stored in secure databases and protected through role-based access control, ensuring that only authorized instructors or administrators can view relevant analytics or reports.",
            "The platform limits AI access strictly to instructor-approved course materials. This ensures that generated hints remain aligned with official course content while preventing unsafe or unrelated responses.",
            "Our goal is to maintain a responsible AI learning environment where privacy, academic integrity, and student growth remain central priorities."].map((text, i) => (
            <p key={i} style={{ ...body, marginBottom: 14 }}>{text}</p>
          ))}
        </m4.div>
      </section>
    </div>
  )
}

export default JoinCourse