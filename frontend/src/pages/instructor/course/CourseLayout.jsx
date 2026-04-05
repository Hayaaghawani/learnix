import { Outlet, useParams, NavLink, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function CourseLayout() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found")
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch course: ${response.status}`)
      }

      const courseData = await response.json()
      setCourse(courseData)
    } catch (error) {
      console.error("Error fetching course:", error)
      setError("Failed to load course details")
    } finally {
      setLoading(false)
    }
  }


  const linkStyle =
    "block w-full text-left px-3 py-2 rounded-lg transition"

  const activeStyle =
    "bg-[#E8E2F1] text-[#6E5C86] font-medium"

  const normalStyle =
    "text-gray-600 hover:bg-gray-100"



  return (

    <div className="min-h-screen flex bg-[#F4F1F7]">

      {/* SIDEBAR */}

      <div className="w-64 bg-white shadow-lg p-6">

        <h2 className="text-xl font-semibold text-[#3e2764] mb-6">
          Course Menu
        </h2>

        <div className="space-y-2">

          <NavLink
            to={`/instructor/course/${id}/exercises`}
            className={({ isActive }) =>
              `${linkStyle} ${isActive ? activeStyle : normalStyle}`
            }
          >
            Exercises
          </NavLink>

          <NavLink
            to={`/instructor/course/${id}/students`}
            className={({ isActive }) =>
              `${linkStyle} ${isActive ? activeStyle : normalStyle}`
            }
          >
            Students
          </NavLink>

          <NavLink
            to={`/instructor/course/${id}/material`}
            className={({ isActive }) =>
              `${linkStyle} ${isActive ? activeStyle : normalStyle}`
            }
          >
            Materials
          </NavLink>

          <NavLink
            to={`/instructor/course/${id}/ai`}
            className={({ isActive }) =>
              `${linkStyle} ${isActive ? activeStyle : normalStyle}`
            }
          >
            AI Modes
          </NavLink>

          <NavLink
            to={`/instructor/course/${id}/analytics`}
            className={({ isActive }) =>
              `${linkStyle} ${isActive ? activeStyle : normalStyle}`
            }
          >
            Analytics
          </NavLink>

        </div>

      </div>



      {/* CONTENT AREA */}

      <div className="flex-1 p-10">

        {/* COURSE HEADER */}

        {loading ? (
          <div className="bg-white p-6 rounded-xl shadow mb-8">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-8">
            {error}
            <button
              onClick={fetchCourse}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        ) : course ? (

          <div className="bg-white p-6 rounded-xl shadow mb-8">

            {/* Breadcrumb */}

            <div className="text-sm text-gray-500 mb-2">

              <span
                onClick={() => navigate("/instructor")}
                className="cursor-pointer hover:underline"
              >
                Dashboard
              </span>

              {" > "}

              <span className="text-gray-700 font-medium">
                {course.courseName}
              </span>

            </div>


            {/* Course Info */}

            <h1 className="text-2xl font-semibold text-[#3e2764]">

              {course.courseName}

            </h1>

            <p className="text-gray-500 mt-1">

              {course.languageUsed} • {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}

            </p>

          </div>

        ) : null}

        {/* PAGE CONTENT */}

        <Outlet />

      </div>

    </div>

  )
}

export default CourseLayout