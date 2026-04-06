import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Copy, User } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function CourseStudents() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchCourseStudents = async () => {
      setLoading(true)
      setError("")

      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("No authentication token found")
          setCourse(null)
          return
        }

        const resp = await fetch(`${API_BASE_URL}/courses/${id}/students`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await resp.json()

        if (!resp.ok) {
          setError(data.detail || "Failed to load course students")
          setCourse(null)
          return
        }

        setCourse({
          courseId: data.courseId,
          courseName: data.courseName,
          code: data.enrollmentCode || data.courseId || "",
          students: Array.isArray(data.students) ? data.students : [],
        })
      } catch (error) {
        console.error("Failed to load students:", error)
        setError("Failed to load students. Please try again.")
        setCourse(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCourseStudents()
  }, [id])

  if (loading) {
    return <div className="p-10">Loading students...</div>
  }

  if (error) {
    return <div className="p-10 text-red-600">{error}</div>
  }

  if (!course) {
    return <div className="p-10">Course not found.</div>
  }

  const inviteLink = `${window.location.origin}/join-course/${course.code}`

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    alert("Invitation link copied!")
  }

  return (
    <div className="min-h-screen bg-[#F4F1F7] p-10">
      <h1 className="text-2xl font-semibold text-[#3e2764] mb-6">
        Course Enrollment
      </h1>

      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="font-semibold mb-2">
          Invitation Link
        </h2>

        <div className="flex gap-4 items-center">
          <input
            value={inviteLink}
            readOnly
            className="border p-3 rounded-lg w-full"
          />

          <button
            onClick={copyLink}
            className="bg-[#8E7DA5] text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Copy size={16} />
            Copy
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">
          Enrolled Students
        </h2>

        {course.students.length === 0 ? (
          <p className="text-gray-500">
            No students enrolled yet.
          </p>
        ) : (
          <div className="space-y-4">
            {course.students.map((student, index) => (
              <div
                key={student.studentId || index}
                className="flex justify-between items-center border-b pb-3"
              >
                <div className="flex items-center gap-3">
                  <User size={20} className="text-[#6E5C86]" />

                  <div>
                    <p className="font-medium">
                      {student.name || "Unnamed Student"}
                    </p>

                    <p className="text-sm text-gray-500">
                      {student.email || "No email"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    navigate(`/instructor/course/${id}/students/${student.studentId || index}/report`)
                  }
                  className="text-sm bg-[#8E7DA5] text-white px-4 py-2 rounded-lg hover:opacity-90"
                >
                  View Report
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseStudents