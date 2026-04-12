import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Bell, BookOpen, AlertTriangle, Trash2, Loader2 } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function InstructorDashboard() {

  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.warn("Unable to parse stored user:", e)
      }
    }

    fetchCourses()
  }, [])

  const instructorUsername = user?.email?.split("@")[0]?.toLowerCase() || ""

  const fetchCourses = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found")
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}/courses/my`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`)
      }

      const data = await response.json()
      console.log('Dashboard received courses:', data)
      setCourses(data.courses || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      setError("Failed to load courses. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const deleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        alert("No authentication token found")
        return
      }

      const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.detail || "Failed to delete course")
        return
      }

      // Remove course from list
      setCourses(courses.filter(course => course.courseId !== courseId))
      alert("Course deleted successfully")
    } catch (error) {
      console.error("Error deleting course:", error)
      alert("Failed to delete course. Please try again.")
    }
  }
  return (
    <div className="min-h-screen bg-[#F4F1F7] px-10 py-10 relative overflow-hidden">

      {/* Background shapes */}
      <div className="absolute top-20 left-[-80px] w-72 h-72 bg-[#CBBED8] opacity-30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-[-80px] w-72 h-72 bg-[#B6A7CC] opacity-30 rounded-full blur-3xl"></div>

      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-[#8E7DA5] to-[#B6A7CC] text-white rounded-xl shadow-lg p-8 mb-10 flex justify-between items-center relative z-10">

        <div>
          <h1 className="text-3xl font-semibold">
            Welcome back, Instructor
          </h1>

          <p className="text-sm opacity-90 mt-1">
            Your space to manage courses and students
          </p>
        </div>

        <div className="flex items-center gap-5">

          <div 
            onClick={() => navigate("/instructor/notifications")}
            className="bg-white/20 p-3 rounded-lg cursor-pointer hover:bg-white/30 transition"
            title="View notifications"
          >
            <Bell size={20}/>
          </div>

          <div 
          onClick={() => navigate("/profile")} 
          className="bg-white text-[#6E5C86] w-10 h-10 flex items-center justify-center rounded-full font-semibold cursor-pointer hover:scale-105 transition">
            AA
          </div>

          <button
            onClick={() => navigate("/instructor/create-course")}
            className="bg-white text-[#6E5C86] px-5 py-3 rounded-lg font-medium shadow hover:scale-105 transition"
          >
            + Create Course
          </button>

        </div>

      </div>

      {/* My Courses */}
      <h2 className="text-xl font-semibold text-[#3e2764] mb-4 flex items-center gap-2 relative z-10">
        <BookOpen size={20}/> My Courses
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-[#8E7DA5]" size={32} />
          <span className="ml-2 text-gray-600">Loading courses...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
          <button
            onClick={fetchCourses}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6 mb-12 relative z-10">
          {courses.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500 py-12">
              <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No courses created yet</p>
              <button
                onClick={() => navigate("/instructor/create-course")}
                className="mt-4 bg-[#8E7DA5] text-white px-4 py-2 rounded-lg hover:bg-[#7B6A96] transition"
              >
                Create Your First Course
              </button>
            </div>
          ) : (
            courses.map((course) => (
              <div
                key={course.courseId}
                onClick={() => navigate(`/instructor/course/${course.courseId}/exercises`)}
                className="bg-white p-6 rounded-xl shadow hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition duration-300 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {course.courseName}
                    </h3>
                    
                    {instructorUsername && (
                      <p className="text-xs text-gray-400 mt-1 break-all">
                        Join Code: {`${instructorUsername}${course.courseId}`}
                      </p>
                    )}
                  </div>
                  <Trash2
                    size={18}
                    className="text-red-500 cursor-pointer hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCourse(course.courseId)
                    }}
                  />
                </div>

                <p className="text-gray-500 text-sm mt-2">
                  {course.description || "No description"}
                </p>

                <div className="flex justify-between text-sm text-gray-500 mt-4">
                  <span>🖥️ {course.languageUsed}</span>
                  <span>📅 {new Date(course.startDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Academic Alerts */}
      <h2 className="text-xl font-semibold text-[#3e2764] mb-4 flex items-center gap-2 relative z-10">
        <AlertTriangle size={20}/> Academic Alerts
      </h2>

      <div className="grid grid-cols-2 gap-6 relative z-10">

        <div className="bg-red-100 border border-red-300 p-5 rounded-lg hover:shadow-md transition">
          <p className="font-semibold text-red-700 flex items-center gap-2">
            🚨 Potential Plagiarism Detected
          </p>

          <p className="text-sm text-red-600 mt-1">
            High similarity detected in "Sum of Array" assignment.
          </p>
        </div>

        <div className="bg-yellow-100 border border-yellow-300 p-5 rounded-lg hover:shadow-md transition">
          <p className="font-semibold text-yellow-700 flex items-center gap-2">
            🤖 AI Over-reliance Warning
          </p>

          <p className="text-sm text-yellow-600 mt-1">
            A student requested multiple hints without attempts.
          </p>
        </div>

      </div>

    </div>
  )
}

export default InstructorDashboard