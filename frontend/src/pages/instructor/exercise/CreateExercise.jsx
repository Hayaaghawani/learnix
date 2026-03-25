import { useParams, useNavigate } from "react-router-dom"
import { useState } from "react"
import { Plus, Trash2, Send } from "lucide-react"

function CreateExercise() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("training")
  const [solution, setSolution] = useState("")
  const [aiMode, setAiMode] = useState("default")

  const [testCases, setTestCases] = useState([
    { input: "", output: "" },
    { input: "", output: "" }
  ])

  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I can help you design this exercise. Ask me for test cases, hints, or a solution." }
  ])

  const [chatInput, setChatInput] = useState("")



  /* ---------------- TEST CASE HANDLING ---------------- */

  const updateTestCase = (index, field, value) => {
    const updated = [...testCases]
    updated[index][field] = value
    setTestCases(updated)
  }

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", output: "" }])
  }

  const removeTestCase = (index) => {

    if (testCases.length <= 2) {
      alert("Minimum 2 test cases required")
      return
    }

    const updated = testCases.filter((_, i) => i !== index)
    setTestCases(updated)
  }



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

  const saveExercise = () => {

    if (!title.trim()) {
      alert("Exercise title required")
      return
    }

    if (testCases.length < 2) {
      alert("At least 2 test cases required")
      return
    }

    const courses = JSON.parse(localStorage.getItem("courses")) || []

    if (!courses[id]) {
      alert("Course not found")
      return
    }

    if (!courses[id].exercises) {
      courses[id].exercises = []
    }

    const newExercise = {
      title,
      description,
      type,
      solution,
      aiMode,
      testCases
    }

    courses[id].exercises.push(newExercise)

    localStorage.setItem("courses", JSON.stringify(courses))

    // reset form
    setTitle("")
    setDescription("")
    setSolution("")
    setTestCases([
      { input: "", output: "" },
      { input: "", output: "" }
    ])

    navigate(`/instructor/course/${id}/exercises`)
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
            <option value="training">Training</option>
            <option value="assignment">Assignment</option>
            <option value="midterm">Midterm Prep</option>
          </select>
        </div>


        {/* Canonical Solution */}

        <div>
          <label className="font-medium block mb-2">Canonical Solution</label>

          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            className="w-full border p-3 rounded-lg"
          />
        </div>


        {/* AI Mode */}

        <div>
          <label className="font-medium block mb-2">AI Mode</label>

          <select
            value={aiMode}
            onChange={(e) => setAiMode(e.target.value)}
            className="border p-3 rounded-lg w-full"
          >
            <option value="default">Default Mode</option>
            <option value="custom">Custom Mode</option>
          </select>
        </div>


        {/* Test Cases */}

        <div>

          <label className="font-medium block mb-3">Test Cases</label>

          {testCases.map((test, index) => (

            <div key={index} className="flex gap-4 mb-3">

              <input
                placeholder="Input"
                value={test.input}
                onChange={(e) =>
                  updateTestCase(index, "input", e.target.value)
                }
                className="border p-2 rounded w-full"
              />

              <input
                placeholder="Output"
                value={test.output}
                onChange={(e) =>
                  updateTestCase(index, "output", e.target.value)
                }
                className="border p-2 rounded w-full"
              />

              <Trash2
                className="text-red-500 cursor-pointer"
                onClick={() => removeTestCase(index)}
              />

            </div>

          ))}

          <button
            onClick={addTestCase}
            className="flex items-center gap-2 text-[#6E5C86]"
          >
            <Plus size={16}/>
            Add Test Case
          </button>

        </div>


        {/* Save Button */}

        <button
          onClick={saveExercise}
          className="bg-[#8E7DA5] text-white px-6 py-3 rounded-lg"
        >
          Save Exercise
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