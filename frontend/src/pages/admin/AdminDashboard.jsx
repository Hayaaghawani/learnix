import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { Users, BookOpen, GraduationCap, Loader2, Plus, ToggleLeft, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
const COLORS = ["#8E7DA5", "#b298da"]

function AdminDashboard() {
  const [users, setUsers]           = useState([])
  const [courses, setCourses]       = useState([])
  const [stats, setStats]           = useState({})
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole]   = useState("Student")
  const [settings, setSettings]     = useState({ aiModel: "GPT-4o", hintLimit: 5, executionTimeout: 5 })
  const [error, setError]           = useState("")
  const [notice, setNotice]         = useState("")
  const [loading, setLoading]       = useState(true)

  const getHeaders = () => {
    const token = localStorage.getItem("token")
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  }

  const parseResponse = async (res, fallback) => {
    const data = await res.json()
    if (!res.ok) throw new Error(data?.detail || fallback)
    return data
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true); setError("")
      try { await Promise.all([fetchStats(), fetchUsers(), fetchCourses()]) }
      catch (err) { setError(err.message || "Failed to load admin dashboard data.") }
      finally { setLoading(false) }
    }
    loadData()
  }, [])

  const fetchStats   = async () => { const d = await parseResponse(await fetch(`${API_BASE_URL}/admin/stats`,   { headers: getHeaders() }), "Failed to load stats");   setStats(d) }
  const fetchUsers   = async () => { const d = await parseResponse(await fetch(`${API_BASE_URL}/admin/users`,   { headers: getHeaders() }), "Failed to load users");   setUsers(d.users || []) }
  const fetchCourses = async () => { const d = await parseResponse(await fetch(`${API_BASE_URL}/admin/courses`, { headers: getHeaders() }), "Failed to load courses"); setCourses(d.courses || []) }

  const sendInvite = async () => {
    if (!inviteEmail) return
    try {
      const d = await parseResponse(await fetch(`${API_BASE_URL}/admin/invite-user`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ email: inviteEmail, role: inviteRole.toLowerCase() }) }), "Failed to invite user")
      setInviteEmail(""); setNotice(`Invite sent. Temporary password: ${d.temporaryPassword}`)
      await Promise.all([fetchUsers(), fetchStats()])
      setTimeout(() => setNotice(""), 6000)
    } catch (err) { setError(err.message) }
  }

  const toggleUserStatus = async (id, active) => {
    try { await parseResponse(await fetch(`${API_BASE_URL}/admin/user/${id}/status`, { method: "PATCH", headers: getHeaders(), body: JSON.stringify({ active: !active }) }), "Failed to update user status"); await fetchUsers() }
    catch (err) { setError(err.message) }
  }

  const deleteUser = async (id) => {
    try { await parseResponse(await fetch(`${API_BASE_URL}/admin/user/${id}`, { method: "DELETE", headers: getHeaders() }), "Failed to delete user"); await Promise.all([fetchUsers(), fetchStats()]) }
    catch (err) { setError(err.message) }
  }

  const saveSettings = async () => {
    try { await parseResponse(await fetch(`${API_BASE_URL}/admin/settings`, { method: "PATCH", headers: getHeaders(), body: JSON.stringify(settings) }), "Failed to save settings"); setNotice("Settings saved successfully"); setTimeout(() => setNotice(""), 3000) }
    catch (err) { setError(err.message) }
  }

  const userChart = [
    { name: "Students",    value: stats.students    || 0 },
    { name: "Instructors", value: stats.instructors || 0 },
  ]

  const S = {
    card:   { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "22px 24px", marginBottom: 16 },
    label:  { fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 7, fontFamily: "'DM Sans',sans-serif" },
    input:  { width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" },
    secLabel: { fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18, display: "block", fontFamily: "'DM Sans',sans-serif" },
    th:     { padding: "10px 14px", fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, textAlign: "left", fontFamily: "'DM Sans',sans-serif" },
    td:     { padding: "11px 14px", fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans',sans-serif", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  }

  const btnPrimary = { padding: "9px 20px", borderRadius: 10, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }

  return (
    <div style={{ minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap'); .adm-input::placeholder{color:rgba(255,255,255,0.2);} .adm-input:focus{border-color:rgba(178,152,218,0.5)!important;box-shadow:0 0 0 3px rgba(142,125,165,0.12);} option{background:#1e0f38;color:rgba(255,255,255,0.8);}`}</style>

      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(110,92,134,0.16) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(62,39,100,0.18) 0%, transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "36px 40px 60px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, color: "rgba(178,152,218,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>System</p>
          <h1 style={{ fontSize: 26, fontWeight: 600, color: "rgba(255,255,255,0.92)" }}>Admin Dashboard</h1>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {error  && <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"12px 16px", color:"#f87171", fontSize:13, marginBottom:16 }}>{error}</motion.div>}
          {notice && <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:10, padding:"12px 16px", color:"#4ade80", fontSize:13, marginBottom:16 }}>{notice}</motion.div>}
        </AnimatePresence>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.3)", fontSize: 14, padding: "60px 0" }}>
            <Loader2 size={22} className="animate-spin" style={{ color: "#8E7DA5" }} /> Loading dashboard...
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
              {[
                [Users,          "Total Users",   stats.users       || 0, "#b298da"],
                [GraduationCap,  "Students",      stats.students    || 0, "#60a5fa"],
                [Users,          "Instructors",   stats.instructors || 0, "#fb923c"],
                [BookOpen,       "Courses",       stats.courses     || 0, "#4ade80"],
              ].map(([Icon, label, value, color], i) => (
                <motion.div key={label} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay: i*0.06 }} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"18px 20px", display:"flex", alignItems:"center", gap:14 }}>
                  <Icon size={20} color={color} />
                  <div>
                    <p style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:4 }}>{label}</p>
                    <p style={{ fontSize:22, fontWeight:700, color }}>{value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

              {/* Pie chart */}
              <div style={S.card}>
                <span style={S.secLabel}>User Distribution</span>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={userChart} dataKey="value" nameKey="name" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                      {userChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background:"rgba(28,16,50,0.95)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"rgba(255,255,255,0.8)", fontSize:12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Invite user */}
              <div style={S.card}>
                <span style={S.secLabel}>Invite User</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <label style={S.label}>Email Address</label>
                    <input className="adm-input" type="email" placeholder="user@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={S.input} />
                  </div>
                  <div>
                    <label style={S.label}>Role</label>
                    <select className="adm-input" value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ ...S.input, cursor: "pointer" }}>
                      <option>Student</option>
                      <option>Instructor</option>
                    </select>
                  </div>
                  <button onClick={sendInvite} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 7, width: "fit-content", marginTop: 4 }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(110,92,134,0.4)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                  >
                    <Plus size={14} /> Send Invite
                  </button>
                </div>
              </div>
            </div>

            {/* Users table */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <span style={S.secLabel}>Users</span>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      {["Name", "Email", "Role", "Status", "Actions"].map(h => <th key={h} style={S.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={5} style={{ ...S.td, textAlign: "center", color: "rgba(255,255,255,0.2)", padding: "24px" }}>No users found</td></tr>
                    ) : users.map(u => (
                      <tr key={u.id} style={{ transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={S.td}>{u.name}</td>
                        <td style={{ ...S.td, color: "rgba(255,255,255,0.4)" }}>{u.email}</td>
                        <td style={S.td}><span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:"rgba(142,125,165,0.12)", border:"1px solid rgba(142,125,165,0.2)", color:"#b298da", textTransform:"capitalize" }}>{u.role}</span></td>
                        <td style={S.td}><span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background: u.active ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border:`1px solid ${u.active ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, color: u.active ? "#4ade80" : "#f87171" }}>{u.active ? "Active" : "Inactive"}</span></td>
                        <td style={S.td}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => toggleUserStatus(u.id, u.active)} style={{ padding: "4px 10px", borderRadius: 7, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 5 }}><ToggleLeft size={12} />Toggle</button>
                            <button onClick={() => deleteUser(u.id)} style={{ padding: "4px 10px", borderRadius: 7, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 5 }}><Trash2 size={12} />Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Courses table */}
            <div style={{ ...S.card, marginBottom: 16 }}>
              <span style={S.secLabel}>Course Monitoring</span>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      {["Course", "Instructor", "Students", "Status"].map(h => <th key={h} style={S.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {courses.length === 0 ? (
                      <tr><td colSpan={4} style={{ ...S.td, textAlign: "center", color: "rgba(255,255,255,0.2)", padding: "24px" }}>No courses found</td></tr>
                    ) : courses.map(c => (
                      <tr key={c.id} style={{ transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={{ ...S.td, fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>{c.name}</td>
                        <td style={S.td}>{c.instructor}</td>
                        <td style={S.td}>{c.students}</td>
                        <td style={S.td}><span style={{ fontSize:10, padding:"2px 8px", borderRadius:99, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)", color:"#4ade80" }}>{c.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* System settings */}
            <div style={S.card}>
              <span style={S.secLabel}>System Settings</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={S.label}>AI Model</label>
                  <select className="adm-input" value={settings.aiModel} onChange={e => setSettings({ ...settings, aiModel: e.target.value })} style={{ ...S.input, cursor: "pointer" }}>
                    <option>GPT-4o</option>
                    <option>Claude</option>
                    <option>Gemini</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Hint Limit</label>
                  <input className="adm-input" type="number" value={settings.hintLimit} onChange={e => setSettings({ ...settings, hintLimit: e.target.value })} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Execution Timeout (s)</label>
                  <input className="adm-input" type="number" value={settings.executionTimeout} onChange={e => setSettings({ ...settings, executionTimeout: e.target.value })} style={S.input} />
                </div>
              </div>
              <button onClick={saveSettings} style={btnPrimary}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 6px 20px rgba(110,92,134,0.4)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              >
                Save Settings
              </button>
            </div>

            {/* Security logs — intentionally hidden */}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard