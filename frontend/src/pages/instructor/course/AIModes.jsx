import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Plus, Loader2, Trash2 } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const DEFAULT_MODES = [
  { name: "Beginner", description: "Full hints allowed. AI provides conceptual explanations, guiding questions, and partial code. Ideal for students new to programming.", hintLimit: 5, cooldown: 10, strictLevel: 1 },
  { name: "Intermediate", description: "Partial hints only. AI gives guiding questions and pseudocode but avoids direct code fragments. For students with basic knowledge.", hintLimit: 3, cooldown: 20, strictLevel: 2 },
  { name: "Senior", description: "Minimal guidance. AI only confirms or denies logic direction. Students are expected to solve most issues independently.", hintLimit: 2, cooldown: 30, strictLevel: 3 },
  { name: "Professional", description: "No AI help. Students must solve exercises entirely on their own. AI is disabled for hint requests.", hintLimit: 0, cooldown: 0, strictLevel: 4 },
]

const RESPONSE_TYPES = [
  { key: "conceptual", label: "Conceptual explanation" },
  { key: "guidingQuestions", label: "Guiding questions" },
  { key: "pseudocode", label: "Pseudocode" },
  { key: "partialCode", label: "Partial code fragments" },
  { key: "tracingExample", label: "Tracing a failed example" },
  { key: "testCaseHints", label: "Test-case-based hints" },
]

const MISCONCEPTION_OPTIONS = [
  { key: "offByOne", label: "Off-by-one errors" },
  { key: "infiniteLoops", label: "Infinite loops" },
  { key: "incorrectInit", label: "Incorrect initialization" },
  { key: "conditionNeverChanges", label: "Condition never changes" },
]

const FORBIDDEN_OPTIONS = [
  { key: "recursion", label: "Recursion" },
  { key: "externalLibraries", label: "External Libraries" },
  { key: "builtInShortcuts", label: "Built-in Shortcuts" },
]

const SOLUTION_DISCLOSURE_OPTIONS = [
  { value: "partial", label: "Allow partial logic only" },
  { value: "never", label: "Never reveal full solution" },
  { value: "afterDeadline", label: "Reveal solution only after deadline" },
]

function Toggle({ checked, onChange }) {
  return (
    <button
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

  const [customModes, setCustomModes] = useState([])
  const [loadingModes, setLoadingModes] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const [modeName, setModeName] = useState("")
  const [modeDescription, setModeDescription] = useState("")

  const [targetConceptsEnabled, setTargetConceptsEnabled] = useState(false)
  const [targetConcepts, setTargetConcepts] = useState([])
  const [customConcept, setCustomConcept] = useState("")
  const [forbiddenEnabled, setForbiddenEnabled] = useState(false)
  const [forbiddenTopics, setForbiddenTopics] = useState([])
  const [customForbidden, setCustomForbidden] = useState("")

  const [adaptiveHints, setAdaptiveHints] = useState(false)
  const [responseTypes, setResponseTypes] = useState({})
  const [hintLimitEnabled, setHintLimitEnabled] = useState(false)
  const [hintLimit, setHintLimit] = useState(3)
  const [hintCooldownEnabled, setHintCooldownEnabled] = useState(false)
  const [hintCooldown, setHintCooldown] = useState(27)

  const [explainErrors, setExplainErrors] = useState(false)
  const [misconceptionsEnabled, setMisconceptionsEnabled] = useState(false)
  const [misconceptions, setMisconceptions] = useState([])
  const [useCourseMaterials, setUseCourseMaterials] = useState(false)
  const [solutionDisclosure, setSolutionDisclosure] = useState("partial")

  useEffect(() => { fetchCustomModes() }, [id])

  const fetchCustomModes = async () => {
    setLoadingModes(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/exercises/types/course/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) return
      const data = await response.json()
      setCustomModes((data.types || []).filter(t => !t.isSystemPresent))
    } catch {}
    finally { setLoadingModes(false) }
  }

  // ── deleteMode is INSIDE the component so it can call fetchCustomModes ──
  const deleteMode = async (typeId) => {
    if (!window.confirm("Are you sure you want to delete this mode?")) return
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/exercises/types/${typeId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
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

  const toggleCheck = (key, state, setState) => {
    setState(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleList = (key, list, setList) => {
    setList(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const addCustomConcept = () => {
    if (customConcept.trim()) {
      setTargetConcepts(prev => [...prev, customConcept.trim()])
      setCustomConcept("")
    }
  }

  const addCustomForbidden = () => {
    if (customForbidden.trim()) {
      setForbiddenTopics(prev => [...prev, customForbidden.trim()])
      setCustomForbidden("")
    }
  }

  const buildGuidanceStyle = () => {
    const parts = []
    if (adaptiveHints) parts.push("adaptive")
    Object.entries(responseTypes).forEach(([k, v]) => { if (v) parts.push(k) })
    if (explainErrors) parts.push("explainErrors")
    if (useCourseMaterials) parts.push("useCourseMaterials")
    parts.push(`disclosure:${solutionDisclosure}`)
    return parts.join(",")
  }

  const handleCreate = async () => {
    if (!modeName.trim()) { setSaveError("Mode name is required"); return }
    setSaveError("")
    setSaving(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/exercises/types/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: modeName.trim(),
          description: modeDescription.trim() || null,
          defaultHintLimit: hintLimitEnabled ? parseInt(hintLimit) : 999,
          defaultCooldownStrategy: hintCooldownEnabled ? parseInt(hintCooldown) : 0,
          strictLevel: 1,
          guidanceStyle: buildGuidanceStyle(),
          anticipatedMisconceptions: misconceptions.join(",") || null,
          category: id,
        })
      })
      if (!response.ok) {
        const err = await response.json()
        setSaveError(err.detail || "Failed to create mode")
        return
      }
      setModeName(""); setModeDescription(""); setTargetConceptsEnabled(false)
      setTargetConcepts([]); setForbiddenEnabled(false); setForbiddenTopics([])
      setCustomForbidden(""); setAdaptiveHints(false); setResponseTypes({})
      setHintLimitEnabled(false); setHintLimit(3); setHintCooldownEnabled(false)
      setHintCooldown(27); setExplainErrors(false); setMisconceptionsEnabled(false)
      setMisconceptions([]); setUseCourseMaterials(false); setSolutionDisclosure("partial")
      setShowForm(false)
      fetchCustomModes()
    } catch {
      setSaveError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F1F7] p-10">
      <h1 className="text-2xl font-semibold text-[#3e2764] mb-8">AI Learning Modes</h1>

      {/* DEFAULT MODES */}
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

      {/* CUSTOM MODES */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold text-gray-600">Custom Modes</h2>
        <button
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
          <p className="text-sm">No custom modes yet. Click "Create Custom Mode" to add one.</p>
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
                    onClick={() => deleteMode(mode.typeId)}
                    className="text-red-400 hover:text-red-600 transition"
                    title="Delete mode"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {mode.description && <p className="text-sm text-gray-500 mb-3">{mode.description}</p>}
              <div className="flex gap-4 text-xs text-gray-400">
                <span>Hint limit: {mode.defaultHintLimit >= 999 ? "Unlimited" : mode.defaultHintLimit}</span>
                <span>Cooldown: {mode.defaultCooldownStrategy === 0 ? "None" : `${mode.defaultCooldownStrategy}s`}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE FORM */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-6 space-y-2">
          <h2 className="font-semibold text-[#3e2764] text-lg mb-4">Configure Custom Mode</h2>

          <div className="space-y-3 pb-4 border-b border-gray-100">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Mode Name</label>
              <input value={modeName} onChange={(e) => setModeName(e.target.value)} className="w-full border p-3 rounded-lg text-sm" placeholder="e.g. Exam Mode" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea value={modeDescription} onChange={(e) => setModeDescription(e.target.value)} className="w-full border p-3 rounded-lg text-sm" rows={2} placeholder="Describe when to use this mode..." />
            </div>
          </div>

          <Section title="Scope & Alignment" subtitle="Define learning objectives and forbidden approaches">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">Target Concepts</p>
              <Toggle checked={targetConceptsEnabled} onChange={setTargetConceptsEnabled} />
            </div>
            {targetConceptsEnabled && (
              <div className="pl-2 space-y-2">
                <p className="text-xs text-gray-400">AI focuses explanations on these learning objectives</p>
                {["Loops", "Conditionals", "Arrays", "Functions", "Variables"].map(c => (
                  <label key={c} className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={targetConcepts.includes(c)} onChange={() => toggleList(c, targetConcepts, setTargetConcepts)} className="rounded" /> {c}
                  </label>
                ))}
                {targetConcepts.filter(c => !["Loops","Conditionals","Arrays","Functions","Variables"].includes(c)).map(c => (
                  <label key={c} className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked onChange={() => toggleList(c, targetConcepts, setTargetConcepts)} className="rounded" /> {c}
                  </label>
                ))}
                <div className="flex gap-2 mt-1">
                  <input value={customConcept} onChange={(e) => setCustomConcept(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomConcept()} className="flex-1 border p-2 rounded text-sm" placeholder="Add custom option..." />
                  <button onClick={addCustomConcept} className="text-[#6E5C86] text-sm font-medium px-2">+</button>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm font-medium text-gray-700">Forbidden Topics / Approaches</p>
              <Toggle checked={forbiddenEnabled} onChange={setForbiddenEnabled} />
            </div>
            {forbiddenEnabled && (
              <div className="pl-2 space-y-2">
                <p className="text-xs text-gray-400">AI avoids suggesting disallowed concepts or shortcuts</p>
                {FORBIDDEN_OPTIONS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={forbiddenTopics.includes(key)} onChange={() => toggleList(key, forbiddenTopics, setForbiddenTopics)} className="rounded" /> {label}
                  </label>
                ))}
                {forbiddenTopics.filter(t => !FORBIDDEN_OPTIONS.map(o => o.key).includes(t)).map(t => (
                  <label key={t} className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked onChange={() => toggleList(t, forbiddenTopics, setForbiddenTopics)} className="rounded" /> {t}
                  </label>
                ))}
                <div className="flex gap-2 mt-1">
                  <input value={customForbidden} onChange={(e) => setCustomForbidden(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomForbidden()} className="flex-1 border p-2 rounded text-sm" placeholder="Add custom option..." />
                  <button onClick={addCustomForbidden} className="text-[#6E5C86] text-sm font-medium px-2">+</button>
                </div>
              </div>
            )}
          </Section>

          <Section title="Response Policy" subtitle="Control how the AI guides students">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Adaptive Hints</p>
                {adaptiveHints && <p className="text-xs text-gray-400">Hints guide the student when stuck.</p>}
              </div>
              <Toggle checked={adaptiveHints} onChange={setAdaptiveHints} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Response Types</p>
              <p className="text-xs text-gray-400 mb-2">Select which hint styles the AI may use</p>
              {RESPONSE_TYPES.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-600 mb-1.5">
                  <input type="checkbox" checked={!!responseTypes[key]} onChange={() => toggleCheck(key, responseTypes, setResponseTypes)} className="rounded" /> {label}
                </label>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">Hint Limit</p>
              <Toggle checked={hintLimitEnabled} onChange={setHintLimitEnabled} />
            </div>
            {hintLimitEnabled && (
              <div className="flex items-center gap-3 pl-2">
                <input type="number" value={hintLimit} onChange={(e) => setHintLimit(Number(e.target.value))} className="border p-2 rounded w-20 text-sm" min={1} />
                <span className="text-sm text-gray-500">hints per exercise</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">Hint Cooldown</p>
              <Toggle checked={hintCooldownEnabled} onChange={setHintCooldownEnabled} />
            </div>
            {hintCooldownEnabled && (
              <div className="flex items-center gap-3 pl-2">
                <input type="number" value={hintCooldown} onChange={(e) => setHintCooldown(Number(e.target.value))} className="border p-2 rounded w-20 text-sm" min={0} />
                <span className="text-sm text-gray-500">seconds</span>
              </div>
            )}
          </Section>

          <Section title="Error Feedback" subtitle="How the AI explains failed tests">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Explain Execution Errors</p>
                <p className="text-xs text-gray-400">AI explains failed test cases in beginner-friendly language</p>
              </div>
              <Toggle checked={explainErrors} onChange={setExplainErrors} />
            </div>
          </Section>

          <Section title="Misconception Awareness" subtitle="Help the AI predict common student mistakes">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-gray-700">Anticipated Misconceptions</p>
              <Toggle checked={misconceptionsEnabled} onChange={setMisconceptionsEnabled} />
            </div>
            {misconceptionsEnabled && (
              <div className="pl-2 space-y-2">
                <p className="text-xs text-gray-400">Help the AI predict common mistakes</p>
                {MISCONCEPTION_OPTIONS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={misconceptions.includes(key)} onChange={() => toggleList(key, misconceptions, setMisconceptions)} className="rounded" /> {label}
                  </label>
                ))}
              </div>
            )}
          </Section>

          <Section title="Grounding & Material Usage" subtitle="Reference course materials in explanations">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700">Use Course Materials</p>
                <p className="text-xs text-gray-400">AI may reference uploaded course material when explaining</p>
              </div>
              <Toggle checked={useCourseMaterials} onChange={setUseCourseMaterials} />
            </div>
          </Section>

          <Section title="Guarded Behavior" subtitle="Control solution disclosure">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Solution Disclosure</p>
              <p className="text-xs text-gray-400 mb-3">Controls how close AI responses may get to the final answer</p>
              {SOLUTION_DISCLOSURE_OPTIONS.map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <input type="radio" name="solutionDisclosure" value={value} checked={solutionDisclosure === value} onChange={() => setSolutionDisclosure(value)} className="accent-[#6E5C86]" /> {label}
                </label>
              ))}
            </div>
          </Section>

          {saveError && <p className="text-red-500 text-sm">{saveError}</p>}

          <div className="pt-4">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="w-full bg-[#8E7DA5] text-white py-3 rounded-lg hover:bg-[#7B6A96] disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : "Create Mode"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIModes