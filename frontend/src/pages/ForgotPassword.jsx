// ─────────────────────────────────────────────────────────────────────────────
// ForgotPassword.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff, CheckCircle, ArrowRight, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL_FP = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

export function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep]             = useState(1)
  const [email, setEmail]           = useState("")
  const [newPassword, setNewPassword]     = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError]           = useState("")
  const [loading, setLoading]       = useState(false)

  const handleCheckEmail = async () => {
    setError(""); if (!email.trim()) { setError("Please enter your email."); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL_FP}/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), newPassword: "CHECK_ONLY_DO_NOT_RESET" }) })
      if (res.status === 404) { setError("No account found with this email."); return }
      setStep(2)
    } catch { setError("Something went wrong. Please try again.") }
    finally { setLoading(false) }
  }

  const handleReset = async () => {
    setError("")
    if (!newPassword) { setError("Please enter a new password."); return }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL_FP}/auth/reset-password`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), newPassword }) })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || "Failed to reset password."); return }
      setStep(3)
    } catch { setError("Something went wrong. Please try again.") }
    finally { setLoading(false) }
  }

  const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }
  const btnPrimary = { width: "100%", padding: "12px", borderRadius: 10, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }

  return (
    <div style={{ minHeight: "100vh", background: "#120b22", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@1,300&display=swap'); .fp-input::placeholder{color:rgba(255,255,255,0.2);} .fp-input:focus{border-color:rgba(178,152,218,0.5)!important;box-shadow:0 0 0 3px rgba(142,125,165,0.12);}`}</style>
      <div style={{ position: "fixed", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(110,92,134,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, right: -80, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(62,39,100,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />

      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "40px 36px", width: "100%", maxWidth: 400, position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.4), transparent)", borderRadius: "24px 24px 0 0" }} />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 300, fontSize: "2.4rem", color: "rgba(240,236,218,0.95)", marginBottom: 8 }}>Learnix</h1>
          <div style={{ width: 48, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.5), transparent)", margin: "0 auto" }} />
        </div>

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginBottom: 4 }}>Reset Password</h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Enter your account email to get started</p>
            </div>
            <div style={{ position: "relative" }}>
              <Mail size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
              <input className="fp-input" type="email" placeholder="Email address" value={email} onChange={e => { setEmail(e.target.value); setError("") }} onKeyDown={e => e.key === "Enter" && handleCheckEmail()} style={{ ...inputStyle, paddingLeft: 40 }} />
            </div>
            {error && <p style={{ fontSize: 12, color: "#f87171" }}>{error}</p>}
            <button onClick={handleCheckEmail} disabled={loading} style={btnPrimary}>
              {loading ? <><Loader2 size={13} className="animate-spin" />Checking...</> : <>Continue <ArrowRight size={13} /></>}
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ textAlign: "center", marginBottom: 6 }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginBottom: 4 }}>New Password</h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Setting new password for <span style={{ color: "#b298da", fontWeight: 500 }}>{email}</span></p>
            </div>
            {[["New password", newPassword, setNewPassword, showNew, setShowNew], ["Confirm new password", confirmPassword, setConfirmPassword, false, null]].map(([ph, val, setVal, show, setShow]) => (
              <div key={ph} style={{ position: "relative" }}>
                <Lock size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                <input className="fp-input" type={show ? "text" : "password"} placeholder={ph} value={val} onChange={e => { setVal(e.target.value); setError("") }} style={{ ...inputStyle, paddingLeft: 40, paddingRight: setShow ? 40 : 14 }} />
                {setShow && <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>{show ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
              </div>
            ))}
            {error && <p style={{ fontSize: 12, color: "#f87171" }}>{error}</p>}
            <button onClick={handleReset} disabled={loading} style={btnPrimary}>
              {loading ? <><Loader2 size={13} className="animate-spin" />Resetting...</> : "Reset Password"}
            </button>
            <button onClick={() => { setStep(1); setError("") }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans',sans-serif" }}>← Change email</button>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle size={26} color="#4ade80" />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>Password Reset!</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>Your password has been updated successfully. You can now sign in with your new password.</p>
            <button onClick={() => navigate("/")} style={{ ...btnPrimary, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80" }}>Go to Login</button>
          </div>
        )}

        {step !== 3 && (
          <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 20 }}>
            Remember your password?{" "}
            <span onClick={() => navigate("/")} style={{ color: "#b298da", cursor: "pointer", fontWeight: 500 }}>Sign in</span>
          </p>
        )}
      </motion.div>
    </div>
  )
}

export default ForgotPassword