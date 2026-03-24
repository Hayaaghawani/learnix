import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { ArrowLeft, BookOpen, Users, FileText, BarChart3, Brain } from "lucide-react"

function CourseHome() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)

  useEffect(() => {

    const courses = JSON.parse(localStorage.getItem("courses")) || []
    setCourse(courses[id])

  }, [id])

  if (!course) {
    return <div className="p-10">Loading course...</div>
  }

  return (

    <div className="min-h-screen bg-[#F4F1F7] px-10 py-10">

      {/* Back Button */}
      <button
        onClick={() => navigate("/instructor/dashboard")}
        className="flex items-center gap-2 text-[#6E5C86] hover:underline mb-6"
      >
        <ArrowLeft size={18}/>
        Back to Dashboard
      </button>


      {/* Course Header */}
      <div className="bg-white p-8 rounded-xl shadow mb-10">

        <h1 className="text-3xl font-bold text-[#3e2764]">
          {course.name}
        </h1>

        <p className="text-gray-500 mt-2">
          {course.description}
        </p>

        <div className="flex gap-6 mt-4 text-sm text-gray-500">
          <span>📘 {course.code}</span>
          <span>👥 {course.students || 0} Students</span>
        </div>

      </div>


      {/* Course Sections */}
      <div className="grid grid-cols-3 gap-6">

        {/* Exercises */}
        <div
          onClick={() => navigate(`/instructor/course/${id}/exercises`)}
          className="bg-white p-6 rounded-xl shadow hover:shadow-lg hover:-translate-y-1 cursor-pointer transition"
        >

          <BookOpen className="text-[#8E7DA5] mb-3"/>

          <h3 className="text-lg font-semibold">
            Exercises
          </h3>

          <p className="text-gray-500 text-sm mt-1">
            Manage exercises and assignments
          </p>

        </div>


        {/* Students */}
        <div
          onClick={() => navigate(`/instructor/course/${id}/students`)}
          className="bg-white p-6 rounded-xl shadow hover:shadow-lg hover:-translate-y-1 cursor-pointer transition"
        >

          <Users className="text-[#8E7DA5] mb-3"/>

          <h3 className="text-lg font-semibold">
            Enrollment
          </h3>

          <p className="text-gray-500 text-sm mt-1">
            View enrolled students and reports
          </p>

        </div>


        {/* Course Material */}
        <div
          onClick={() => navigate(`/instructor/course/${id}/material`)}
          className="bg-white p-6 rounded-xl shadow hover:shadow-lg hover:-translate-y-1 cursor-pointer transition"
        >

          <FileText className="text-[#8E7DA5] mb-3"/>

          <h3 className="text-lg font-semibold">
            Course Material
          </h3>

          <p className="text-gray-500 text-sm mt-1">
            Upload learning resources
          </p>

        </div>


        {/* AI Defaults */}
        <div
          onClick={() => navigate(`/instructor/course/${id}/ai`)}
          className="bg-white p-6 rounded-xl shadow hover:shadow-lg hover:-translate-y-1 cursor-pointer transition"
        >

          <Brain className="text-[#8E7DA5] mb-3"/>

          <h3 className="text-lg font-semibold">
            AI Defaults
          </h3>

          <p className="text-gray-500 text-sm mt-1">
            Configure AI learning modes
          </p>

        </div>


        {/* Analytics */}
        <div
          onClick={() => navigate(`/instructor/course/${id}/analytics`)}
          className="bg-white p-6 rounded-xl shadow hover:shadow-lg hover:-translate-y-1 cursor-pointer transition"
        >

          <BarChart3 className="text-[#8E7DA5] mb-3"/>

          <h3 className="text-lg font-semibold">
            Analytics
          </h3>

          <p className="text-gray-500 text-sm mt-1">
            Course performance insights
          </p>

        </div>

      </div>

    </div>
  )
}

export default CourseHome