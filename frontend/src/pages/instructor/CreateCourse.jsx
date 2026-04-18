import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function CreateCourse() {
  const navigate = useNavigate()

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) { navigate("/"); return }
    try {
      const parsedUser = JSON.parse(storedUser)
      if (parsedUser.role !== "instructor") {
        alert("Only instructors can create courses.")
        navigate("/")
      }
    } catch (e) {
      navigate("/")
    }
  }, [navigate])

  const [gradingType, setGradingType] = useState("first-second-final")

  const [course, setCourse] = useState({
    name: "",
    code: "",
    languageUsed: "",
    startDate: "",
    endDate: "",
    description: "",
    first: 0,
    second: 0,
    midterm: 0,
    final: 0,
    coursework: 0
  })

  const [error, setError] = useState("")
  const [allConcepts, setAllConcepts] = useState([])
  const [selectedConceptIds, setSelectedConceptIds] = useState(() => new Set())
  const [conceptsLoading, setConceptsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setConceptsLoading(false)
      return
    }
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/exercises/ai-catalog`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("catalog")
        const data = await res.json()
        setAllConcepts(data.concepts || [])
      } catch {
        setAllConcepts([])
      } finally {
        setConceptsLoading(false)
      }
    })()
  }, [])

  const toggleConcept = (id) => {
    setSelectedConceptIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleChange = (e) => {
    setCourse({ ...course, [e.target.name]: e.target.value })
  }

  const validateWeights = () => {
    let total = 0
    if (gradingType === "first-second-final") {
      total = Number(course.first) + Number(course.second) + Number(course.final) + Number(course.coursework)
    }
    if (gradingType === "mid-final") {
      total = Number(course.midterm) + Number(course.final) + Number(course.coursework)
    }
    if (gradingType === "af") {
      total = Number(course.coursework)
    }
    return total === 100
  }

  const handleCreate = async () => {
    if (!course.name || !course.code || !course.languageUsed || !course.startDate || !course.endDate) {
      setError("Please fill all required fields")
      return
    }

    if (!validateWeights()) {
      setError("Assessment weights must equal 100%")
      return
    }

    const token = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")
    let parsedUser = null

    if (storedUser) {
      try { parsedUser = JSON.parse(storedUser) } catch (e) {}
    }

    if (!token) { setError("You must be logged in to create a course"); return }
    if (!parsedUser || parsedUser.role !== "instructor") {
      setError("Only instructors can create courses.")
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
          endDate: course.endDate,
          conceptIds: Array.from(selectedConceptIds),
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.detail || "Failed to create course")
        return
      }

      navigate("/instructor")
    } catch (err) {
      setError("Failed to create course. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F1F7] py-10 px-10">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow">

        <h1 className="text-2xl font-semibold text-[#3e2764] mb-8">Create Course</h1>

        {/* Basic Information */}
        <div className="mb-8">
          <h2 className="font-semibold mb-4 text-lg">Basic Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <input required name="name" placeholder="Course Name"
              className="border p-2 rounded" onChange={handleChange} />
            <input required name="code" placeholder="Course Code"
              className="border p-2 rounded" onChange={handleChange} />
            <input required name="languageUsed" placeholder="Course Language"
              className="border p-2 rounded" onChange={handleChange} />
          </div>

          <input name="startDate" type="date"
            className="border p-2 rounded w-full mt-4" onChange={handleChange} />
          <input name="endDate" type="date"
            className="border p-2 rounded w-full mt-4" onChange={handleChange} />
          <textarea name="description" placeholder="Course Description (optional)"
            className="border p-2 rounded w-full mt-4 h-24" onChange={handleChange} />
        </div>

        <div className="mb-8">
          <h2 className="font-semibold mb-2 text-lg">Course concepts (CS1 focus)</h2>
          <p className="text-sm text-gray-500 mb-3">
            Select the topics this course covers. These drive which concepts can be targeted in AI exercise modes.
          </p>
          {conceptsLoading ? (
            <p className="text-sm text-gray-400">Loading concepts…</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {allConcepts.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedConceptIds.has(c.id)}
                    onChange={() => toggleConcept(c.id)}
                    className="rounded accent-[#6E5C86]"
                  />
                  <span className="font-mono text-xs">{c.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Grading Structure */}
        <div className="mb-8">
          <h2 className="font-semibold mb-4 text-lg">Grading Structure</h2>
          <div className="flex gap-4">
            <button
              className={`px-4 py-2 rounded border ${gradingType === "first-second-final" ? "bg-[#8E7DA5] text-white" : ""}`}
              onClick={() => setGradingType("first-second-final")}
            >First / Second / Final</button>
            <button
              className={`px-4 py-2 rounded border ${gradingType === "mid-final" ? "bg-[#8E7DA5] text-white" : ""}`}
              onClick={() => setGradingType("mid-final")}
            >Midterm / Final</button>
            <button
              className={`px-4 py-2 rounded border ${gradingType === "af" ? "bg-[#8E7DA5] text-white" : ""}`}
              onClick={() => setGradingType("af")}
            >A–F Coursework</button>
          </div>
        </div>

        {/* Dynamic Grading Inputs */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {gradingType === "first-second-final" && (
            <>
              <input name="first" type="number" placeholder="First Exam %"
                className="border p-2 rounded" onChange={handleChange} />
              <input name="second" type="number" placeholder="Second Exam %"
                className="border p-2 rounded" onChange={handleChange} />
              <input name="final" type="number" placeholder="Final Exam %"
                className="border p-2 rounded" onChange={handleChange} />
            </>
          )}
          {gradingType === "mid-final" && (
            <>
              <input name="midterm" type="number" placeholder="Midterm %"
                className="border p-2 rounded" onChange={handleChange} />
              <input name="final" type="number" placeholder="Final %"
                className="border p-2 rounded" onChange={handleChange} />
            </>
          )}
          <input name="coursework" type="number" placeholder="Quizzes / Assignments %"
            className="border p-2 rounded" onChange={handleChange} />
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex justify-end gap-4">
          <button onClick={() => navigate("/instructor")} className="px-5 py-2 border rounded-lg">
            Cancel
          </button>
          <button onClick={handleCreate} className="px-5 py-2 bg-[#8E7DA5] text-white rounded-lg hover:bg-[#7B6A96]">
            Create Course
          </button>
        </div>

      </div>
    </div>
  )
}

export default CreateCourse