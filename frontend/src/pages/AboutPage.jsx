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

function AboutPage() {
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
        <motion.div {...fade()} style={{ maxWidth: 820, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "clamp(2.2rem,5vw,3.8rem)", color: "rgba(240,236,218,0.92)", marginBottom: 18 }}>
            About Learnix
          </h1>
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.6), transparent)", margin: "0 auto 30px" }} />
          <p style={{ ...body, marginBottom: 14 }}>
            Learnix is a structured AI-guided learning platform designed to support foundational programming education within academically rigorous environments. Our platform integrates intelligent assistance directly into the learning process while preserving the principles of independent problem-solving, instructor oversight, and institutional integrity.
          </p>
          <p style={body}>
            Designed with both educators and students in mind, Learnix bridges the evolving intersection between artificial intelligence and formal instruction, providing scalable, ethically grounded AI support tailored specifically for early-stage computer science education.
          </p>
        </motion.div>
      </section>

      {/* MISSION */}
      <section style={{ ...alt, position: "relative", zIndex: 1 }}>
        <motion.div {...fade(0.1)} style={{ maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div>
            <h2 style={h2}>Our Mission</h2>
            <p style={body}>
              Our mission is to redefine the role of artificial intelligence in education. Rather than positioning AI as a source of immediate answers, Learnix is built to function as a guided instructional assistant. The system encourages reflective thinking, progressive hint delivery, and instructor-configurable boundaries that align with course objectives. By combining AI capabilities with pedagogical structure, Learnix promotes deeper conceptual understanding while maintaining transparency, fairness, and accountability.
            </p>
          </div>
          <div style={{ padding: "28px 32px", background: "rgba(142,125,165,0.08)", border: "1px solid rgba(178,152,218,0.15)", borderRadius: 16, fontSize: 20, fontStyle: "italic", color: "rgba(178,152,218,0.75)", fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.65 }}>
            "AI should guide the learner — not replace the learner."
          </div>
        </motion.div>
      </section>

      {/* CORE PRINCIPLES */}
      <section style={{ ...plain, position: "relative", zIndex: 1 }}>
        <motion.div {...fade(0.1)} style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ ...h2, textAlign: "center", marginBottom: 36 }}>Core Principles</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {["Ethical AI Integration", "Instructor Empowerment", "Structured Learning Paths", "Transparency & Accountability"].map((value, i) => (
              <motion.div key={value} {...fade(i * 0.08)}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "24px 18px", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.65)", transition: "all 0.25s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(142,125,165,0.1)"; e.currentTarget.style.borderColor = "rgba(178,152,218,0.2)" }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
              >
                {value}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* RESEARCH & PHILOSOPHY */}
      <section style={{ ...alt, position: "relative", zIndex: 1 }}>
        <motion.div {...fade(0.1)} style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ ...h2, textAlign: "center" }}>Research & Educational Philosophy</h2>
          {[
            "Learnix is informed by established research in computer science education, cognitive development, and instructional scaffolding. Studies consistently demonstrate that novice programmers benefit most from guided support that encourages problem decomposition, incremental reasoning, and reflective learning.",
            "Rather than delivering direct solutions, Learnix applies structured hinting, misconception detection, and progressive assistance aligned with course materials defined by instructors. This approach mirrors effective teaching assistant interactions while maintaining consistency, scalability, and measurable engagement metrics.",
            "Our philosophy centers on balancing technological innovation with pedagogical responsibility. Artificial intelligence, when integrated thoughtfully, should enhance cognitive development — not diminish it. Learnix is built to ensure that AI remains a tool for empowerment, not dependency.",
          ].map((text, i) => (
            <p key={i} style={{ ...body, marginBottom: 16 }}>{text}</p>
          ))}
        </motion.div>
      </section>

      {/* TEAM */}
      <section style={{ ...plain, position: "relative", zIndex: 1, textAlign: "center" }}>
        <motion.div {...fade(0.1)}>
          <h2 style={{ ...h2, textAlign: "center" }}>The Team Behind Learnix</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: 48, marginTop: 12, flexWrap: "wrap" }}>
            {["Tala Abu Mohammed", "Haya Alaghawani", "Hala Al Sallal"].map(name => (
              <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, rgba(142,125,165,0.25), rgba(110,92,134,0.15))", border: "1px solid rgba(178,152,218,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#b298da", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
                  {name[0]}
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.55)" }}>{name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  )
}

export default AboutPage