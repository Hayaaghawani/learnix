import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Plus, Loader2, Trash2, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

// ── Delete modal ──────────────────────────────────────────────────────────────
function DeleteModal({ title, onConfirm, onCancel, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(10,5,25,0.75)", backdropFilter: "blur(10px)" }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: "rgba(28,16,50,0.97)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 380, textAlign: "center" }}
      >
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <AlertTriangle size={22} color="#f87171" />
        </div>
        <h2 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 17, color: "rgba(255,255,255,0.92)", marginBottom: 8 }}>Delete Exercise?</h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: "rgba(255,255,255,0.38)", lineHeight: 1.6, marginBottom: 6 }}>You're about to delete</p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: "rgba(178,152,218,0.85)", fontWeight: 500, marginBottom: 8 }}>"{title}"</p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 24, lineHeight: 1.6 }}>All test cases and submissions will be permanently removed.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", fontFamily: "'DM Sans',sans-serif", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "1px solid rgba(239,68,68,0.3)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {loading ? <><Loader2 size={13} className="animate-spin" /> Deleting...</> : "Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Exercise card ─────────────────────────────────────────────────────────────
function ExerciseCard({ exercise, courseId, onDelete, deletingId, navigate }) {
  const [hovered, setHovered] = useState(false)
  const preview = (exercise.problem || "").trim().replace(/\s+/g, " ")

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/instructor/course/${courseId}/exercise/${exercise.exerciseId}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)",
        border: hovered ? "1px solid rgba(178,152,218,0.25)" : "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12, padding: "14px 16px", marginBottom: 10,
        cursor: "pointer", transition: "all 0.25s",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
        <h3 style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: 13, color: "rgba(255,255,255,0.85)", flex: 1 }}>
          {exercise.title}
        </h3>
        <button
          onClick={e => { e.stopPropagation(); onDelete(exercise) }}
          disabled={deletingId === exercise.exerciseId}
          style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.2)", padding: 4, borderRadius: 6, transition: "all 0.2s", flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.1)" }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.2)"; e.currentTarget.style.background = "transparent" }}
        >
          {deletingId === exercise.exerciseId ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
      <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5, marginBottom: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
        {preview ? `${preview.slice(0, 100)}${preview.length > 100 ? "…" : ""}` : "No description"}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, color: "rgba(178,152,218,0.5)", background: "rgba(142,125,165,0.1)", border: "1px solid rgba(142,125,165,0.15)", borderRadius: 6, padding: "1px 6px" }}>{exercise.difficultyLevel}</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Due {new Date(exercise.dueDate).toLocaleDateString()}</span>
      </div>
    </motion.div>
  )
}

// ── Column ────────────────────────────────────────────────────────────────────
function ModeColumn({ label, exercises, courseId, onDelete, deletingId, navigate, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: "20px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 11, color: "rgba(178,152,218,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {label}
        </span>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", borderRadius: 99, padding: "1px 7px" }}>
          {exercises.length}
        </span>
      </div>
      {exercises.length === 0 ? (
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.18)", textAlign: "center", padding: "20px 0" }}>No exercises yet</p>
      ) : (
        exercises.map(ex => (
          <ExerciseCard key={ex.exerciseId} exercise={ex} courseId={courseId} onDelete={onDelete} deletingId={deletingId} navigate={navigate} />
        ))
      )}
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
function CourseExercises() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exercises,   setExercises]   = useState([])
  const [systemModes, setSystemModes] = useState([])
  const [customModes, setCustomModes] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState("")
  const [deletingId,  setDeletingId]  = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => { fetchExercises(); fetchCustomModes() }, [id])

  const fetchExercises = async () => {
    setLoading(true); setError("")
    try {
      const token = localStorage.getItem("token")
      if (!token) { setError("No authentication token found"); setLoading(false); return }
      const res = await fetch(`${API_BASE_URL}/exercises/course/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      setExercises(data.exercises || [])
    } catch { setError("Failed to load exercises.") }
    finally { setLoading(false) }
  }

  const fetchCustomModes = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/exercises/types/course/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      setSystemModes((data.types || []).filter(t => t.isSystemPresent))
      setCustomModes((data.types || []).filter(t => !t.isSystemPresent))
    } catch {}
  }

  const getModeExercises = (modeName) => {
    const mode = [...systemModes, ...customModes].find(m => (m.name || "").toLowerCase() === modeName.toLowerCase())
    if (mode) return exercises.filter(e => e.typeId === mode.typeId)
    return exercises.filter(e => (e.exerciseType || "").toLowerCase() === modeName.toLowerCase())
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.exerciseId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/exercises/${deleteTarget.exerciseId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Delete failed") }
      setExercises(prev => prev.filter(e => e.exerciseId !== deleteTarget.exerciseId))
    } catch (err) { setError(err.message) }
    finally { setDeletingId(null); setDeleteTarget(null) }
  }

  const SYSTEM_MODES = ["beginner", "intermediate", "senior", "professional"]

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginBottom: 4 }}>Exercise Management</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{exercises.length} exercise{exercises.length !== 1 ? "s" : ""} across all modes</p>
        </div>
        <button
          onClick={() => navigate(`/instructor/exercise/create/${id}`)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#8E7DA5,#6E5C86)", border: "1px solid rgba(178,152,218,0.25)", color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.25s" }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(110,92,134,0.45)"; e.currentTarget.style.transform = "translateY(-1px)" }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)" }}
        >
          <Plus size={15} /> Add Exercise
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.3)", fontSize: 13, padding: "40px 0" }}>
          <Loader2 size={18} className="animate-spin" style={{ color: "#8E7DA5" }} /> Loading exercises...
        </div>
      ) : error ? (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "14px 18px", color: "#f87171", fontSize: 13, display: "flex", alignItems: "center", gap: 10 }}>
          {error}
          <button onClick={fetchExercises} style={{ color: "#f87171", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>Try again</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {SYSTEM_MODES.map((name, i) => (
            <ModeColumn key={name} label={name} exercises={getModeExercises(name)} courseId={id} onDelete={setDeleteTarget} deletingId={deletingId} navigate={navigate} index={i} />
          ))}
          {customModes.map((mode, i) => (
            <ModeColumn key={mode.typeId} label={mode.name} exercises={getModeExercises(mode.name)} courseId={id} onDelete={setDeleteTarget} deletingId={deletingId} navigate={navigate} index={SYSTEM_MODES.length + i} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal title={deleteTarget.title} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} loading={!!deletingId} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default CourseExercises