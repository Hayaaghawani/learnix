import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Bell, BookOpen, AlertTriangle, Trash2} from "lucide-react"

function InstructorDashboard() {

  const navigate = useNavigate()

  const [courses, setCourses] = useState([])

  useEffect(() => {
    const storedCourses = JSON.parse(localStorage.getItem("courses")) || []
    setCourses(storedCourses)
  }, [])
const deleteCourse = (indexToDelete) => {

  const updatedCourses = courses.filter(
    (_, index) => index !== indexToDelete
  )

  setCourses(updatedCourses)

  localStorage.setItem("courses", JSON.stringify(updatedCourses))
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

          <div className="bg-white/20 p-3 rounded-lg cursor-pointer hover:bg-white/30 transition">
            <Bell size={20}/>
          </div>

          <div className="bg-white text-[#6E5C86] w-10 h-10 flex items-center justify-center rounded-full font-semibold cursor-pointer hover:scale-105 transition">
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

      <div className="grid grid-cols-3 gap-6 mb-12 relative z-10">

        {courses.length === 0 ? (

          <div className="col-span-3 text-center text-gray-500">
            No courses created yet
          </div>

        ) : (

         courses.map((course, index) => (

  <div
  key={index}
  onClick={() => navigate(`/instructor/course/${index}/exercises`)}
  className="bg-white p-6 rounded-xl shadow hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition duration-300 cursor-pointer"
>

    <div className="flex justify-between items-start">

      <h3 className="text-lg font-semibold">
        {course.name}
      </h3>

      <Trash2
        size={18}
        className="text-red-500 cursor-pointer hover:text-red-700"
       onClick={(e) => {
  e.stopPropagation()
  deleteCourse(index)
}}
      />

    </div>

    <p className="text-gray-500 text-sm mt-2">
      {course.description}
    </p>

    <div className="flex justify-between text-sm text-gray-500 mt-4">
    <span>👥 {course.students?.length || 0} Students</span>
      <span>{course.code}</span>
    </div>

  </div>

))

        )}

      </div>

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