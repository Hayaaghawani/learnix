import { useParams } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import { ChevronDown, ChevronUp, Plus, Loader2, Trash2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const DEFAULT_MODES = [
  { name: "Beginner",      description: "Full hints allowed. AI provides conceptual explanations, guiding questions, and partial code.",       hintLimit: 5, cooldown: 10, strictLevel: 1 },
  { name: "Intermediate",  description: "Partial hints only. AI gives guiding questions and pseudocode but avoids direct code fragments.",     hintLimit: 3, cooldown: 20, strictLevel: 2 },
  { name: "Senior",        description: "Minimal guidance. AI only confirms or denies logic direction.",                                       hintLimit: 2, cooldown: 30, strictLevel: 3 },
  { name: "Professional",  description: "No AI help. Students must solve exercises entirely on their own.",                                    hintLimit: 0, cooldown: 0,  strictLevel: 4 },
]

const POLICY_OPTIONS = [
  { value: "after_submission", label: "After submission" },
  { value: "never",            label: "Never show full solution" },
  { value: "after_deadline",   label: "Only after deadline" },
  { value: "partial_only",     label: "Partial logic only" },
]

// ── Toggle ────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{
      position: "relative", width: 44, height: 24, borderRadius: 99,
      background: checked ? "#6E5C86" : "rgba(255,255,255,0.1)",
      border: "none", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "white",
        transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </button>
  )
}

// ── Collapsible section ───────────────────────────────────────────────────────
function Section({ title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: open ? 0 : 0 }}>
      <button type="button" onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left",
      }}>
        <div>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>{title}</p>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.28)" }}>{subtitle}</p>
        </div>
        {open ? <ChevronUp size={14} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={14} color="rgba(255,255,255,0.3)" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: "hidden", paddingBottom: 16 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Checkbox item ─────────────────────────────────────────────────────────────
function CheckItem({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: "#6E5C86", width: 14, height: 14 }} />
      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>{label}</span>
    </label>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
function AIModes() {
  const { id } = useParams()
  const [catalog, setCatalog] = useState({ concepts: [], forbiddenTopics: [], misconceptions: [], responseTypes: [], showSolutionPolicies: [] })
  const [courseConcepts, setCourseConcepts] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [customModes, setCustomModes] = useState([])
  const [loadingModes, setLoadingModes] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const [modeName, setModeName] = useState("")
  const [modeDescription, setModeDescription] = useState("")
  const [selectedConceptIds, setSelectedConceptIds] = useState(() => new Set())
  const [selectedForbiddenIds, setSelectedForbiddenIds] = useState(() => new Set())
  const [selectedMisconceptionIds, setSelectedMisconceptionIds] = useState(() => new Set())
  const [selectedResponseTypeIds, setSelectedResponseTypeIds] = useState(() => new Set())
  const [enableAdaptiveHints, setEnableAdaptiveHints] = useState(false)
  const [hintLimit, setHintLimit] = useState(3)
  const [cooldownSeconds, setCooldownSeconds] = useState(30)
  const [enableErrorExplanation, setEnableErrorExplanation] = useState(true)
  const [enableRag, setEnableRag] = useState(false)
  const [showSolutionPolicy, setShowSolutionPolicy] = useState("after_submission")

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    try {
      const token = localStorage.getItem("token")
      const [catRes, ccRes] = await Promise.all([
        fetch(`${API_BASE_URL}/exercises/ai-catalog`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/exercises/course/${id}/concepts`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (catRes.ok) {
        const d = await catRes.json()
        setCatalog({ concepts: d.concepts||[], forbiddenTopics: d.forbiddenTopics||[], misconceptions: d.misconceptions||[], responseTypes: d.responseTypes||[], showSolutionPolicies: d.showSolutionPolicies||[] })
      }
      if (ccRes.ok) { const d = await ccRes.json(); setCourseConcepts(d.concepts || []) }
    } catch { setSaveError("Could not load AI catalog.") }
    finally { setCatalogLoading(false) }
  }, [id])

  useEffect(() => { loadCatalog() }, [loadCatalog])

  const fetchCustomModes = async () => {
    setLoadingModes(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/exercises/types/course/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      setCustomModes((data.types || []).filter(t => !t.isSystemPresent))
    } catch {}
    finally { setLoadingModes(false) }
  }

  useEffect(() => { fetchCustomModes() }, [id])

  const deleteMode = async (typeId) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/exercises/types/${typeId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { const err = await res.json(); alert(err.detail || "Failed to delete mode"); return }
      fetchCustomModes()
    } catch { alert("Something went wrong.") }
  }

  const toggleId = (setFn, id) => setFn(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const resetForm = () => {
    setModeName(""); setModeDescription("")
    setSelectedConceptIds(new Set()); setSelectedForbiddenIds(new Set())
    setSelectedMisconceptionIds(new Set()); setSelectedResponseTypeIds(new Set())
    setEnableAdaptiveHints(false); setHintLimit(3); setCooldownSeconds(30)
    setEnableErrorExplanation(true); setEnableRag(false); setShowSolutionPolicy("after_submission")
  }

  const handleCreate = async () => {
    if (!modeName.trim()) { setSaveError("Mode name is required"); return }
    if (enableAdaptiveHints) { const l = parseInt(String(hintLimit), 10); if (!Number.isFinite(l) || l < 1) { setSaveError("Hint limit must be at least 1"); return } }
    setSaveError(""); setSaving(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/exercises/types/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: modeName.trim(), description: modeDescription.trim() || null, category: id, conceptIds: Array.from(selectedConceptIds), forbiddenTopicIds: Array.from(selectedForbiddenIds), misconceptionIds: Array.from(selectedMisconceptionIds), responseTypeIds: Array.from(selectedResponseTypeIds), enableAdaptiveHints, hintLimit: enableAdaptiveHints ? parseInt(String(hintLimit),10) : null, cooldownSeconds: Math.max(0, parseInt(String(cooldownSeconds),10)||0), enableErrorExplanation, enableRag, showSolutionPolicy, defaultHintLimit: enableAdaptiveHints ? parseInt(String(hintLimit),10) : 999, defaultCooldownStrategy: Math.max(0, parseInt(String(cooldownSeconds),10)||0), strictLevel: 1, guidanceStyle: "structured", anticipatedMisconceptions: null }),
      })
      if (!res.ok) { const err = await res.json(); setSaveError(err.detail || "Failed to create mode"); return }
      resetForm(); setShowForm(false); fetchCustomModes()
    } catch { setSaveError("Something went wrong.") }
    finally { setSaving(false) }
  }

  const formatCooldown = m => { const s = m.cooldownSeconds != null ? m.cooldownSeconds : null; if (s != null) return s === 0 ? "None" : `${s}s`; return m.defaultCooldownStrategy === 0 ? "None" : `${m.defaultCooldownStrategy} (legacy)` }
  const formatHintLimit = m => { if (m.enableAdaptiveHints && m.hintLimit != null) return m.hintLimit; if (!m.enableAdaptiveHints && m.defaultHintLimit >= 999) return "Unlimited"; return m.defaultHintLimit }

  const cardStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" }
  const inputStyle = { width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, outline: "none", boxSizing: "border-box" }
  const tagStyle = (color) => ({ fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 500 })

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        .ai-input::placeholder { color:rgba(255,255,255,0.2); }
        .ai-input:focus { border-color:rgba(178,152,218,0.5)!important; box-shadow:0 0 0 3px rgba(142,125,165,0.12); }
        option { background:#1e0f38; color:rgba(255,255,255,0.8); }
      `}</style>

      <h1 style={{ fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginBottom: 6 }}>AI Learning Modes</h1>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 28 }}>Configure how the AI assists students in each exercise type</p>

      {/* Default modes */}
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>System Modes</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        {DEFAULT_MODES.map((mode, i) => (
          <motion.div key={mode.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.85)" }}>{mode.name}</h3>
              <span style={{ ...tagStyle(), background: "rgba(142,125,165,0.15)", border: "1px solid rgba(142,125,165,0.2)", color: "rgba(178,152,218,0.7)" }}>System</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginBottom: 12 }}>{mode.description}</p>
            <div style={{ display: "flex", gap: 12 }}>
              {[`Hints: ${mode.hintLimit === 0 ? "None" : mode.hintLimit}`, `Cooldown: ${mode.cooldown === 0 ? "None" : `${mode.cooldown}s`}`, `Level: ${mode.strictLevel}/4`].map(t => (
                <span key={t} style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{t}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custom modes */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Custom Modes</p>
        <button
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm() }}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9, background: showForm ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: showForm ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(178,152,218,0.25)", color: showForm ? "rgba(255,255,255,0.5)" : "white", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
        >
          {showForm ? <><X size={13} /> Cancel</> : <><Plus size={13} /> Create Custom Mode</>}
        </button>
      </div>

      {loadingModes ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.3)", fontSize: 13, padding: "20px 0" }}>
          <Loader2 size={14} className="animate-spin" style={{ color: "#8E7DA5" }} /> Loading modes...
        </div>
      ) : customModes.length === 0 && !showForm ? (
        <div style={{ ...cardStyle, textAlign: "center", padding: "32px" }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No custom modes yet. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: showForm ? 24 : 0 }}>
          {customModes.map((mode, i) => (
            <motion.div key={mode.typeId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, color: "rgba(255,255,255,0.85)" }}>{mode.name}</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 500, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>Custom</span>
                  <button onClick={() => deleteMode(mode.typeId)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", padding: 4, borderRadius: 6, transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.1)" }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.2)"; e.currentTarget.style.background = "transparent" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              {mode.description && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginBottom: 10 }}>{mode.description}</p>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[`Adaptive: ${mode.enableAdaptiveHints ? "On" : "Off"}`, `Hints: ${formatHintLimit(mode)}`, `Cooldown: ${formatCooldown(mode)}`, `RAG: ${mode.enableRag ? "On" : "Off"}`].map(t => (
                  <span key={t} style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{t}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 16, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.3 }} style={{ overflow: "hidden" }}
          >
            <div style={{ ...cardStyle, border: "1px solid rgba(178,152,218,0.2)" }}>
              <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 15, color: "rgba(255,255,255,0.88)", marginBottom: 20 }}>Configure Custom Mode</h2>

              {catalogLoading && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                  <Loader2 size={13} className="animate-spin" /> Loading options…
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16, marginBottom: 4, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <input className="ai-input" placeholder="Mode name (e.g. Exam Mode)" value={modeName} onChange={e => setModeName(e.target.value)} style={inputStyle} />
                <textarea className="ai-input" placeholder="Description (optional)..." value={modeDescription} onChange={e => setModeDescription(e.target.value)} rows={2} style={{ ...inputStyle, resize: "none" }} />
              </div>

              <Section title="Concepts (from this course)" subtitle="Only concepts assigned to this course appear here" defaultOpen>
                {courseConcepts.length === 0 ? (
                  <p style={{ fontSize: 12, color: "rgba(251,191,36,0.6)", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.12)", borderRadius: 8, padding: "10px 12px" }}>No concepts linked to this course yet.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 160, overflowY: "auto" }}>
                    {courseConcepts.map(c => <CheckItem key={c.id} label={c.name} checked={selectedConceptIds.has(c.id)} onChange={() => toggleId(setSelectedConceptIds, c.id)} />)}
                  </div>
                )}
              </Section>

              <Section title="Forbidden topics" subtitle="AI should avoid steering students toward these">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 160, overflowY: "auto" }}>
                  {catalog.forbiddenTopics.map(c => <CheckItem key={c.id} label={c.name} checked={selectedForbiddenIds.has(c.id)} onChange={() => toggleId(setSelectedForbiddenIds, c.id)} />)}
                </div>
              </Section>

              <Section title="Misconceptions" subtitle="Common mistakes the AI can watch for">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 160, overflowY: "auto" }}>
                  {catalog.misconceptions.map(c => <CheckItem key={c.id} label={c.name} checked={selectedMisconceptionIds.has(c.id)} onChange={() => toggleId(setSelectedMisconceptionIds, c.id)} />)}
                </div>
              </Section>

              <Section title="Response types" subtitle="Styles the AI may use when helping">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {catalog.responseTypes.map(c => <CheckItem key={c.id} label={c.name} checked={selectedResponseTypeIds.has(c.id)} onChange={() => toggleId(setSelectedResponseTypeIds, c.id)} />)}
                </div>
              </Section>

              <Section title="Behavior" subtitle="Adaptive hints, cooldown, and solution policy" defaultOpen>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>Adaptive hints</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>Requires a per-exercise hint cap</p>
                  </div>
                  <Toggle checked={enableAdaptiveHints} onChange={setEnableAdaptiveHints} />
                </div>
                {enableAdaptiveHints && (
                  <div>
                    <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>Hint limit</label>
                    <input className="ai-input" type="number" min={1} value={hintLimit} onChange={e => setHintLimit(Number(e.target.value))} style={{ ...inputStyle, width: 100 }} />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 4 }}>Cooldown between AI responses (seconds)</label>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", marginBottom: 6 }}>Applies to chat and hints</p>
                  <input className="ai-input" type="number" min={0} value={cooldownSeconds} onChange={e => setCooldownSeconds(Number(e.target.value))} style={{ ...inputStyle, width: 100 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>Enable RAG / course materials</p>
                  <Toggle checked={enableRag} onChange={setEnableRag} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>Explain execution errors</p>
                  <Toggle checked={enableErrorExplanation} onChange={setEnableErrorExplanation} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6 }}>Show solution policy</label>
                  <select className="ai-input" value={showSolutionPolicy} onChange={e => setShowSolutionPolicy(e.target.value)} style={{ ...inputStyle, maxWidth: 300 }}>
                    {POLICY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </Section>

              {saveError && <p style={{ fontSize: 12, color: "#f87171", padding: "8px 0" }}>{saveError}</p>}

              <button
                onClick={handleCreate} disabled={saving}
                style={{ width: "100%", padding: "12px", marginTop: 16, borderRadius: 10, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}
                onMouseEnter={e => !saving && (e.currentTarget.style.boxShadow = "0 6px 20px rgba(110,92,134,0.4)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
              >
                {saving ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create Mode"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AIModes