import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Trash2, Loader2, AlertCircle, Bell, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function StudentNotifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState("")
  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(() => fetchNotifications(), 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    setLoading(true); setError("")
    try {
      const token = localStorage.getItem("token"); if (!token) { setError("No authentication token found"); setLoading(false); return }
      const res = await fetch(`${API_BASE_URL}/notifications/my`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json(); setNotifications(data.notifications || [])
    } catch { setError("Failed to load notifications.") }
    finally { setLoading(false) }
  }

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/notifications/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      setNotifications(prev => prev.filter(n => n.notificationId !== id))
    } catch {}
  }

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n))
    } catch {}
  }

  const S = { page: { minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif" } }

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ background: "linear-gradient(135deg, rgba(142,125,165,0.18), rgba(110,92,134,0.1))", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(178,152,218,0.4), transparent)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(142,125,165,0.15)", border: "1px solid rgba(142,125,165,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={18} color="#b298da" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.92)", marginBottom: 2 }}>Messages</h1>
            <p style={{ fontSize: 11, color: unreadCount > 0 ? "rgba(251,191,36,0.7)" : "rgba(34,197,94,0.6)" }}>
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}` : "All caught up!"}
            </p>
          </div>
        </div>
        <button onClick={() => navigate("/student")} style={{ padding: "9px 18px", borderRadius: 10, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "white" }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)" }}>
          ← Dashboard
        </button>
      </motion.div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 40px" }}>
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
            <Loader2 size={20} className="animate-spin" style={{ color: "#8E7DA5" }} />Loading messages...
          </div>
        )}
        {!loading && error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "14px 18px", color: "#f87171", fontSize: 13 }}>
            {error}<button onClick={fetchNotifications} style={{ color: "#f87171", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", marginLeft: 8, fontSize: 13 }}>Try again</button>
          </div>
        )}
        {!loading && !error && notifications.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
            <AlertCircle size={32} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>No messages yet</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Instructors will send you messages here</p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifications.map((n, i) => (
            <motion.div key={n.notificationId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{ background: n.isRead ? "rgba(255,255,255,0.03)" : "rgba(142,125,165,0.08)", border: n.isRead ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(178,152,218,0.2)", borderLeft: `3px solid ${n.isRead ? "rgba(255,255,255,0.1)" : "#8E7DA5"}`, borderRadius: 12, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, transition: "all 0.2s" }}>
              <div style={{ flex: 1 }}>
                {/* Sender */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,rgba(142,125,165,0.3),rgba(110,92,134,0.2))", border: "1px solid rgba(178,152,218,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#b298da", flexShrink: 0 }}>
                    {(n.senderFirstName || "?")[0]}{(n.senderLastName || "")[0]}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{n.senderFirstName} {n.senderLastName}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{n.senderEmail}</p>
                  </div>
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 10 }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: n.isRead ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.92)", marginBottom: 8 }}>{n.title}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: 10, whiteSpace: "pre-wrap" }}>{n.message}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
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
      </div>
    </div>
  )
}

export default StudentNotifications