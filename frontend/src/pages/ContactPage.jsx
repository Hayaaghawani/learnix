import { motion } from "framer-motion"

function ContactPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#120b22", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 16px", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@1,300&display=swap'); .ct-input::placeholder{color:rgba(255,255,255,0.2);} .ct-input:focus{border-color:rgba(178,152,218,0.5)!important;outline:none;box-shadow:0 0 0 3px rgba(142,125,165,0.12);}`}</style>

      {/* Ambient orbs */}
      <div style={{ position: "fixed", top: -100, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(110,92,134,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(62,39,100,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24, padding: "44px 40px", width: "100%", maxWidth: 460, position: "relative", zIndex: 1 }}
      >
        {/* Top gradient line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.5), transparent)", borderRadius: "24px 24px 0 0" }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "2.2rem", color: "rgba(240,236,218,0.92)", marginBottom: 8 }}>
            Contact Us
          </h1>
          <div style={{ width: 48, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.5), transparent)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif" }}>
            We'd love to hear from you.
          </p>
        </div>

        <form style={{ display: "flex", flexDirection: "column", gap: 12 }} onSubmit={e => e.preventDefault()}>
          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Your Name</label>
            <input className="ct-input" type="text" placeholder="Jane Smith" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, boxSizing: "border-box", transition: "border-color 0.2s" }} />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email Address</label>
            <input className="ct-input" type="email" placeholder="jane@example.com" style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, boxSizing: "border-box", transition: "border-color 0.2s" }} />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Message</label>
            <textarea className="ct-input" placeholder="How can we help you?" rows={5} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, resize: "none", boxSizing: "border-box", transition: "border-color 0.2s" }} />
          </div>

          <button
            type="submit"
            style={{ marginTop: 6, padding: "12px", borderRadius: 10, background: "linear-gradient(135deg, #8E7DA5, #6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.03em" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 24px rgba(110,92,134,0.45)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
          >
            Send Message
          </button>
        </form>

        {/* Footer links */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {["learnix100 on Instagram", "Facebook", "LinkedIn"].map((label, i) => (
            <span key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", cursor: "pointer", transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "rgba(178,152,218,0.7)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.2)"}
            >{label}</span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default ContactPage