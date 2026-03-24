import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"

function AIModes() {

  const { id } = useParams()

  const [course, setCourse] = useState(null)

  const [name, setName] = useState("")
  const [hintLimit, setHintLimit] = useState(3)
  const [cooldown, setCooldown] = useState(30)
  const [adaptiveHints, setAdaptiveHints] = useState(true)
  const [scope, setScope] = useState("")
  const [forbidden, setForbidden] = useState("")

  const [responseTypes, setResponseTypes] = useState({
    conceptual: false,
    pseudocode: false,
    partialCode: false,
    guidingQuestions: false,
    tracingExample: false,
    testCaseHints: false
  })


  useEffect(() => {

    const courses = JSON.parse(localStorage.getItem("courses")) || []
    const selectedCourse = courses[id]

    if (!selectedCourse.aiModes) {
      selectedCourse.aiModes = []
    }

    setCourse(selectedCourse)

  }, [id])


  if (!course) return <div className="p-10">Loading...</div>


  const toggleResponse = (key) => {

    setResponseTypes({
      ...responseTypes,
      [key]: !responseTypes[key]
    })

  }


  const createMode = () => {

    if (!name.trim()) {
      alert("Mode name required")
      return
    }

    const courses = JSON.parse(localStorage.getItem("courses")) || []

    const newMode = {
      name,
      hintLimit,
      cooldown,
      adaptiveHints,
      scope,
      forbidden,
      responseTypes
    }

    courses[id].aiModes.push(newMode)

    localStorage.setItem("courses", JSON.stringify(courses))

    setCourse(courses[id])

    setName("")
    setScope("")
    setForbidden("")

  }


  return (

    <div className="min-h-screen bg-[#F4F1F7] p-10">

      <h1 className="text-2xl font-semibold text-[#3e2764] mb-8">
        AI Learning Modes
      </h1>


      {/* CREATE MODE */}

      <div className="bg-white p-6 rounded-xl shadow mb-8 space-y-5">

        <h2 className="font-semibold">
          Create Custom Mode
        </h2>


        <input
          placeholder="Mode Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-3 rounded-lg w-full"
        />


        <div className="grid grid-cols-2 gap-4">

          <div>
            <label className="text-sm">Hint Limit</label>
            <input
              type="number"
              value={hintLimit}
              onChange={(e) => setHintLimit(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <div>
            <label className="text-sm">Hint Cooldown (seconds)</label>
            <input
              type="number"
              value={cooldown}
              onChange={(e) => setCooldown(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

        </div>


        {/* RESPONSE TYPES */}

        <div>

          <label className="font-medium mb-2 block">
            Response Types
          </label>

          <div className="grid grid-cols-2 gap-2">

            <label>
              <input
                type="checkbox"
                onChange={() => toggleResponse("conceptual")}
              /> Conceptual Explanation
            </label>

            <label>
              <input
                type="checkbox"
                onChange={() => toggleResponse("pseudocode")}
              /> Pseudocode
            </label>

            <label>
              <input
                type="checkbox"
                onChange={() => toggleResponse("partialCode")}
              /> Partial Code Fragment
            </label>

            <label>
              <input
                type="checkbox"
                onChange={() => toggleResponse("guidingQuestions")}
              /> Guiding Questions
            </label>

            <label>
              <input
                type="checkbox"
                onChange={() => toggleResponse("tracingExample")}
              /> Trace Failed Example
            </label>

            <label>
              <input
                type="checkbox"
                onChange={() => toggleResponse("testCaseHints")}
              /> Test Case Based Hints
            </label>

          </div>

        </div>


        {/* ADAPTIVE HINTS */}

        <div className="flex items-center gap-2">

          <input
            type="checkbox"
            checked={adaptiveHints}
            onChange={() => setAdaptiveHints(!adaptiveHints)}
          />

          <label>
            Adaptive Hints
          </label>

        </div>


        {/* SCOPE */}

        <textarea
          placeholder="Learning Objectives / Scope"
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="border p-3 rounded-lg w-full"
        />


        {/* FORBIDDEN APPROACHES */}

        <textarea
          placeholder="Forbidden Approaches"
          value={forbidden}
          onChange={(e) => setForbidden(e.target.value)}
          className="border p-3 rounded-lg w-full"
        />


        <button
          onClick={createMode}
          className="bg-[#8E7DA5] text-white px-5 py-2 rounded-lg"
        >
          Create Mode
        </button>

      </div>



      {/* EXISTING MODES */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="font-semibold mb-4">
          Existing Modes
        </h2>

        {course.aiModes.length === 0 ? (

          <p className="text-gray-500">
            No custom modes created yet.
          </p>

        ) : (

          <div className="space-y-4">

            {course.aiModes.map((mode, index) => (

              <div
                key={index}
                className="border rounded-lg p-4"
              >

                <h3 className="font-medium">
                  {mode.name}
                </h3>

                <p className="text-sm text-gray-500">
                  Hint Limit: {mode.hintLimit} | Cooldown: {mode.cooldown}s
                </p>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  )
}

export default AIModes