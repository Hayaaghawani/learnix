import { useParams } from "react-router-dom"
import { useState, useEffect, useCallback } from "react"
import { ChevronDown, ChevronUp, Plus, Loader2, Trash2 } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const DEFAULT_MODES = [
  { name: "Beginner", description: "Full hints allowed. AI provides conceptual explanations, guiding questions, and partial code. Ideal for students new to programming.", hintLimit: 5, cooldown: 10, strictLevel: 1 },
  { name: "Intermediate", description: "Partial hints only. AI gives guiding questions and pseudocode but avoids direct code fragments. For students with basic knowledge.", hintLimit: 3, cooldown: 20, strictLevel: 2 },
  { name: "Senior", description: "Minimal guidance. AI only confirms or denies logic direction. Students are expected to solve most issues independently.", hintLimit: 2, cooldown: 30, strictLevel: 3 },
  { name: "Professional", description: "No AI help. Students must solve exercises entirely on their own. AI is disabled for hint requests.", hintLimit: 0, cooldown: 0, strictLevel: 4 },
]

const POLICY_OPTIONS = [
  { value: "after_submission", label: "After submission" },
  { value: "never", label: "Never show full solution" },
  { value: "after_deadline", label: "Only after deadline" },
  { value: "partial_only", label: "Partial logic only" },
]

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-[#6E5C86]" : "bg-gray-200"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  )
}

function Section({ title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 last:border-none">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-4 px-1 text-left"
      >
        <div>
          <p className="font-medium text-gray-800 text-sm">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="pb-5 px-1 space-y-4">{children}</div>}
    </div>
  )
}

function AIModes() {
  const { id } = useParams()

  const [catalog, setCatalog] = useState({
    concepts: [],
    forbiddenTopics: [],
    misconceptions: [],
    responseTypes: [],
    showSolutionPolicies: [],
  })
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

  const loadCatalogAndCourseConcepts = useCallback(async () => {
    setCatalogLoading(true)
    try {
      const token = localStorage.getItem("token")
      const [catRes, ccRes] = await Promise.all([
        fetch(`${API_BASE_URL}/exercises/ai-catalog`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/exercises/course/${id}/concepts`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      if (catRes.ok) {
        const d = await catRes.json()
        setCatalog({
          concepts: d.concepts || [],
          forbiddenTopics: d.forbiddenTopics || [],
          misconceptions: d.misconceptions || [],
          responseTypes: d.responseTypes || [],
          showSolutionPolicies: d.showSolutionPolicies || POLICY_OPTIONS.map((p) => p.value),
        })
      }
      if (ccRes.ok) {
        const d = await ccRes.json()
        setCourseConcepts(d.concepts || [])
      }
    } catch {
      setSaveError("Could not load AI catalog.")
    } finally {
      setCatalogLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadCatalogAndCourseConcepts()
  }, [loadCatalogAndCourseConcepts])

  const fetchCustomModes = async () => {
    setLoadingModes(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/exercises/types/course/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) return
      const data = await response.json()
      setCustomModes((data.types || []).filter((t) => !t.isSystemPresent))
    } catch {
      /* ignore */
    } finally {
      setLoadingModes(false)
    }
  }

  useEffect(() => {
    fetchCustomModes()
  }, [id])

  const deleteMode = async (typeId) => {
    if (!window.confirm("Are you sure you want to delete this mode?")) return
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/exercises/types/${typeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const err = await response.json()
        alert(err.detail || "Failed to delete mode")
        return
      }
      fetchCustomModes()
    } catch {
      alert("Something went wrong. Please try again.")
    }
  }

  const toggleId = (setFn, id) => {
    setFn((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const resetForm = () => {
    setModeName("")
    setModeDescription("")
    setSelectedConceptIds(new Set())
    setSelectedForbiddenIds(new Set())
    setSelectedMisconceptionIds(new Set())
    setSelectedResponseTypeIds(new Set())
    setEnableAdaptiveHints(false)
    setHintLimit(3)
    setCooldownSeconds(30)
    setEnableErrorExplanation(true)
    setEnableRag(false)
    setShowSolutionPolicy("after_submission")
  }

  const handleCreate = async () => {
    if (!modeName.trim()) {
      setSaveError("Mode name is required")
      return
    }
    if (enableAdaptiveHints) {
      const lim = parseInt(String(hintLimit), 10)
      if (!Number.isFinite(lim) || lim < 1) {
        setSaveError("Hint limit must be at least 1 when adaptive hints are enabled")
        return
      }
    }
    setSaveError("")
    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      const body = {
        name: modeName.trim(),
        description: modeDescription.trim() || null,
        category: id,
        conceptIds: Array.from(selectedConceptIds),
        forbiddenTopicIds: Array.from(selectedForbiddenIds),
        misconceptionIds: Array.from(selectedMisconceptionIds),
        responseTypeIds: Array.from(selectedResponseTypeIds),
        enableAdaptiveHints,
        hintLimit: enableAdaptiveHints ? parseInt(String(hintLimit), 10) : null,
        cooldownSeconds: Math.max(0, parseInt(String(cooldownSeconds), 10) || 0),
        enableErrorExplanation,
        enableRag,
        showSolutionPolicy,
        defaultHintLimit: enableAdaptiveHints ? parseInt(String(hintLimit), 10) : 999,
        defaultCooldownStrategy: Math.max(0, parseInt(String(cooldownSeconds), 10) || 0),
        strictLevel: 1,
        guidanceStyle: "structured",
        anticipatedMisconceptions: null,
      }
      const response = await fetch(`${API_BASE_URL}/exercises/types/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const err = await response.json()
        setSaveError(err.detail || "Failed to create mode")
        return
      }
      resetForm()
      setShowForm(false)
      fetchCustomModes()
    } catch {
      setSaveError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const formatCooldown = (mode) => {
    const sec = mode.cooldownSeconds != null ? mode.cooldownSeconds : null
    if (sec != null) return sec === 0 ? "None" : `${sec}s`
    const s = mode.defaultCooldownStrategy
    if (s === 0) return "None"
    if (s === 1) return "≤30s (legacy)"
    return ">30s (legacy)"
  }

  const formatHintLimit = (mode) => {
    if (mode.enableAdaptiveHints && mode.hintLimit != null) return mode.hintLimit
    if (!mode.enableAdaptiveHints && mode.defaultHintLimit >= 999) return "Unlimited (legacy)"
    return mode.defaultHintLimit
  }

  return (
    <div className="min-h-screen bg-[#F4F1F7] p-10">
      <h1 className="text-2xl font-semibold text-[#3e2764] mb-8">AI Learning Modes</h1>

      <h2 className="text-base font-semibold text-gray-600 mb-3">Default Modes</h2>
      <div className="grid grid-cols-2 gap-4 mb-10">
        {DEFAULT_MODES.map((mode) => (
          <div key={mode.name} className="bg-white rounded-xl shadow p-5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-[#3e2764]">{mode.name}</h3>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">System</span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{mode.description}</p>
            <div className="flex gap-4 text-xs text-gray-400">
              <span>Hint limit: {mode.hintLimit === 0 ? "None" : mode.hintLimit}</span>
              <span>Cooldown: {mode.cooldown === 0 ? "None" : `${mode.cooldown}s`}</span>
              <span>Strict level: {mode.strictLevel}/4</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold text-gray-600">Custom Modes</h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#8E7DA5] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#7B6A96] transition"
        >
          <Plus size={15} />
          {showForm ? "Cancel" : "Create Custom Mode"}
        </button>
      </div>

      {loadingModes ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-6">
          <Loader2 size={16} className="animate-spin" /> Loading modes...
        </div>
      ) : customModes.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400 mb-6">
          <p className="text-sm">No custom modes yet. Click &quot;Create Custom Mode&quot; to add one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {customModes.map((mode) => (
            <div key={mode.typeId} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-[#3e2764]">{mode.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Custom</span>
                  <button
                    type="button"
                    onClick={() => deleteMode(mode.typeId)}
                    className="text-red-400 hover:text-red-600 transition"
                    title="Delete mode"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {mode.description && <p className="text-sm text-gray-500 mb-3">{mode.description}</p>}
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span>Adaptive hints: {mode.enableAdaptiveHints ? "On" : "Off"}</span>
                <span>Hint cap: {formatHintLimit(mode)}</span>
                <span>Cooldown: {formatCooldown(mode)}</span>
                <span>RAG: {mode.enableRag ? "On" : "Off"}</span>
                <span>Errors: {mode.enableErrorExplanation ? "On" : "Off"}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2 font-mono">Policy: {mode.showSolutionPolicy || "—"}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 space-y-2">
          <h2 className="font-semibold text-[#3e2764] text-lg mb-4">Configure Custom Mode</h2>

          {catalogLoading && (
            <p className="text-sm text-gray-400 flex items-center gap-2 mb-2">
              <Loader2 size={14} className="animate-spin" /> Loading options…
            </p>
          )}

          <div className="space-y-3 pb-4 border-b border-gray-100">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Mode Name</label>
              <input
                value={modeName}
                onChange={(e) => setModeName(e.target.value)}
                className="w-full border p-3 rounded-lg text-sm"
                placeholder="e.g. Exam Mode"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={modeDescription}
                onChange={(e) => setModeDescription(e.target.value)}
                className="w-full border p-3 rounded-lg text-sm"
                rows={2}
                placeholder="Describe when to use this mode..."
              />
            </div>
          </div>

          <Section title="Concepts (from this course)" subtitle="Only concepts you assigned to the course appear here" defaultOpen>
            {courseConcepts.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
                No concepts linked to this course yet. Edit the course or recreate it with concept selections.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {courseConcepts.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={selectedConceptIds.has(c.id)}
                      onChange={() => toggleId(setSelectedConceptIds, c.id)}
                      className="rounded accent-[#6E5C86]"
                    />
                    <span className="font-mono text-xs">{c.name}</span>
                  </label>
                ))}
              </div>
            )}
          </Section>

          <Section title="Forbidden topics" subtitle="AI should avoid steering students toward these">
            <div className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {catalog.forbiddenTopics.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={selectedForbiddenIds.has(c.id)}
                    onChange={() => toggleId(setSelectedForbiddenIds, c.id)}
                    className="rounded accent-[#6E5C86]"
                  />
                  <span className="font-mono text-xs">{c.name}</span>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Misconceptions" subtitle="Common mistakes the AI can watch for">
            <div className="grid sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
              {catalog.misconceptions.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={selectedMisconceptionIds.has(c.id)}
                    onChange={() => toggleId(setSelectedMisconceptionIds, c.id)}
                    className="rounded accent-[#6E5C86]"
                  />
                  <span className="font-mono text-xs">{c.name}</span>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Response types" subtitle="Styles the AI may use when helping">
            <div className="grid sm:grid-cols-2 gap-2">
              {catalog.responseTypes.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={selectedResponseTypeIds.has(c.id)}
                    onChange={() => toggleId(setSelectedResponseTypeIds, c.id)}
                    className="rounded accent-[#6E5C86]"
                  />
                  <span className="font-mono text-xs">{c.name}</span>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Behavior" subtitle="Adaptive hints, cooldown, and solution policy" defaultOpen>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Adaptive hints</p>
                <p className="text-xs text-gray-400">Requires a per-exercise hint cap (Get Hint button only)</p>
              </div>
              <Toggle checked={enableAdaptiveHints} onChange={setEnableAdaptiveHints} />
            </div>
            {enableAdaptiveHints && (
              <div className="pl-1">
                <label className="text-sm text-gray-600 block mb-1">Hint limit (Get Hint)</label>
                <input
                  type="number"
                  min={1}
                  value={hintLimit}
                  onChange={(e) => setHintLimit(Number(e.target.value))}
                  className="border p-2 rounded w-28 text-sm"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Cooldown between AI responses (seconds)
              </label>
              <p className="text-xs text-gray-400 mb-2">Applies to chat and hints — reduces spam</p>
              <input
                type="number"
                min={0}
                value={cooldownSeconds}
                onChange={(e) => setCooldownSeconds(Number(e.target.value))}
                className="border p-2 rounded w-28 text-sm"
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">Enable RAG / course materials</p>
              <Toggle checked={enableRag} onChange={setEnableRag} />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">Explain execution errors</p>
              <Toggle checked={enableErrorExplanation} onChange={setEnableErrorExplanation} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Show solution policy</p>
              <select
                value={showSolutionPolicy}
                onChange={(e) => setShowSolutionPolicy(e.target.value)}
                className="border p-2 rounded-lg text-sm w-full max-w-md"
              >
                {POLICY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </Section>

          {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

          <div className="pt-4">
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="w-full bg-[#8E7DA5] text-white py-3 rounded-lg hover:bg-[#7B6A96] disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating...
                </>
              ) : (
                "Create Mode"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIModes