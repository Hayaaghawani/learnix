import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Trash2, Loader2, AlertCircle, Bell } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function StudentNotifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found")
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}/notifications/my`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`)
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setError("Failed to load notifications. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const deleteNotification = async (notificationId) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        alert("No authentication token found")
        return
      }

      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(errorData.detail || "Failed to delete notification")
        return
      }

      // Remove notification from UI
      setNotifications(
        notifications.filter((notif) => notif.notificationId !== notificationId)
      )
    } catch (error) {
      console.error("Error deleting notification:", error)
      alert("Failed to delete notification. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F1F7] px-6 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8E7DA5] to-[#B6A7CC] text-white rounded-xl shadow-lg p-8 mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Bell size={28} />
          <h1 className="text-3xl font-semibold">Messages</h1>
        </div>
        <p className="text-sm opacity-90">
          {notifications.length} message{notifications.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-[#8E7DA5]" size={32} />
            <span className="ml-2 text-gray-600">Loading messages...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-300 text-red-700 px-6 py-4 rounded-lg">
            <p>{error}</p>
            <button
              onClick={fetchNotifications}
              className="mt-2 underline hover:no-underline font-medium"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center bg-white p-16 rounded-xl shadow-md">
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg font-medium">No messages yet</p>
            <p className="text-gray-400 mt-2">
              Instructors will send you messages here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.notificationId}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition border-l-4 border-[#8E7DA5] p-6"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {/* Sender Info */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-block w-8 h-8 rounded-full bg-[#8E7DA5] text-white text-xs font-bold flex items-center justify-center">
                        {notification.senderFirstName.charAt(0)}
                        {notification.senderLastName.charAt(0)}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {notification.senderFirstName} {notification.senderLastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {notification.senderEmail}
                        </p>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-800 mt-3 mb-2">
                      {notification.title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-700 leading-relaxed mb-3">
                      {notification.message}
                    </p>

                    {/* Date */}
                    <p className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteNotification(notification.notificationId)}
                    className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition flex-shrink-0"
                    title="Delete message"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudentNotifications
