import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Plus, Loader2, Trash2, AlertTriangle } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function CourseExercises() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [exercises, setExercises] = useState([])
  const [systemModes, setSystemModes] = useState([])
  const [customModes, setCustomModes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchExercises()
    fetchCustomModes()
  }, [id])

  const fetchExercises = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem("token")
      if (!token) { setError("No authentication token found"); setLoading(false); return }
      const response = await fetch(`${API_BASE_URL}/exercises/course/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch exercises: ${response.status} - ${errorText}`)
      }
      const data = await response.json()
      setExercises(data.exercises || [])
    } catch (error) {
      console.error("Error fetching exercises:", error)
      setError("Failed to load exercises. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomModes = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/exercises/types/course/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) return
      const data = await response.json()
      const system = (data.types || []).filter(t => t.isSystemPresent)
      const custom = (data.types || []).filter(t => !t.isSystemPresent)
      setSystemModes(system)
      setCustomModes(custom)
    } catch {}
  }

  
    

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeletingId(deleteTarget.exerciseId)
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/exercises/${deleteTarget.exerciseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || "Failed to delete exercise")
      }
      setExercises((prev) => prev.filter((e) => e.exerciseId !== deleteTarget.exerciseId))
    } catch (err) {
      setError(err.message || "Failed to delete exercise. Please try again.")
    } finally {
      setDeletingId(null)
      setDeleteTarget(null)
    }
  }

  const getModeExercises = (modeName) => {
    const mode = [...systemModes, ...customModes].find(
      (m) => (m.name || "").toLowerCase() === modeName.toLowerCase()
    )
    if (mode) {
      return exercises.filter((e) => (e.typeId || "") === mode.typeId)
    }
    // Fallback for legacy rows where mode was stored in exerciseType.
    return exercises.filter((e) => (e.exerciseType || "").toLowerCase() === modeName.toLowerCase())
  }

  const beginnerExercises = getModeExercises("beginner")
  const intermediateExercises = getModeExercises("intermediate")
  const seniorExercises = getModeExercises("senior")
  const professionalExercises = getModeExercises("professional")

  const ExerciseCard = ({ exercise }) => (
    <div
      className="bg-gray-50 p-4 rounded-lg mb-3 shadow-sm cursor-pointer hover:bg-gray-100 transition"
      onClick={() => navigate(`/exercise/${exercise.exerciseId}/workspace`)}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{exercise.title}</h3>
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteTarget(exercise) }}
          disabled={deletingId === exercise.exerciseId}
          className="text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
          title="Delete exercise"
        >
          {deletingId === exercise.exerciseId
            ? <Loader2 size={16} className="animate-spin" />
            : <Trash2 size={16} />
          }
        </button>
      </div>
      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
        {(() => {
          const p = (exercise.problem || "").trim().replace(/\s+/g, " ")
          return p ? `${p.slice(0, 120)}${p.length > 120 ? "…" : ""}` : "No description"
        })()}
      </p>
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>Difficulty: {exercise.difficultyLevel}</span>
        <span>Due: {new Date(exercise.dueDate).toLocaleDateString()}</span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F4F1F7] px-10 py-10">

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 flex flex-col items-center text-center">

            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <AlertTriangle className="text-red-500" size={32} />
            </div>

            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Delete Exercise?
            </h2>
            <p className="text-gray-500 text-sm mb-1">
              You're about to delete
            </p>
            <p className="text-[#3e2764] font-semibold mb-4">
              "{deleteTarget.title}"
            </p>
            <p className="text-gray-400 text-xs mb-8">
              This action cannot be undone. All test cases and submissions for this exercise will be permanently removed.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={!!deletingId}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingId ? <><Loader2 size={15} className="animate-spin" /> Deleting...</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-[#3e2764]">Exercise Management</h1>
        <button
          onClick={() => navigate(`/instructor/exercise/create/${id}`)}
          className="flex items-center gap-2 bg-[#8E7DA5] text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          <Plus size={18} />
          Add Exercise
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-[#8E7DA5]" size={32} />
          <span className="ml-2 text-gray-600">Loading exercises...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={fetchExercises} className="ml-2 underline hover:no-underline">
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">

          {/* BEGINNER */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold mb-4 text-[#6E5C86]">BEGINNER</h2>
            {beginnerExercises.length === 0 ? (
              <p className="text-gray-400 text-sm">No exercises yet</p>
            ) : (
              beginnerExercises.map((exercise) => (
                <ExerciseCard key={exercise.exerciseId} exercise={exercise} />
              ))
            )}
          </div>

          {/* INTERMEDIATE */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold mb-4 text-[#6E5C86]">INTERMEDIATE</h2>
            {intermediateExercises.length === 0 ? (
              <p className="text-gray-400 text-sm">No exercises yet</p>
            ) : (
              intermediateExercises.map((exercise) => (
                <ExerciseCard key={exercise.exerciseId} exercise={exercise} />
              ))
            )}
          </div>

          {/* SENIOR */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold mb-4 text-[#6E5C86]">SENIOR</h2>
            {seniorExercises.length === 0 ? (
              <p className="text-gray-400 text-sm">No exercises yet</p>
            ) : (
              seniorExercises.map((exercise) => (
                <ExerciseCard key={exercise.exerciseId} exercise={exercise} />
              ))
            )}
          </div>

          {/* PROFESSIONAL */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold mb-4 text-[#6E5C86]">PROFESSIONAL</h2>
            {professionalExercises.length === 0 ? (
              <p className="text-gray-400 text-sm">No exercises yet</p>
            ) : (
              professionalExercises.map((exercise) => (
                <ExerciseCard key={exercise.exerciseId} exercise={exercise} />
              ))
            )}
          </div>

          {/* CUSTOM MODES — one column per custom mode, always visible */}
          {customModes.map((mode) => {
            const modeExercises = getModeExercises(mode.name || "")
            return (
              <div key={mode.typeId} className="bg-white p-6 rounded-xl shadow">
                <h2 className="font-semibold mb-4 text-[#6E5C86]">{mode.name}</h2>
                {modeExercises.length === 0 ? (
                  <p className="text-gray-400 text-sm">No exercises yet</p>
                ) : (
                  modeExercises.map((exercise) => (
                    <ExerciseCard key={exercise.exerciseId} exercise={exercise} />
                  ))
                )}
              </div>
            )
          })}

        </div>
      )}
    </div>
  )
}

export default CourseExercises