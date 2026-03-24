import { Outlet, useParams, NavLink, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"

function CourseLayout() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)

  useEffect(() => {

    const courses = JSON.parse(localStorage.getItem("courses")) || []
    setCourse(courses[id])

  }, [id])


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

        {course && (

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
                {course.code}
              </span>

            </div>


            {/* Course Info */}

            <h1 className="text-2xl font-semibold text-[#3e2764]">

              {course.name}

            </h1>

            <p className="text-gray-500 mt-1">

              {course.students?.length || 0} Students • {course.exercises?.length || 0} Exercises

            </p>

          </div>

        )}

        {/* PAGE CONTENT */}

        <Outlet />

      </div>

    </div>

  )
}

export default CourseLayout