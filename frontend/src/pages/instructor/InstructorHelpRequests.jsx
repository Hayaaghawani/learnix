import { useState, useEffect, useCallback } from "react"
import { Loader2, LifeBuoy, ChevronDown, ChevronUp, CheckCheck, Clock, User, BookOpen, Send, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000"

function InstructorHelpRequests() {
  const [requests, setRequests]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState("")
  const [expandedId, setExpandedId]     = useState(null)
  const [detailCache, setDetailCache]   = useState({})
  const [detailLoading, setDetailLoading] = useState(false)
  const [resolvingId, setResolvingId]   = useState(null)
  const [filterStatus, setFilterStatus] = useState("pending")
  const [replyText, setReplyText]       = useState({})
  const [replySending, setReplySending] = useState(null)
  const [replySuccess, setReplySuccess] = useState({})
  const [replyError, setReplyError]     = useState({})

  const token = localStorage.getItem("token")

  const loadRequests = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const res = await fetch(`${API_BASE_URL}/help-requests?status=${filterStatus}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error("Failed to fetch help requests.")
      const data = await res.json(); setRequests(data.requests || [])
    } catch (e) { setError(e.message || "Something went wrong.") }
    finally { setLoading(false) }
  }, [token, filterStatus])

  useEffect(() => { loadRequests() }, [loadRequests])

  const loadDetail = async (requestId) => {
    if (detailCache[requestId]) return
    setDetailLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/help-requests/${requestId}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error("Could not load details.")
      setDetailCache((prev) => ({ ...prev, [requestId]: await res.json() }))
    } catch { setDetailCache((prev) => ({ ...prev, [requestId]: { error: "Failed to load details." } })) }
    finally { setDetailLoading(false) }
  }

  const toggleExpand = async (requestId) => {
    if (expandedId === requestId) { setExpandedId(null); return }
    setExpandedId(requestId); await loadDetail(requestId)
  }

  const handleResolve = async (requestId) => {
    setResolvingId(requestId)
    try {
      const res = await fetch(`${API_BASE_URL}/help-requests/${requestId}/resolve`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "resolved" } : r)))
      if (expandedId === requestId) setExpandedId(null)
    } catch {} finally { setResolvingId(null) }
  }

  const handleSendReply = async (requestId) => {
    const text = (replyText[requestId] || "").trim(); if (!text || replySending === requestId) return
    setReplySending(requestId); setReplyError((prev) => ({ ...prev, [requestId]: "" }))
    try {
      const res = await fetch(`${API_BASE_URL}/help-requests/${requestId}/reply`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ reply: text }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setReplyError((prev) => ({ ...prev, [requestId]: data.detail || "Could not send reply." })); return }
      setReplySuccess((prev) => ({ ...prev, [requestId]: true })); setReplyText((prev) => ({ ...prev, [requestId]: "" }))
      setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "resolved", reply: text } : r)))
      setDetailCache((prev) => ({ ...prev, [requestId]: { ...prev[requestId], reply: text } }))
    } catch { setReplyError((prev) => ({ ...prev, [requestId]: "Network error. Try again." })) }
    finally { setReplySending(null) }
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length
  const S = {
    page: { minHeight: "100vh", background: "#120b22", fontFamily: "'DM Sans', sans-serif" },
    card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden", marginBottom: 8 },
  }

  return (
    <div style={S.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap'); .hr-input::placeholder{color:rgba(255,255,255,0.2);} .hr-input:focus{border-color:rgba(178,152,218,0.5)!important;box-shadow:0 0 0 3px rgba(142,125,165,0.12);}`}</style>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(142,125,165,0.15)", border: "1px solid rgba(142,125,165,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LifeBuoy size={18} color="#b298da" />
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginBottom: 2 }}>Student Help Requests</h1>
            <p style={{ fontSize: 11, color: pendingCount > 0 ? "rgba(251,191,36,0.7)" : "rgba(34,197,94,0.6)" }}>
              {pendingCount > 0 ? `${pendingCount} pending request${pendingCount !== 1 ? "s" : ""} need your attention` : "All caught up!"}
            </p>
          </div>
        </div>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 4 }}>
          {[{ value: "pending", label: "Pending" }, { value: "resolved", label: "Resolved" }, { value: "all", label: "All" }].map((tab) => (
            <button key={tab.value} type="button" onClick={() => setFilterStatus(tab.value)} style={{ padding: "6px 16px", borderRadius: 7, fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, cursor: "pointer", background: filterStatus === tab.value ? "rgba(142,125,165,0.2)" : "transparent", border: filterStatus === tab.value ? "1px solid rgba(178,152,218,0.25)" : "1px solid transparent", color: filterStatus === tab.value ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)", transition: "all 0.2s" }}>
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 32px" }}>
        {loading && <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}><Loader2 size={24} className="animate-spin" style={{ color: "#8E7DA5" }} /></div>}
        {error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", color: "#f87171", fontSize: 13 }}>{error}</div>}
        {!loading && !error && requests.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <LifeBuoy size={32} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No {filterStatus !== "all" ? filterStatus : ""} requests found.</p>
          </div>
        )}

        <div>
          {requests.map((req, i) => {
            const isExpanded = expandedId === req.id
            const d = detailCache[req.id]
            const alreadyReplied = req.reply || replySuccess[req.id]

            return (
              <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} style={S.card}>
                {/* Row */}
                <button type="button" onClick={() => toggleExpand(req.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: req.status === "pending" ? "#fbbf24" : "#4ade80", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", gap: 5 }}>
                        <User size={11} color="rgba(255,255,255,0.3)" />{req.studentName || "Student"}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>·</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 4 }}>
                        <BookOpen size={11} />{req.exerciseTitle || `Exercise #${req.exerciseId?.slice(0,8)}`}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{req.message}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={10} />{req.createdAt ? new Date(req.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </span>
                    {req.status === "resolved" && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", fontWeight: 500 }}>Resolved</span>}
                    {isExpanded ? <ChevronUp size={14} color="rgba(255,255,255,0.25)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.25)" />}
                  </div>
                </button>

                {/* Expanded */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ padding: "20px 18px", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: 18 }}>

                        {detailLoading && !d && <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}><Loader2 size={16} className="animate-spin" style={{ color: "#8E7DA5" }} /></div>}
                        {d?.error && <p style={{ fontSize: 12, color: "#f87171" }}>{d.error}</p>}

                        {d && !d.error && (
                          <>
                            {/* Message */}
                            <div>
                              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Student's Message</p>
                              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{req.message}</p>
                            </div>

                            {/* Code snapshot */}
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Code Snapshot</p>
                                {d.language && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(142,125,165,0.12)", border: "1px solid rgba(142,125,165,0.2)", color: "#b298da", fontWeight: 500 }}>{d.language}</span>}
                              </div>
                              <pre style={{ background: "#0d1117", color: "#4ade80", borderRadius: 10, padding: "12px 14px", fontSize: 11, fontFamily: "monospace", overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: 220 }}>{d.codeSnapshot || "No code snapshot available."}</pre>
                            </div>

                            {/* Submissions */}
                            <div>
                              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Submission History</p>
                              {!d.submissions || d.submissions.length === 0
                                ? <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No submissions yet.</p>
                                : (
                                  <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                      <thead>
                                        <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                                          {["Attempt", "Status", "Score", "Passed"].map(h => <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>)}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {d.submissions.map((s, idx) => (
                                          <tr key={idx} style={{ borderBottom: idx < d.submissions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                                            <td style={{ padding: "8px 12px", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>#{s.attemptNumber ?? idx + 1}</td>
                                            <td style={{ padding: "8px 12px" }}>
                                              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: s.status === "Passed" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${s.status === "Passed" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`, color: s.status === "Passed" ? "#4ade80" : "#f87171", fontWeight: 500 }}>{s.status}</span>
                                            </td>
                                            <td style={{ padding: "8px 12px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{s.score ?? "—"}%</td>
                                            <td style={{ padding: "8px 12px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{s.passedTestCases ?? "—"}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )
                              }
                            </div>

                            {/* Reply */}
                            <div>
                              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Reply to Student</p>
                              {(d.reply || replySuccess[req.id]) ? (
                                <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "12px 14px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                    <CheckCircle size={13} color="#4ade80" />
                                    <span style={{ fontSize: 11, fontWeight: 600, color: "#4ade80" }}>Reply sent</span>
                                  </div>
                                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", whiteSpace: "pre-wrap" }}>{d.reply || replyText[req.id]}</p>
                                </div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                  <textarea className="hr-input" value={replyText[req.id] || ""} onChange={(e) => setReplyText((prev) => ({ ...prev, [req.id]: e.target.value }))} placeholder="Type your reply to the student..." rows={4} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box", resize: "none" }} />
                                  {replyError[req.id] && <p style={{ fontSize: 11, color: "#f87171" }}>{replyError[req.id]}</p>}
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    {req.status === "pending" && (
                                      <button type="button" onClick={() => handleResolve(req.id)} disabled={resolvingId === req.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, cursor: "pointer", opacity: resolvingId === req.id ? 0.5 : 1 }}>
                                        {resolvingId === req.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}Mark Resolved
                                      </button>
                                    )}
                                    <button type="button" onClick={() => handleSendReply(req.id)} disabled={!replyText[req.id]?.trim() || replySending === req.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, cursor: (!replyText[req.id]?.trim() || replySending === req.id) ? "not-allowed" : "pointer", opacity: (!replyText[req.id]?.trim() || replySending === req.id) ? 0.4 : 1, marginLeft: "auto" }}>
                                      {replySending === req.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}Send Reply
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default InstructorHelpRequests