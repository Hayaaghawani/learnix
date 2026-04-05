import { useState } from "react"
import { useNavigate } from "react-router-dom"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function CreateCourse() {

  const navigate = useNavigate()

  const [gradingType, setGradingType] = useState("first-second-final")

  const [course, setCourse] = useState({
    name: "",
    code: "",
    semester: "",
    credits: "",
    department: "",
    languageUsed: "",
    startDate: "",
    endDate: "",
    students: "",
    prerequisites: "",
    description: "",
    first: 0,
    second: 0,
    midterm: 0,
    final: 0,
    coursework: 0
  })

  const [error, setError] = useState("")

  const handleChange = (e) => {
    setCourse({
      ...course,
      [e.target.name]: e.target.value
    })
  }

  const validateWeights = () => {

    let total = 0

    if (gradingType === "first-second-final") {
      total =
        Number(course.first) +
        Number(course.second) +
        Number(course.final) +
        Number(course.coursework)
    }

    if (gradingType === "mid-final") {
      total =
        Number(course.midterm) +
        Number(course.final) +
        Number(course.coursework)
    }

    if (gradingType === "af") {
      total = Number(course.coursework)
    }

    return total === 100
  }

  const handleCreate = async () => {

    if (
      !course.name ||
      !course.code ||
      !course.semester ||
      !course.credits ||
      !course.department ||
      !course.languageUsed ||
      !course.startDate ||
      !course.endDate ||
      !course.students
    ) {
      setError("Please fill all required fields")
      return
    }

    if (!validateWeights()) {
      setError("Assessment weights must equal 100%")
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      setError("You must be logged in to create a course")
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/courses/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseName: course.name,
          description: course.description,
          languageUsed: course.languageUsed,
          startDate: course.startDate,
          endDate: course.endDate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.detail || "Failed to create course")
        return
      }

      navigate("/instructor")
    } catch (err) {
      console.error(err)
      setError("Failed to create course. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F1F7] py-10 px-10">

      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow">

        <h1 className="text-2xl font-semibold text-[#3e2764] mb-8">
          Create Course
        </h1>

        {/* Basic Information */}
        <div className="mb-8">

          <h2 className="font-semibold mb-4 text-lg">
            Basic Information
          </h2>

          <div className="grid grid-cols-2 gap-4">

            <input required name="name" placeholder="Course Name"
              className="border p-2 rounded"
              onChange={handleChange}/>

            <input required name="code" placeholder="Course Code"
              className="border p-2 rounded"
              onChange={handleChange}/>

            <input required name="semester" placeholder="Semester"
              className="border p-2 rounded"
              onChange={handleChange}/>

            <input required name="credits" type="number"
              placeholder="Credit Hours"
              className="border p-2 rounded"
              onChange={handleChange}/>

            <input required name="department"
              placeholder="Department"
              className="border p-2 rounded"
              onChange={handleChange}/>

            <input required name="languageUsed"
              placeholder="Course Language"
              className="border p-2 rounded"
              onChange={handleChange}/>

            <input required name="students" type="number"
              placeholder="Max Students"
              className="border p-2 rounded"
              onChange={handleChange}/>

          </div>

          <input
            name="startDate"
            type="date"
            placeholder="Start Date"
            className="border p-2 rounded w-full mt-4"
            onChange={handleChange}
          />

          <input
            name="endDate"
            type="date"
            placeholder="End Date"
            className="border p-2 rounded w-full mt-4"
            onChange={handleChange}
          />

          <input
            name="prerequisites"
            placeholder="Prerequisites (optional)"
            className="border p-2 rounded w-full mt-4"
            onChange={handleChange}
          />

          <textarea
            name="description"
            placeholder="Course Description (optional)"
            className="border p-2 rounded w-full mt-4 h-24"
            onChange={handleChange}
          />

        </div>

        {/* Grading Type */}
        <div className="mb-8">

          <h2 className="font-semibold mb-4 text-lg">
            Grading Structure
          </h2>

          <div className="flex gap-4">

            <button
              className={`px-4 py-2 rounded border ${
                gradingType === "first-second-final"
                  ? "bg-[#8E7DA5] text-white"
                  : ""
              }`}
              onClick={() => setGradingType("first-second-final")}
            >
              First / Second / Final
            </button>

            <button
              className={`px-4 py-2 rounded border ${
                gradingType === "mid-final"
                  ? "bg-[#8E7DA5] text-white"
                  : ""
              }`}
              onClick={() => setGradingType("mid-final")}
            >
              Midterm / Final
            </button>

            <button
              className={`px-4 py-2 rounded border ${
                gradingType === "af"
                  ? "bg-[#8E7DA5] text-white"
                  : ""
              }`}
              onClick={() => setGradingType("af")}
            >
              A–F Coursework
            </button>

          </div>

        </div>

        {/* Dynamic Structure */}
        <div className="grid grid-cols-2 gap-4 mb-6">

          {gradingType === "first-second-final" && (
            <>
              <input name="first" type="number"
                placeholder="First Exam %"
                className="border p-2 rounded"
                onChange={handleChange}/>

              <input name="second" type="number"
                placeholder="Second Exam %"
                className="border p-2 rounded"
                onChange={handleChange}/>

              <input name="final" type="number"
                placeholder="Final Exam %"
                className="border p-2 rounded"
                onChange={handleChange}/>
            </>
          )}

          {gradingType === "mid-final" && (
            <>
              <input name="midterm" type="number"
                placeholder="Midterm %"
                className="border p-2 rounded"
                onChange={handleChange}/>

              <input name="final" type="number"
                placeholder="Final %"
                className="border p-2 rounded"
                onChange={handleChange}/>
            </>
          )}

          <input
            name="coursework"
            type="number"
            placeholder="Quizzes / Assignments %"
            className="border p-2 rounded"
            onChange={handleChange}
          />

        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">
            {error}
          </p>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-4">

          <button
            onClick={() => navigate("/instructor")}
            className="px-5 py-2 border rounded-lg"
          >
            Cancel
          </button>

          <button
            onClick={handleCreate}
            className="px-5 py-2 bg-[#8E7DA5] text-white rounded-lg hover:bg-[#7B6A96]"
          >
            Create Course
          </button>

        </div>

      </div>

    </div>
  )
}

export default CreateCourse