import { useState, useEffect, useCallback } from "react"
import { Loader2, LifeBuoy, ChevronDown, ChevronUp, CheckCheck, Clock, User, BookOpen, Send, CheckCircle } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000"

function InstructorHelpRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedId, setExpandedId] = useState(null)
  const [detailCache, setDetailCache] = useState({})
  const [detailLoading, setDetailLoading] = useState(false)
  const [resolvingId, setResolvingId] = useState(null)
  const [filterStatus, setFilterStatus] = useState("pending")

  // Reply state per request
  const [replyText, setReplyText] = useState({})
  const [replySending, setReplySending] = useState(null)
  const [replySuccess, setReplySuccess] = useState({})
  const [replyError, setReplyError] = useState({})

  const token = localStorage.getItem("token")

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE_URL}/help-requests?status=${filterStatus}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch help requests.")
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (e) {
      setError(e.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }, [token, filterStatus])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const loadDetail = async (requestId) => {
    if (detailCache[requestId]) return
    setDetailLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/help-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Could not load details.")
      const data = await res.json()
      setDetailCache((prev) => ({ ...prev, [requestId]: data }))
    } catch {
      setDetailCache((prev) => ({ ...prev, [requestId]: { error: "Failed to load details." } }))
    } finally {
      setDetailLoading(false)
    }
  }

  const toggleExpand = async (requestId) => {
    if (expandedId === requestId) {
      setExpandedId(null)
      return
    }
    setExpandedId(requestId)
    await loadDetail(requestId)
  }

  const handleResolve = async (requestId) => {
    setResolvingId(requestId)
    try {
      const res = await fetch(`${API_BASE_URL}/help-requests/${requestId}/resolve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "resolved" } : r))
      )
      if (expandedId === requestId) setExpandedId(null)
    } catch {
      // silently fail
    } finally {
      setResolvingId(null)
    }
  }

  const handleSendReply = async (requestId) => {
    const text = (replyText[requestId] || "").trim()
    if (!text || replySending === requestId) return

    setReplySending(requestId)
    setReplyError((prev) => ({ ...prev, [requestId]: "" }))

    try {
      const res = await fetch(`${API_BASE_URL}/help-requests/${requestId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reply: text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setReplyError((prev) => ({
          ...prev,
          [requestId]: data.detail || "Could not send reply.",
        }))
        return
      }
      // Mark success and update local state
      setReplySuccess((prev) => ({ ...prev, [requestId]: true }))
      setReplyText((prev) => ({ ...prev, [requestId]: "" }))
      // Update the request status to resolved in list
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "resolved", reply: text } : r))
      )
      // Update detail cache with the reply
      setDetailCache((prev) => ({
        ...prev,
        [requestId]: { ...prev[requestId], reply: text },
      }))
    } catch {
      setReplyError((prev) => ({ ...prev, [requestId]: "Network error. Try again." }))
    } finally {
      setReplySending(null)
    }
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length
  const detail = expandedId ? detailCache[expandedId] : null

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page header */}
      <div className="bg-white border-b px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6E5C86]/10 rounded-xl flex items-center justify-center">
            <LifeBuoy size={20} className="text-[#6E5C86]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Student Help Requests</h1>
            <p className="text-xs text-gray-500">
              {pendingCount > 0
                ? `${pendingCount} pending request${pendingCount !== 1 ? "s" : ""} need your attention`
                : "All caught up!"}
            </p>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg text-sm">
          {[
            { value: "pending", label: "Pending" },
            { value: "resolved", label: "Resolved" },
            { value: "all", label: "All" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilterStatus(tab.value)}
              className={`px-4 py-1.5 rounded-md font-medium transition-colors ${
                filterStatus === tab.value
                  ? "bg-white text-[#6E5C86] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[#6E5C86]" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <LifeBuoy size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No {filterStatus !== "all" ? filterStatus : ""} requests found.</p>
          </div>
        )}

        <div className="space-y-3">
          {requests.map((req) => {
            const isExpanded = expandedId === req.id
            const d = detailCache[req.id]
            const alreadyReplied = req.reply || replySuccess[req.id]

            return (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
              >
                {/* Request row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(req.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      req.status === "pending" ? "bg-amber-400" : "bg-green-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm flex items-center gap-1.5">
                        <User size={13} className="text-gray-400" />
                        {req.studentName || "Student"}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <BookOpen size={12} />
                        {req.exerciseTitle || `Exercise #${req.exerciseId}`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5 truncate">{req.message}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={11} />
                      {req.createdAt
                        ? new Date(req.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                    {req.status === "resolved" && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Resolved
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/60">

                    {detailLoading && !d && (
                      <div className="flex justify-center py-6">
                        <Loader2 size={20} className="animate-spin text-[#6E5C86]" />
                      </div>
                    )}

                    {d?.error && <p className="text-sm text-red-500">{d.error}</p>}

                    {d && !d.error && (
                      <div className="space-y-5">

                        {/* Student message */}
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Student's Message
                          </h3>
                          <p className="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-4 py-3 whitespace-pre-wrap">
                            {req.message}
                          </p>
                        </div>

                        {/* Code snapshot */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Code Snapshot
                            </h3>
                            {d.language && (
                              <span className="text-xs bg-[#6E5C86]/10 text-[#6E5C86] px-2 py-0.5 rounded font-medium">
                                {d.language}
                              </span>
                            )}
                          </div>
                          <pre className="bg-gray-900 text-green-300 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-64">
                            {d.codeSnapshot || "No code snapshot available."}
                          </pre>
                        </div>

                        {/* Submissions */}
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Submission History
                          </h3>
                          {!d.submissions || d.submissions.length === 0 ? (
                            <p className="text-sm text-gray-400">No submissions yet.</p>
                          ) : (
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-semibold uppercase tracking-wider">
                                    <th className="text-left px-4 py-2.5">Attempt</th>
                                    <th className="text-left px-4 py-2.5">Status</th>
                                    <th className="text-left px-4 py-2.5">Score</th>
                                    <th className="text-left px-4 py-2.5">Passed</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {d.submissions.map((s, i) => (
                                    <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                      <td className="px-4 py-2.5 text-gray-600 font-mono">#{s.attemptNumber ?? i + 1}</td>
                                      <td className="px-4 py-2.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                          s.status === "Passed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                                        }`}>
                                          {s.status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5 text-gray-700">{s.score ?? "—"}%</td>
                                      <td className="px-4 py-2.5 text-gray-500">{s.passedTestCases ?? "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* ── Reply section ── */}
                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Reply to Student
                          </h3>

                          {/* Already replied */}
                          {(d.reply || replySuccess[req.id]) ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                              <div className="flex items-center gap-2 mb-1.5">
                                <CheckCircle size={14} className="text-green-600" />
                                <span className="text-xs font-semibold text-green-700">Reply sent</span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {d.reply || replyText[req.id]}
                              </p>
                            </div>
                          ) : (
                            /* Reply form */
                            <div className="space-y-2">
                              <textarea
                                value={replyText[req.id] || ""}
                                onChange={(e) =>
                                  setReplyText((prev) => ({ ...prev, [req.id]: e.target.value }))
                                }
                                placeholder="Type your reply to the student..."
                                rows={4}
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6E5C86]/40 focus:border-[#6E5C86] transition bg-white"
                              />
                              {replyError[req.id] && (
                                <p className="text-xs text-red-500">{replyError[req.id]}</p>
                              )}
                              <div className="flex justify-between items-center">
                                {req.status === "pending" && (
                                  <button
                                    type="button"
                                    onClick={() => handleResolve(req.id)}
                                    disabled={resolvingId === req.id}
                                    className="flex items-center gap-2 text-gray-500 border border-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition disabled:opacity-40"
                                  >
                                    {resolvingId === req.id ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <CheckCheck size={13} />
                                    )}
                                    Mark Resolved (no reply)
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleSendReply(req.id)}
                                  disabled={
                                    !replyText[req.id]?.trim() || replySending === req.id
                                  }
                                  className="flex items-center gap-2 bg-[#6E5C86] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#5a4a70] transition disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                                >
                                  {replySending === req.id ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Send size={14} />
                                  )}
                                  Send Reply
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default InstructorHelpRequests