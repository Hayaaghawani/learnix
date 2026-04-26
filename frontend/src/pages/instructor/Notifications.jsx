import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Trash2, Loader2, AlertCircle, Send, Bell } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState("")
  const [studentEmail, setStudentEmail]   = useState("")
  const [notifTitle, setNotifTitle]       = useState("")
  const [notifMsg, setNotifMsg]           = useState("")
  const [sendLoading, setSendLoading]     = useState(false)
  const [sendError, setSendError]         = useState("")
  const [sendSuccess, setSendSuccess]     = useState("")

  useEffect(() => { fetchNotifications() }, [])

  const fetchNotifications = async () => {
    setLoading(true); setError("")
    try {
      const token = localStorage.getItem("token")
      if (!token) { setError("No authentication token found"); setLoading(false); return }
      const res = await fetch(`${API_BASE_URL}/notifications/my`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json(); setNotifications(data.notifications || [])
    } catch { setError("Failed to load notifications.") }
    finally { setLoading(false) }
  }

  const handleSend = async (e) => {
    e.preventDefault(); setSendError(""); setSendSuccess(""); setSendLoading(true)
    if (!studentEmail || !notifTitle || !notifMsg) { setSendError("Please fill in all fields"); setSendLoading(false); return }
    try {
      const token = localStorage.getItem("token")
      if (!token) { setSendError("No authentication token found"); setSendLoading(false); return }
      const res = await fetch(`${API_BASE_URL}/notifications/send`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ recipientEmail: studentEmail, title: notifTitle, message: notifMsg }) })
      const data = await res.json()
      if (!res.ok) { setSendError(data.detail || `Failed (${res.status})`); return }
      setSendSuccess("Message sent successfully!"); setStudentEmail(""); setNotifTitle(""); setNotifMsg("")
      fetchNotifications(); setTimeout(() => setSendSuccess(""), 3000)
    } catch (err) { setSendError(err.message || "Failed to send.") }
    finally { setSendLoading(false) }
  }

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n))
    } catch {}
  }

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/notifications/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      setNotifications(prev => prev.filter(n => n.notificationId !== id))
    } catch {}
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const S = {
    page:  { minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif" },
    card:  { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 26px", marginBottom: 20 },
    label: { fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 8 },
    input: { width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" },
  }

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap'); .notif-input::placeholder{color:rgba(255,255,255,0.2);} .notif-input:focus{border-color:rgba(178,152,218,0.5)!important;box-shadow:0 0 0 3px rgba(142,125,165,0.12);}`}</style>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ background: "linear-gradient(135deg, rgba(142,125,165,0.18), rgba(110,92,134,0.1))", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "28px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.4), transparent)" }} />
        <div>
          <p style={{ fontSize: 11, color: "rgba(178,152,218,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Instructor</p>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "rgba(255,255,255,0.92)", marginBottom: 4 }}>Notifications</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{unreadCount} unread message{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => navigate("/instructor")} style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "white" }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)" }}
        >
          ← Dashboard
        </button>
      </motion.div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 40px" }}>

        {/* Send form */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={S.card}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18 }}>Send Message to Student</p>

          <AnimatePresence>
            {sendSuccess && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "10px 14px", color: "#4ade80", fontSize: 12, marginBottom: 14 }}>{sendSuccess}</motion.div>}
            {sendError  && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 12, marginBottom: 14 }}>{sendError}</motion.div>}
          </AnimatePresence>

          <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={S.label}>Student Email</label>
              <input className="notif-input" type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} placeholder="student@example.com" style={S.input} required />
            </div>
            <div>
              <label style={S.label}>Message Title</label>
              <input className="notif-input" type="text" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="Enter message title" style={S.input} required />
            </div>
            <div>
              <label style={S.label}>Message Content</label>
              <textarea className="notif-input" value={notifMsg} onChange={e => setNotifMsg(e.target.value)} placeholder="Enter your message here..." rows={4} style={{ ...S.input, resize: "none" }} required />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => { setStudentEmail(""); setNotifTitle(""); setNotifMsg(""); setSendError(""); setSendSuccess("") }} style={{ padding: "10px 18px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer" }}>Clear</button>
              <button type="submit" disabled={sendLoading} style={{ padding: "10px 22px", borderRadius: 10, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: sendLoading ? "not-allowed" : "pointer", opacity: sendLoading ? 0.6 : 1, display: "flex", alignItems: "center", gap: 8 }}>
                {sendLoading ? <><Loader2 size={13} className="animate-spin" />Sending...</> : <><Send size={13} />Send Message</>}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Received */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Received Messages</p>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.3)", fontSize: 13, padding: "32px 0" }}>
              <Loader2 size={18} className="animate-spin" style={{ color: "#8E7DA5" }} />Loading messages...
            </div>
          ) : error ? (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "14px 18px", color: "#f87171", fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
              {error}<button onClick={fetchNotifications} style={{ color: "#f87171", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>Try again</button>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
              <Bell size={32} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No messages yet</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {notifications.map((n, i) => (
                <motion.div key={n.notificationId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={{ background: n.isRead ? "rgba(255,255,255,0.03)" : "rgba(142,125,165,0.08)", border: n.isRead ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(178,152,218,0.2)", borderRadius: 12, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, transition: "all 0.2s" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: n.isRead ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.9)", marginBottom: 6 }}>{n.title}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 8 }}>{n.message}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {!n.isRead && (
                      <button onClick={() => markAsRead(n.notificationId)} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(34,197,94,0.22)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(34,197,94,0.12)"}>
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={() => deleteNotification(n.notificationId)} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.18)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Notifications