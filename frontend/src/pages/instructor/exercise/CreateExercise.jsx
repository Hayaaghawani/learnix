import { useParams, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Plus, Trash2, Send, Loader2 } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function CreateExercise() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("beginner")
  const [difficulty, setDifficulty] = useState("Easy")
  const [solution, setSolution] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [testCases, setTestCases] = useState([
    { input: "", output: "" },
    { input: "", output: "" }
  ])

  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I can help you design this exercise. Ask me for test cases, hints, or a solution." }
  ])

  const [chatInput, setChatInput] = useState("")



  /* ---------------- AI CHAT SIMULATION ---------------- */

  const sendMessage = () => {

    if (!chatInput.trim()) return

    const userMessage = { role: "user", text: chatInput }

    let aiResponse = "I suggest creating edge cases and simple cases."

    if (chatInput.toLowerCase().includes("test case")) {
      aiResponse = "Example test cases:\n1) Input: 1 2 3 → Output: 6\n2) Input: 5 5 → Output: 10"
    }

    if (chatInput.toLowerCase().includes("description")) {
      aiResponse = "This exercise asks students to compute the sum of integers in a list using loops."
    }

    if (chatInput.toLowerCase().includes("solution")) {
      aiResponse = "Python example:\n\nsum = 0\nfor x in arr:\n  sum += x"
    }

    const aiMessage = { role: "ai", text: aiResponse }

    setMessages([...messages, userMessage, aiMessage])
    setChatInput("")
  }



  /* ---------------- SAVE EXERCISE ---------------- */

  const saveExercise = async () => {
    if (!title.trim()) {
      setError("Exercise title is required")
      return
    }

    if (!description.trim()) {
      setError("Exercise description is required")
      return
    }

    if (!dueDate) {
      setError("Due date is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found")
        setLoading(false)
        return
      }

      // Use a default typeId for now (Beginner type from database dump)
      const typeId = "7f39d2ca-4339-4e43-9cf1-f91f7df65bfe"

      const response = await fetch(`${API_BASE_URL}/exercises/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId: id,
          typeId: typeId,
          title: title.trim(),
          difficultyLevel: difficulty,
          exerciseType: type,
          keyConcept: description.trim(),
          problem: description.trim(),
          referenceSolution: solution.trim() || null,
          dueDate: dueDate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Failed to create exercise: ${response.status}`)
      }

      const data = await response.json()

      // Reset form
      setTitle("")
      setDescription("")
      setSolution("")
      setDueDate("")
      setTestCases([
        { input: "", output: "" },
        { input: "", output: "" }
      ])

      // Navigate back to exercises list
      navigate(`/instructor/course/${id}/exercises`)

    } catch (error) {
      console.error("Error creating exercise:", error)
      setError(error.message || "Failed to create exercise. Please try again.")
    } finally {
      setLoading(false)
    }
  }



  return (

    <div className="min-h-screen bg-[#F4F1F7] p-10 grid grid-cols-3 gap-8">

      {/* LEFT SIDE FORM */}

      <div className="col-span-2 bg-white p-8 rounded-xl shadow space-y-6">

        <h1 className="text-2xl font-semibold text-[#3e2764]">
          Create Exercise
        </h1>


        {/* Title */}

        <div>
          <label className="font-medium block mb-2">Title</label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />
        </div>


        {/* Description */}

        <div>
          <label className="font-medium block mb-2">Description</label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />
        </div>


        {/* Exercise Type */}

        <div>
          <label className="font-medium block mb-2">Exercise Type</label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border p-3 rounded-lg w-full"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="senior">Senior</option>
            <option value="professional">Professional</option>
          </select>
        </div>

        {/* Difficulty Level */}

        <div>
          <label className="font-medium block mb-2">Difficulty Level</label>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="border p-3 rounded-lg w-full"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* Due Date */}

        <div>
          <label className="font-medium block mb-2">Due Date</label>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="border p-3 rounded-lg w-full"
          />
        </div>

        {/* Canonical Solution */}

        <div>
          <label className="font-medium block mb-2">Canonical Solution (Optional)</label>

          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            className="w-full border p-3 rounded-lg"
            rows={4}
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Save Button */}

        <button
          onClick={saveExercise}
          disabled={loading}
          className="w-full bg-[#8E7DA5] text-white py-3 rounded-lg hover:bg-[#7B6A96] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Creating Exercise...
            </>
          ) : (
            <>
              <Plus size={18} />
              Create Exercise
            </>
          )}
        </button>

      </div>



      {/* RIGHT SIDE AI CHAT */}

      <div className="bg-white rounded-xl shadow p-6 flex flex-col">

        <h2 className="font-semibold mb-4 text-[#3e2764]">
          AI Exercise Assistant
        </h2>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">

          {messages.map((msg, i) => (

            <div
              key={i}
              className={`p-3 rounded-lg text-sm ${
                msg.role === "user"
                  ? "bg-purple-100 text-right"
                  : "bg-gray-100"
              }`}
            >
              {msg.text}
            </div>

          ))}

        </div>


        <div className="flex gap-2">

          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Ask the AI..."
          />

          <button
            onClick={sendMessage}
            className="bg-[#8E7DA5] text-white p-2 rounded"
          >
            <Send size={16}/>
          </button>

        </div>

      </div>

    </div>
  )
}

export default CreateExercise