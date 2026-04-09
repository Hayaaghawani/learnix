import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Plus, Loader2 } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function CourseExercises() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchExercises()
  }, [id])

  const fetchExercises = async () => {
    setLoading(true)
    setError('')

    console.log('Fetching exercises for course ID:', id)

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found")
        setLoading(false)
        return
      }

      console.log('Using token:', token.substring(0, 20) + '...')

      const response = await fetch(`${API_BASE_URL}/exercises/course/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log('Error response:', errorText)
        throw new Error(`Failed to fetch exercises: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Received exercises:', data)
      setExercises(data.exercises || [])
    } catch (error) {
      console.error("Error fetching exercises:", error)
      setError("Failed to load exercises. Please try again.")
    } finally {
      setLoading(false)
    }
  }

// Replace the 4 filter blocks with these:
const beginnerExercises = exercises.filter(e =>
  (e.exerciseType || "").toLowerCase() === "beginner"
)
const intermediateExercises = exercises.filter(e =>
  (e.exerciseType || "").toLowerCase() === "intermediate"
)
const seniorExercises = exercises.filter(e =>
  (e.exerciseType || "").toLowerCase() === "senior"
)
const professionalExercises = exercises.filter(e =>
  (e.exerciseType || "").toLowerCase() === "professional"
)
  return (

    <div className="min-h-screen bg-[#F4F1F7] px-10 py-10">

      {/* Header */}

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-2xl font-semibold text-[#3e2764]">
          Exercise Management
        </h1>

        <button
          onClick={() => navigate(`/instructor/exercise/create/${id}`)}
          className="flex items-center gap-2 bg-[#8E7DA5] text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          <Plus size={18}/>
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
          <button
            onClick={fetchExercises}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      ) : (

        <div className="grid grid-cols-3 gap-6">

          {/* BEGINNER */}

          <div className="bg-white p-6 rounded-xl shadow">

            <h2 className="font-semibold mb-4 text-[#6E5C86]">
              BEGINNER
            </h2>

            {beginnerExercises.length === 0 ? (
              <p className="text-gray-400 text-sm">No exercises yet</p>
            ) : (
              beginnerExercises.map((exercise) => (
                <div
                  key={exercise.exerciseId}
                  className="bg-gray-50 p-4 rounded-lg mb-3 shadow-sm cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => navigate(`/exercise/${exercise.exerciseId}/workspace`)}
                >

                  <h3 className="font-medium">
                    {exercise.title}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {exercise.keyConcept || "No description"}
                  </p>

                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Difficulty: {exercise.difficultyLevel}</span>
                    <span>Due: {new Date(exercise.dueDate).toLocaleDateString()}</span>
                  </div>

                </div>
              ))
            )}

          </div>



          {/* INTERMEDIATE */}

          <div className="bg-white p-6 rounded-xl shadow">

            <h2 className="font-semibold mb-4 text-[#6E5C86]">
              INTERMEDIATE
            </h2>

            {intermediateExercises.length === 0 ? (
              <p className="text-gray-400 text-sm">No exercises yet</p>
            ) : (
              intermediateExercises.map((exercise) => (
                <div
                  key={exercise.exerciseId}
                  className="bg-gray-50 p-4 rounded-lg mb-3 shadow-sm cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => navigate(`/exercise/${exercise.exerciseId}/workspace`)}
                >

                  <h3 className="font-medium">
                    {exercise.title}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {exercise.keyConcept || "No description"}
                  </p>

                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Difficulty: {exercise.difficultyLevel}</span>
                    <span>Due: {new Date(exercise.dueDate).toLocaleDateString()}</span>
                  </div>

                </div>
              ))
            )}

          </div>



          {/* SENIOR */}

          <div className="bg-white p-6 rounded-xl shadow">

            <h2 className="font-semibold mb-4 text-[#6E5C86]">
              SENIOR
            </h2>

            {seniorExercises.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No exercises yet
              </p>
            ) : (
              seniorExercises.map((exercise) => (
                <div
                  key={exercise.exerciseId}
                  className="bg-gray-50 p-4 rounded-lg mb-3 shadow-sm cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => navigate(`/exercise/${exercise.exerciseId}/workspace`)}
                >

                  <h3 className="font-medium">
                    {exercise.title}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {exercise.keyConcept || "No description"}
                  </p>

                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Difficulty: {exercise.difficultyLevel}</span>
                    <span>Due: {new Date(exercise.dueDate).toLocaleDateString()}</span>
                  </div>

                </div>
              ))
            )}

          </div>



          {/* PROFESSIONAL */}

          <div className="bg-white p-6 rounded-xl shadow">

            <h2 className="font-semibold mb-4 text-[#6E5C86]">
              PROFESSIONAL
            </h2>

            {professionalExercises.length === 0 ? (
              <p className="text-gray-400 text-sm">
                No exercises yet
              </p>
            ) : (
              professionalExercises.map((exercise) => (
                <div
                  key={exercise.exerciseId}
                  className="bg-gray-50 p-4 rounded-lg mb-3 shadow-sm cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => navigate(`/exercise/${exercise.exerciseId}/workspace`)}
                >

                  <h3 className="font-medium">
                    {exercise.title}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {exercise.keyConcept || "No description"}
                  </p>

                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Difficulty: {exercise.difficultyLevel}</span>
                    <span>Due: {new Date(exercise.dueDate).toLocaleDateString()}</span>
                  </div>

                </div>
              ))
            )}

          </div>

        </div>

      )}

    </div>

  )
}

export default CourseExercises