import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Plus } from "lucide-react"

function CourseExercises() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)

  useEffect(() => {

    const courses = JSON.parse(localStorage.getItem("courses")) || []
    const selectedCourse = courses[id]

    if (!selectedCourse.exercises) {
      selectedCourse.exercises = []
    }

    setCourse(selectedCourse)

  }, [id])

  if (!course) return <div className="p-10">Loading...</div>

  const trainingExercises = course.exercises.filter(e => e.type === "training")
  const assignmentExercises = course.exercises.filter(e => e.type === "assignment")
  const midtermExercises = course.exercises.filter(e => e.type === "midterm")

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


      {/* Exercise Columns */}

      <div className="grid grid-cols-3 gap-6">


        {/* TRAINING */}

        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="font-semibold mb-4 text-[#6E5C86]">
            TRAINING MODE
          </h2>

          {trainingExercises.length === 0 ? (
            <p className="text-gray-400 text-sm">No exercises yet</p>
          ) : (
            trainingExercises.map((exercise, i) => (
              <div
                key={i}
                className="bg-gray-50 p-4 rounded-lg mb-3 shadow-sm"
              >

                <h3 className="font-medium">
                  {exercise.title}
                </h3>

                <p className="text-sm text-gray-500">
                  {exercise.description}
                </p>

              </div>
            ))
          )}

        </div>



        {/* ASSIGNMENT */}

        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="font-semibold mb-4 text-[#6E5C86]">
            GRADED ASSIGNMENT
          </h2>

          {assignmentExercises.length === 0 ? (
            <p className="text-gray-400 text-sm">No exercises yet</p>
          ) : (
            assignmentExercises.map((exercise, i) => (
              <div
                key={i}
                className="bg-gray-50 p-4 rounded-lg mb-3 shadow-sm"
              >

                <h3 className="font-medium">
                  {exercise.title}
                </h3>

                <p className="text-sm text-gray-500">
                  {exercise.description}
                </p>

              </div>
            ))
          )}

        </div>



        {/* MIDTERM */}

        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="font-semibold mb-4 text-[#6E5C86]">
            MIDTERM PREP
          </h2>

          {midtermExercises.length === 0 ? (
            <p className="text-gray-400 text-sm">
              Drag exercises here
            </p>
          ) : (
            midtermExercises.map((exercise, i) => (
              <div
                key={i}
                className="bg-gray-50 p-4 rounded-lg mb-3 shadow-sm"
              >

                <h3 className="font-medium">
                  {exercise.title}
                </h3>

                <p className="text-sm text-gray-500">
                  {exercise.description}
                </p>

              </div>
            ))
          )}

        </div>

      </div>

    </div>
  )
}

export default CourseExercises