import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function StudentCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("exercises");
  const [course, setCourse] = useState(null)
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Dummy materials until backend is ready
  const materials = [
    { id: 1, title: "Lecture 1 Slides", type: "PDF" },
    { id: 2, title: "Database Design Video", type: "Video" }
  ]

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Please log in to view this course.")
        setLoading(false)
        return
      }

      // Fetch course details and exercises in parallel
      const [courseRes, exercisesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/exercises/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!courseRes.ok) {
        throw new Error("Failed to load course details.")
      }

      const courseData = await courseRes.json()
      setCourse(courseData)

      if (exercisesRes.ok) {
        const exercisesData = await exercisesRes.json()
        setExercises(exercisesData.exercises || [])
      }

    } catch (err) {
      console.error("Error loading course data:", err)
      setError("Failed to load course. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading course...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <div className="w-full bg-[#6E5C86] text-white px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">{course?.courseName || "Course"}</h1>
        <button
          onClick={() => navigate(`/student/course/${courseId}/report`)}
          className="bg-white text-[#6E5C86] px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
        >
          View My Report
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Course Description */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-2">Course Description</h2>
          <p className="text-gray-600">
            {course?.description || "No description available."}
          </p>
          <div className="flex gap-4 mt-3 text-sm text-gray-400">
            {course?.languageUsed && <span>Language: {course.languageUsed}</span>}
            {course?.startDate && (
              <span>
                {new Date(course.startDate).toLocaleDateString()} —{" "}
                {new Date(course.endDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("exercises")}
            className={`px-5 py-2 rounded-lg font-medium ${
              activeTab === "exercises"
                ? "bg-[#6E5C86] text-white"
                : "bg-white shadow"
            }`}
          >
            Exercises
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`px-5 py-2 rounded-lg font-medium ${
              activeTab === "materials"
                ? "bg-[#6E5C86] text-white"
                : "bg-white shadow"
            }`}
          >
            Materials
          </button>
        </div>

        {/* Exercises Tab */}
        {activeTab === "exercises" && (
          <>
            {exercises.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-6 text-gray-500">
                No exercises available yet.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {exercises.map((exercise) => (
                  <div
                    key={exercise.exerciseId}
                    className="bg-white rounded-xl shadow-md p-6"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{exercise.title}</h3>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full capitalize">
                        {exercise.exerciseType}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-1">
                      {exercise.keyConcept || "No description"}
                    </p>

                    <p className="text-gray-400 text-sm mb-4">
                      Due: {exercise.dueDate
                        ? new Date(exercise.dueDate).toLocaleDateString()
                        : "No due date"}
                    </p>

                    <button
                      onClick={() => navigate(`/exercise/${exercise.exerciseId}/workspace`)}
                      className="bg-[#6E5C86] text-white px-4 py-2 rounded-lg hover:bg-[#5a4a70]"
                    >
                      Open Exercise
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Materials Tab — still dummy */}
        {activeTab === "materials" && (
          <div className="grid md:grid-cols-2 gap-6">
            {materials.map((material) => (
              <div key={material.id} className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-semibold text-lg">{material.title}</h3>
                <p className="text-gray-600 mb-4">Type: {material.type}</p>
                <button className="bg-[#6E5C86] text-white px-4 py-2 rounded-lg hover:bg-[#5a4a70]">
                  View Material
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default StudentCoursePage;