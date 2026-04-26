// ─────────────────────────────────────────────────────────────────────────────
// ProfilePage.jsx
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { User, Mail, BookOpen, Calendar, Code, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const ROLE_COLORS = {
  instructor: { bg: "rgba(142,125,165,0.15)", border: "rgba(178,152,218,0.25)", text: "#b298da" },
  student:    { bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.25)",  text: "#60a5fa" },
  admin:      { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.25)",   text: "#f87171" },
}

export function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState("")
  const [showPwSection, setShowPwSection] = useState(false)
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw]         = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]     = useState(false)
  const [pwError, setPwError]     = useState("")
  const [pwSuccess, setPwSuccess] = useState("")
  const [changingPw, setChangingPw] = useState(false)

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token"); if (!token) { navigate("/"); return }
      const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { setError("Failed to load profile."); return }
      const data = await res.json(); setUser(data.user)
    } catch { setError("Failed to load profile.") }
    finally { setLoading(false) }
  }

  const handleChangePassword = async () => {
    setPwError(""); setPwSuccess("")
    if (!currentPw || !newPw || !confirmPw) { setPwError("Please fill all password fields."); return }
    if (newPw !== confirmPw) { setPwError("New passwords do not match."); return }
    if (newPw.length < 6) { setPwError("New password must be at least 6 characters."); return }
    setChangingPw(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) })
      if (!res.ok) { const err = await res.json(); setPwError(err.detail || "Failed to change password."); return }
      setPwSuccess("Password changed successfully!"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); setShowPwSection(false)
    } catch { setPwError("Something went wrong.") }
    finally { setChangingPw(false) }
  }

  const getInitials = () => user ? `${user.firstname?.charAt(0) || ""}${user.lastname?.charAt(0) || ""}`.toUpperCase() : "?"
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Unknown"

  const S = {
    page: { minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif", padding: "36px 40px" },
    card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "22px 24px", marginBottom: 16 },
    label: { fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, display: "block" },
    input: { width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box" },
    metaRow: { display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  }

  if (loading) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "rgba(255,255,255,0.4)", fontSize: 14 }}>
      <Loader2 size={20} className="animate-spin" style={{ color: "#8E7DA5" }} />Loading profile...
    </div>
  )
  if (error) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>
    </div>
  )

  const rc = ROLE_COLORS[user?.role] || ROLE_COLORS.student

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap'); .pp-input::placeholder{color:rgba(255,255,255,0.2);} .pp-input:focus{border-color:rgba(178,152,218,0.5)!important;box-shadow:0 0 0 3px rgba(142,125,165,0.12);}`}</style>

      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ background: "linear-gradient(135deg, rgba(142,125,165,0.2), rgba(110,92,134,0.12))", border: "1px solid rgba(178,152,218,0.15)", borderRadius: 18, padding: "28px", marginBottom: 18, display: "flex", alignItems: "center", gap: 20, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.4), transparent)" }} />
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,rgba(142,125,165,0.4),rgba(110,92,134,0.3))", border: "2px solid rgba(178,152,218,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.9)", flexShrink: 0 }}>{getInitials()}</div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.92)", marginBottom: 4 }}>{user?.firstname} {user?.lastname}</h1>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>{user?.email}</p>
            <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text, fontWeight: 500, textTransform: "capitalize" }}>{user?.role}</span>
          </div>
        </motion.div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: user?.role === "student" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {[
            [BookOpen, user?.role === "instructor" ? "Courses Created" : "Courses Enrolled", user?.courseCount ?? 0, "#b298da"],
            ...(user?.role === "student" ? [[Code, "Exercises Attempted", user?.exerciseCount ?? 0, "#60a5fa"]] : []),
            [Calendar, "Member Since", formatDate(user?.joinDate), "#4ade80"],
          ].map(([Icon, label, value, color], i) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 18px", textAlign: "center" }}>
              <Icon size={20} color={color} style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: typeof value === "number" ? 20 : 13, fontWeight: 700, color, marginBottom: 4 }}>{value}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Info card */}
        <div style={S.card}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Account Information</p>
          {[
            [User,     "Full Name",      `${user?.firstname} ${user?.lastname}`],
            [Mail,     "Email Address",  user?.email],
            [BookOpen, "Role",           user?.role],
            [Calendar, "Joined",         formatDate(user?.joinDate)],
          ].map(([Icon, label, value], idx, arr) => (
            <div key={label} style={{ ...S.metaRow, borderBottom: idx < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <Icon size={14} color="#8E7DA5" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 2, textTransform: "capitalize" }}>{label}</p>
                <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)", textTransform: label === "Role" ? "capitalize" : undefined }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Change password */}
        <div style={S.card}>
          <button onClick={() => { setShowPwSection(!showPwSection); setPwError(""); setPwSuccess("") }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
            <Lock size={14} color="#8E7DA5" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", fontFamily: "'DM Sans',sans-serif" }}>Change Password</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{showPwSection ? "▲" : "▼"}</span>
          </button>
          <AnimatePresence>
            {showPwSection && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    ["Current Password", currentPw, setCurrentPw, showCurrent, setShowCurrent],
                    ["New Password",     newPw,     setNewPw,     showNew,     setShowNew],
                  ].map(([label, val, setVal, show, setShow]) => (
                    <div key={label}>
                      <label style={S.label}>{label}</label>
                      <div style={{ position: "relative" }}>
                        <input className="pp-input" type={show ? "text" : "password"} value={val} onChange={e => setVal(e.target.value)} style={{ ...S.input, paddingRight: 40 }} />
                        <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
                          {show ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <label style={S.label}>Confirm New Password</label>
                    <input className="pp-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} style={S.input} />
                  </div>
                  {pwError   && <p style={{ fontSize: 12, color: "#f87171" }}>{pwError}</p>}
                  {pwSuccess && <p style={{ fontSize: 12, color: "#4ade80" }}>{pwSuccess}</p>}
                  <button onClick={handleChangePassword} disabled={changingPw} style={{ padding: "10px", borderRadius: 10, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "none", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: changingPw ? "not-allowed" : "pointer", opacity: changingPw ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {changingPw ? <><Loader2 size={13} className="animate-spin" />Changing...</> : "Update Password"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "rgba(178,152,218,0.6)", fontFamily: "'DM Sans',sans-serif" }}
          onMouseEnter={e => e.currentTarget.style.color = "#b298da"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(178,152,218,0.6)"}>
          ← Go Back
        </button>
      </div>
    </div>
  )
}

export default ProfilePage