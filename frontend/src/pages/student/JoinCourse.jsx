import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function JoinCourse() {
  const { joinKey } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const enroll = async () => {
      const token = localStorage.getItem("token")

      if (!token) {
        setStatus("error")
        setMessage("You must be logged in to join a course.")
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/courses/join`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ joinKey })
        })

        const data = await response.json()

        if (!response.ok) {
          setStatus("error")
          setMessage(data.detail || data.message || "Unable to join this course.")
          return
        }

        setStatus("success")
        setMessage(data.message || "You have been enrolled in the course.")
      } catch (error) {
        console.error("Error enrolling in course:", error)
        setStatus("error")
        setMessage("Unable to join the course. Please try again later.")
      }
    }

if (joinKey) {
      	enroll()
    } else {
      setStatus("error")
      setMessage("Invalid enrollment link.")
    }
  }, [joinKey])

  return (
    <div className="min-h-screen bg-[#F4F1F7] px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-[#3e2764]">Join Course</h1>
          <p className="text-gray-500 mt-2">Using enrollment link: {joinKey}</p>
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="animate-spin text-[#8E7DA5]" size={36} />
            <p className="text-gray-600">Joining course, please wait...</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center py-12">
            <CheckCircle2 size={48} className="mx-auto text-[#8E7DA5]" />
            <p className="text-xl font-semibold text-[#3e2764] mt-6">Enrollment successful!</p>
            <p className="text-gray-600 mt-3">{message}</p>
            <button
              onClick={() => navigate("/student")}
              className="mt-8 bg-[#8E7DA5] text-white px-6 py-3 rounded-xl hover:bg-[#7b6a99] transition"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-red-500" />
            <p className="text-xl font-semibold text-[#3e2764] mt-6">Enrollment failed</p>
            <p className="text-gray-600 mt-3">{message}</p>
            <button
              onClick={() => navigate("/student")}
              className="mt-8 bg-[#8E7DA5] text-white px-6 py-3 rounded-xl hover:bg-[#7b6a99] transition"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default JoinCourse
