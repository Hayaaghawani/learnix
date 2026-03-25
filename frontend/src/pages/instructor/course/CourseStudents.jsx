import { useParams, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Copy, User } from "lucide-react"

function CourseStudents() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [course, setCourse] = useState(null)



  useEffect(() => {

    const courses = JSON.parse(localStorage.getItem("courses")) || []

    const selectedCourse = courses[id]

    if (!selectedCourse) {
      setCourse(null)
      return
    }

    // ensure students is always an array
    if (!Array.isArray(selectedCourse.students)) {
      selectedCourse.students = []
    }

    setCourse(selectedCourse)

  }, [id])



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

      {/* Page Title */}

      <h1 className="text-2xl font-semibold text-[#3e2764] mb-6">
        Course Enrollment
      </h1>



      {/* Invitation Link */}

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
            <Copy size={16}/>
            Copy
          </button>

        </div>

      </div>



      {/* Students List */}

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
                key={index}
                className="flex justify-between items-center border-b pb-3"
              >

                {/* Student Info */}

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



                {/* Report Button */}

                <button
                  onClick={() =>
                    navigate(`/instructor/course/${id}/students/${index}/report`)
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