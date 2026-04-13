import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, FileText, BookOpen } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const FILE_ICONS = {
  pdf: "📄", slides: "📊", doc: "📃",
  notes: "📝", article: "📰", default: "📁"
}

function StudentCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("exercises");
  const [course, setCourse] = useState(null)
  const [exercises, setExercises] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      if (!token) { setError("Please log in to view this course."); setLoading(false); return }

      const [courseRes, exercisesRes, materialsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/exercises/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/materials/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      if (!courseRes.ok) throw new Error("Failed to load course details.")

      const courseData = await courseRes.json()
      setCourse(courseData)

      if (exercisesRes.ok) {
        const exercisesData = await exercisesRes.json()
        setExercises(exercisesData.exercises || [])
      }

      if (materialsRes.ok) {
        const materialsData = await materialsRes.json()
        setMaterials(materialsData.materials || [])
      }

    } catch (err) {
      setError("Failed to load course. Please try again.")
    } finally {
      setLoading(false)
    }
  }

const handleDownload = (material) => {
  const link = document.createElement("a")
  link.href = material.content
  link.download = material.filename
  link.click()
}

const handleView = (material) => {
  // Convert base64 data URL to blob and open in new tab
  const base64 = material.content.split(",")[1]
  const mimeType = material.content.split(";")[0].split(":")[1]
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: mimeType })
  const blobUrl = URL.createObjectURL(blob)
  window.open(blobUrl, "_blank")
}

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1F7] flex items-center justify-center">
        <p className="text-gray-500">Loading course...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F1F7] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F1F7]">

      {/* Course Banner — same style as instructor dashboard header */}
      <div className="bg-gradient-to-r from-[#8E7DA5] to-[#B6A7CC] text-white px-10 py-8 flex justify-between items-center shadow-md">
        <div>
          <p className="text-purple-200 text-sm mb-1 font-medium uppercase tracking-widest">
            {course?.languageUsed || "Course"}
          </p>
          <h1 className="text-3xl font-semibold mb-1">
            {course?.courseName || "Course"}
          </h1>
          <p className="text-purple-200 text-sm">
            {course?.startDate && course?.endDate
              ? `${new Date(course.startDate).toLocaleDateString()} — ${new Date(course.endDate).toLocaleDateString()}`
              : ""}
          </p>
        </div>
        <button
          onClick={() => navigate(`/student/course/${courseId}/report`)}
          className="bg-white text-[#6E5C86] px-5 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition shadow"
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
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("exercises")}
            className={`px-5 py-2 rounded-lg font-medium transition ${
              activeTab === "exercises"
                ? "bg-[#6E5C86] text-white"
                : "bg-white shadow hover:bg-gray-50"
            }`}
          >
            Exercises
            {exercises.length > 0 && (
              <span className="ml-2 text-xs opacity-75">({exercises.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("materials")}
            className={`px-5 py-2 rounded-lg font-medium transition ${
              activeTab === "materials"
                ? "bg-[#6E5C86] text-white"
                : "bg-white shadow hover:bg-gray-50"
            }`}
          >
            Materials
            {materials.length > 0 && (
              <span className="ml-2 text-xs opacity-75">({materials.length})</span>
            )}
          </button>
        </div>

        {/* Exercises Tab */}
        {activeTab === "exercises" && (
          <>
            {exercises.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 flex flex-col items-center text-center">
                <BookOpen size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500">No exercises available yet.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {exercises.map((exercise) => (
                  <div
                    key={exercise.exerciseId}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{exercise.title}</h3>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full capitalize">
                        {exercise.exerciseType}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-1 line-clamp-2">
                      {(() => {
                        const p = (exercise.problem || "").trim().replace(/\s+/g, " ")
                        return p
                          ? `${p.slice(0, 140)}${p.length > 140 ? "…" : ""}`
                          : "Open to view the problem statement."
                      })()}
                    </p>
                    <p className="text-gray-400 text-sm mb-4">
                      Due: {exercise.dueDate
                        ? new Date(exercise.dueDate).toLocaleDateString()
                        : "No due date"}
                    </p>
                    <button
                      onClick={() => navigate(`/exercise/${exercise.exerciseId}/workspace`)}
                      className="bg-[#6E5C86] text-white px-4 py-2 rounded-lg hover:bg-[#5a4a70] transition"
                    >
                      Open Exercise →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Materials Tab — real data from DB */}
        {activeTab === "materials" && (
          <>
            {materials.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 flex flex-col items-center text-center">
                <FileText size={48} className="text-gray-300 mb-4" />
                <p className="text-gray-500">No materials uploaded yet.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {materials.map((material) => (
                  <div
                    key={material.materialId}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">
                        {FILE_ICONS[material.filetype] || FILE_ICONS.default}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{material.title}</h3>
                        <p className="text-gray-400 text-sm mb-1">{material.filename}</p>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                          {material.filetype}
                        </span>
                      </div>
                    </div>

              <div className="flex gap-3 mt-5">
                  {material.filetype === "pdf" && (
  <button
    onClick={() => handleView(material)}
    className="flex-1 text-center bg-[#6E5C86] text-white px-4 py-2 rounded-lg hover:bg-[#5a4a70] text-sm transition"
  >
    View
  </button>
)}
                      <button
                        onClick={() => handleDownload(material)}
                        className="flex-1 flex items-center justify-center gap-2 border border-[#6E5C86] text-[#6E5C86] px-4 py-2 rounded-lg hover:bg-purple-50 text-sm transition"
                      >
                        <Download size={15} /> Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default StudentCoursePage;