import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function StudentDashboard () {
  const navigate = useNavigate();
  const [joinInput, setJoinInput] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");
  const [joining, setJoining] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const parseJoinKey = (value) => {
    const trimmed = value.trim()
    if (!trimmed) return ""
    try {
      const url = new URL(trimmed)
      const segments = url.pathname.split("/").filter(Boolean)
      return segments.length ? segments[segments.length - 1] : trimmed
    } catch {
      return trimmed
    }
  }

  const handleJoin = async () => {
    const key = parseJoinKey(joinInput)
    if (!key) return

    setJoinError("")
    setJoinSuccess("")
    setJoining(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/courses/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ joinKey: key })
      })

      const data = await response.json()

      if (!response.ok) {
        setJoinError(data.detail || "Invalid join code. Please try again.")
        return
      }

      setJoinSuccess(data.message || "Successfully joined the course!")
      setJoinInput("")
      fetchCourses()

    } catch (err) {
      setJoinError("Something went wrong. Please try again.")
    } finally {
      setJoining(false)
    }
  }

  const fetchCourses = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Please log in to view your courses.")
        setCourses([])
        return
      }
      const response = await fetch(`${API_BASE_URL}/courses/my`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.detail || "Failed to load joined courses.")
        setCourses([])
        return
      }
      setCourses(data.courses || [])
    } catch (fetchError) {
      setError("Failed to load joined courses. Please try again.")
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      const response = await fetch(`${API_BASE_URL}/notifications/my`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) return
      const data = await response.json()
      const unread = (data.notifications || []).filter(n => !n.isRead).length
      setUnreadCount(unread)
    } catch {
      // silently fail — don't block dashboard if notifications fail
    }
  }

  useEffect(() => {
    fetchCourses()
    fetchUnreadCount()
  }, [])

  const deadlines = [
    { id: 1, title: "Database Assignment 2", date: "March 18" },
    { id: 2, title: "OS Quiz", date: "March 20" }
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <div className="w-full bg-[#6E5C86] text-white px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl italic text-purple-50 font-semibold">Student Dashboard</h1>
        <div className="flex gap-6 items-center">

          {/* Notifications button with unread badge */}
          <button
            onClick={() => navigate("/student/notifications")}
            className="relative hover:text-gray-200 transition"
          >
            Notifications
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          <button className="hover:text-gray-200">Profile</button>
          <button className="hover:text-gray-200">Logout</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        <h2 className="text-2xl font-semibold mb-6">Welcome back 👋</h2>

        {/* Quick Join Course */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Join a Course</h3>
          <div className="flex gap-4">
            <input
              type="text"
              value={joinInput}
              onChange={(e) => {
                setJoinInput(e.target.value)
                setJoinError("")
                setJoinSuccess("")
              }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="Paste enrollment code..."
              className="flex-1 border rounded-lg px-4 py-2"
            />
            <button
              onClick={handleJoin}
              disabled={joining || !joinInput.trim()}
              className="bg-[#6E5C86] text-white px-5 py-2 rounded-lg hover:bg-[#5a4a70] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? "Joining..." : "Join"}
            </button>
          </div>
          {joinError && <p className="mt-3 text-red-600 text-sm">{joinError}</p>}
          {joinSuccess && <p className="mt-3 text-green-600 text-sm font-medium">{joinSuccess}</p>}
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
          {deadlines.map((item) => (
            <div key={item.id} className="flex justify-between border-b py-2 last:border-none">
              <span>{item.title}</span>
              <span className="text-red-500 font-medium">{item.date}</span>
            </div>
          ))}
        </div>

        {/* My Courses */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">My Courses</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 bg-white rounded-xl shadow-md p-6 text-gray-600">
                Loading joined courses...
              </div>
            ) : error ? (
              <div className="col-span-2 bg-white rounded-xl shadow-md p-6 text-red-600">
                {error}
              </div>
            ) : courses.length === 0 ? (
              <div className="col-span-2 bg-white rounded-xl shadow-md p-6 text-gray-600">
                No joined courses yet.
              </div>
            ) : (
              courses.map((course) => (
                <div key={course.courseId} className="bg-white rounded-xl shadow-md p-6">
                  <h4 className="text-lg font-semibold">{course.courseName}</h4>
                  <p className="text-gray-600 mb-4">{course.description || "No description available."}</p>
                  <div className="mb-2 text-sm text-gray-600">Language</div>
                  <p className="font-medium mb-4">{course.languageUsed || "Unknown"}</p>
                  <div className="mb-2 text-sm text-gray-600">Start Date</div>
                  <p className="mb-4">{course.startDate ? new Date(course.startDate).toLocaleDateString() : "TBD"}</p>
                  <button
                    onClick={() => navigate(`/student/course/${course.courseId}`)}
                    className="bg-[#6E5C86] text-white px-4 py-2 rounded-lg"
                  >
                    Open Course
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default StudentDashboard;