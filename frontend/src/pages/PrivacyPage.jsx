import { motion } from "framer-motion"

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay },
  viewport: { once: true },
})

const body  = { fontSize: 15, color: "rgba(255,255,255,0.45)", lineHeight: 1.85, fontFamily: "'DM Sans', sans-serif" }
const h2    = { fontSize: 28, fontWeight: 600, color: "rgba(255,255,255,0.88)", fontFamily: "'DM Sans', sans-serif", marginBottom: 20 }
const alt   = { padding: "80px 40px", borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.025)" }
const plain = { padding: "80px 40px", borderTop: "1px solid rgba(255,255,255,0.05)" }

function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@1,300&display=swap');`}</style>

      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(110,92,134,0.14) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(62,39,100,0.15) 0%, transparent 70%)" }} />
      </div>

      {/* HERO */}
      <section style={{ position: "relative", zIndex: 1, padding: "110px 40px 80px", textAlign: "center" }}>
        <motion.div {...fade()} style={{ maxWidth: 760, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(2.2rem,5vw,3.8rem)", color: "rgba(240,236,218,0.92)", marginBottom: 18 }}>
            Privacy & Data Protection
          </h1>
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.6), transparent)", margin: "0 auto 30px" }} />
          <p style={{ ...body, marginBottom: 14 }}>
            Learnix is committed to protecting the privacy of its users. As an educational platform designed for structured programming learning, we collect limited information required to support personalized feedback, instructor supervision, and academic integrity within the learning environment.
          </p>
          <p style={body}>
            Our privacy practices prioritize transparency, responsible data handling, and strict access control to ensure that student and instructor data remains protected throughout the learning process.
          </p>
        </motion.div>
      </section>

      {/* WHAT WE COLLECT */}
      <section style={{ ...alt, position: "relative", zIndex: 1 }}>
        <motion.div {...fade(0.1)} style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <h2 style={h2}>What Information We Collect</h2>
            <p style={{ ...body, marginBottom: 16 }}>
              Learnix stores only the information required to support educational workflows. This includes account information such as name, email address, and role (student or instructor).
            </p>
            <p style={body}>
              The platform also records learning interactions including code submissions, execution results, hint requests, and activity timestamps. These records help generate learning analytics and personalized reports that guide students toward improvement.
            </p>
          </div>
          <div style={{ padding: "28px 32px", background: "rgba(142,125,165,0.08)", border: "1px solid rgba(178,152,218,0.15)", borderRadius: 16, fontSize: 20, fontStyle: "italic", color: "rgba(178,152,218,0.75)", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.65 }}>
            "Data should support learning — never exploit it."
          </div>
        </motion.div>
      </section>

      {/* HOW DATA SUPPORTS LEARNING */}
      <section style={{ ...plain, position: "relative", zIndex: 1 }}>
        <motion.div {...fade(0.1)} style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ ...h2, textAlign: "center", marginBottom: 40 }}>How Data Supports Learning</h2>
          {[
            "When students interact with exercises, the system records key learning interactions such as code submissions, execution results, and AI hint requests.",
            "These interactions are analyzed to identify learning patterns, common misconceptions, and areas where students may struggle with programming concepts.",
            "The system then generates personalized learning reports and instructor analytics dashboards to support data-driven teaching and targeted student improvement.",
          ].map((text, i) => (
            <motion.div key={i} {...fade(i * 0.1)} style={{ display: "flex", alignItems: "flex-start", gap: 18, marginBottom: 28 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(142,125,165,0.15)", border: "1px solid rgba(178,152,218,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#b298da", flexShrink: 0 }}>{i + 1}</div>
              <p style={{ ...body, paddingTop: 8 }}>{text}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* SECURITY */}
      <section style={{ ...alt, position: "relative", zIndex: 1 }}>
        <motion.div {...fade(0.1)} style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ ...h2, textAlign: "center" }}>Security & Responsible Data Use</h2>
          {[
            "Learnix implements security practices designed to protect user information and maintain system integrity. Data is stored in secure databases and protected through role-based access control, ensuring that only authorized instructors or administrators can view relevant analytics or reports.",
            "The platform limits AI access strictly to instructor-approved course materials. This ensures that generated hints remain aligned with official course content while preventing unsafe or unrelated responses.",
            "Our goal is to maintain a responsible AI learning environment where privacy, academic integrity, and student growth remain central priorities.",
          ].map((text, i) => (
            <p key={i} style={{ ...body, marginBottom: 16 }}>{text}</p>
          ))}
        </motion.div>
      </section>
    </div>
  )
}

export default PrivacyPage