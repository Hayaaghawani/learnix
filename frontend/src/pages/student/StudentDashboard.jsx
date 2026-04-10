import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BookOpen } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const LANGUAGE_COLORS = {
  python: { border: "border-blue-400", badge: "bg-blue-100 text-blue-700" },
  c: { border: "border-yellow-400", badge: "bg-yellow-100 text-yellow-700" },
  "c++": { border: "border-orange-400", badge: "bg-orange-100 text-orange-700" },
  java: { border: "border-red-400", badge: "bg-red-100 text-red-700" },
  javascript: { border: "border-green-400", badge: "bg-green-100 text-green-700" },
  default: { border: "border-purple-400", badge: "bg-purple-100 text-purple-700" }
}

const getLanguageStyle = (lang) => {
  const key = (lang || "").toLowerCase()
  return LANGUAGE_COLORS[key] || LANGUAGE_COLORS.default
}

const getDeadlineColor = (dateStr) => {
  const today = new Date()
  const due = new Date(dateStr)
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
  if (diffDays <= 3) return "text-red-500"
  if (diffDays <= 7) return "text-orange-400"
  return "text-gray-400"
}

function StudentDashboard() {
  const navigate = useNavigate();
  const [joinInput, setJoinInput] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joinSuccess, setJoinSuccess] = useState("");
  const [joining, setJoining] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
  const [deadlinesLoading, setDeadlinesLoading] = useState(false)
  const [studentName, setStudentName] = useState("")
  const [initials, setInitials] = useState("ST")

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
    } catch {
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
      if (!token) { setError("Please log in."); setCourses([]); return }
      const response = await fetch(`${API_BASE_URL}/courses/my`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (!response.ok) { setError(data.detail || "Failed to load courses."); setCourses([]); return }
      const nextCourses = data.courses || []
      setCourses(nextCourses)
      fetchUpcomingDeadlines(nextCourses)
    } catch {
      setError("Failed to load courses. Please try again.")
      setCourses([])
      setUpcomingDeadlines([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUpcomingDeadlines = async (courseList) => {
    if (!Array.isArray(courseList) || courseList.length === 0) {
      setUpcomingDeadlines([])
      return
    }

    setDeadlinesLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setUpcomingDeadlines([])
        return
      }

      const responses = await Promise.all(
        courseList.map((course) =>
          fetch(`${API_BASE_URL}/exercises/course/${course.courseId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      )

      const payloads = await Promise.all(
        responses.map(async (resp) => {
          if (!resp.ok) return { exercises: [] }
          return resp.json()
        })
      )

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const deadlines = []
      payloads.forEach((payload, index) => {
        const course = courseList[index]
        ;(payload.exercises || []).forEach((exercise) => {
          if (!exercise.dueDate) return
          const due = new Date(exercise.dueDate)
          if (Number.isNaN(due.getTime())) return
          due.setHours(0, 0, 0, 0)
          if (due < today) return

          deadlines.push({
            id: exercise.exerciseId,
            title: exercise.title,
            date: exercise.dueDate,
            courseName: course.courseName,
          })
        })
      })

      deadlines.sort((a, b) => new Date(a.date) - new Date(b.date))
      setUpcomingDeadlines(deadlines.slice(0, 8))
    } catch {
      setUpcomingDeadlines([])
    } finally {
      setDeadlinesLoading(false)
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
      setUnreadCount((data.notifications || []).filter(n => !n.isRead).length)
    } catch {}
  }

  const fetchStudentName = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) return
      const data = await response.json()
      const first = data.user?.firstname || ""
      const last = data.user?.lastname || ""
      setStudentName(first)
      setInitials(
        `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "ST"
      )
    } catch {}
  }

  useEffect(() => {
    fetchCourses()
    fetchUnreadCount()
    fetchStudentName()
  }, [])

  return (
    <div className="min-h-screen bg-[#F4F1F7] px-10 py-10 relative overflow-hidden">

      {/* Background shapes — same as instructor */}
      <div className="absolute top-20 left-[-80px] w-72 h-72 bg-[#CBBED8] opacity-30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-[-80px] w-72 h-72 bg-[#B6A7CC] opacity-30 rounded-full blur-3xl"></div>

      {/* Dashboard Header — mirrors instructor exactly */}
      <div className="bg-gradient-to-r from-[#8E7DA5] to-[#B6A7CC] text-white rounded-xl shadow-lg p-8 mb-10 flex justify-between items-center relative z-10">

        <div>
          <h1 className="text-3xl font-semibold">
            Welcome back, {studentName || "Student"} 👋
          </h1>
          <p className="text-sm opacity-90 mt-1">
            You are enrolled in {courses.length} course{courses.length !== 1 ? "s" : ""}
            {unreadCount > 0 && ` · ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
          </p>
        </div>

        <div className="flex items-center gap-5">

          {/* Bell icon with unread badge */}
          <div
            onClick={() => navigate("/student/notifications")}
            className="relative bg-white/20 p-3 rounded-lg cursor-pointer hover:bg-white/30 transition"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>

          {/* Profile initials circle — same style as instructor AA */}
          <div
            onClick={() => navigate("/student/profile")}
            className="bg-white text-[#6E5C86] w-10 h-10 flex items-center justify-center rounded-full font-semibold cursor-pointer hover:scale-105 transition"
            title="Profile"
          >
            {initials}
          </div>

        </div>
      </div>

      {/* Join a Course */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 relative z-10">
        <h3 className="text-lg font-semibold mb-1">Join a Course</h3>
        <p className="text-sm text-gray-400 mb-4">Ask your instructor for the enrollment code</p>
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
            className="flex-1 border-2 border-gray-200 focus:border-[#6E5C86] outline-none rounded-lg px-4 py-2 transition"
          />
          <button
            onClick={handleJoin}
            disabled={joining || !joinInput.trim()}
            className="bg-[#6E5C86] text-white px-6 py-2 rounded-lg hover:bg-[#5a4a70] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {joining ? "Joining..." : "Join"}
          </button>
        </div>
        {joinError && <p className="mt-3 text-red-500 text-sm">{joinError}</p>}
        {joinSuccess && (
          <p className="mt-3 text-green-600 text-sm font-medium">✓ {joinSuccess}</p>
        )}
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 relative z-10">
        <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
        {deadlinesLoading ? (
          <p className="text-gray-400 text-sm">Loading deadlines...</p>
        ) : upcomingDeadlines.length === 0 ? (
          <p className="text-gray-400 text-sm">No upcoming deadlines.</p>
        ) : (
          upcomingDeadlines.map((item) => (
            <div key={item.id} className="flex justify-between items-center border-b py-3 last:border-none">
              <div className="flex items-center gap-3">
                <span className="text-lg">📅</span>
                <div>
                  <p className="text-gray-700">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.courseName}</p>
                </div>
              </div>
              <span className={`font-medium text-sm ${getDeadlineColor(item.date)}`}>
                {new Date(item.date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </span>
            </div>
          ))
        )}
      </div>

      {/* My Courses */}
      <h2 className="text-xl font-semibold text-[#3e2764] mb-4 flex items-center gap-2 relative z-10">
        <BookOpen size={20} />
        My Courses
        {courses.length > 0 && (
          <span className="text-sm font-normal text-gray-400">({courses.length})</span>
        )}
      </h2>

      <div className="grid grid-cols-3 gap-6 relative z-10">
        {loading ? (
          <div className="col-span-3 text-center text-gray-400 py-12">
            <div className="text-3xl mb-2">⏳</div>
            Loading your courses...
          </div>
        ) : error ? (
          <div className="col-span-3 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-3 bg-white rounded-xl shadow p-12 flex flex-col items-center text-center">
            <BookOpen size={48} className="text-gray-300 mb-4" />
            <h4 className="text-lg font-semibold text-gray-700 mb-2">No courses yet</h4>
            <p className="text-gray-400 text-sm mb-4">
              Paste your enrollment code above to join your first course
            </p>
            <button
              onClick={() => document.querySelector("input").focus()}
              className="bg-[#6E5C86] text-white px-5 py-2 rounded-lg text-sm hover:bg-[#5a4a70]"
            >
              Enter enrollment code
            </button>
          </div>
        ) : (
          courses.map((course) => {
            const style = getLanguageStyle(course.languageUsed)
            return (
              <div
                key={course.courseId}
                onClick={() => navigate(`/student/course/${course.courseId}`)}
                className={`bg-white p-6 rounded-xl shadow hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition duration-300 cursor-pointer border-t-4 ${style.border}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-semibold text-gray-800">{course.courseName}</h4>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.badge}`}>
                    {course.languageUsed || "General"}
                  </span>
                </div>

                <p className="text-gray-500 text-sm mt-2">
                  {course.description || "No description available."}
                </p>

                <div className="flex justify-between text-sm text-gray-500 mt-4">
                  <span>🖥️ {course.languageUsed || "—"}</span>
                  <span>📅 {course.startDate ? new Date(course.startDate).toLocaleDateString() : "TBD"}</span>
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}

export default StudentDashboard;