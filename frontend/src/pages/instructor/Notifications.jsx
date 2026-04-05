import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Trash2, Loader2, AlertCircle } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function Notifications() {
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

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        alert("No authentication token found")
        return
      }

      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to mark notification as read")
      }

      // Update the notification in UI
      setNotifications(
        notifications.map((notif) =>
          notif.notificationId === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
      alert("Failed to mark notification as read")
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
      alert("Notification deleted successfully")
    } catch (error) {
      console.error("Error deleting notification:", error)
      alert("Failed to delete notification. Please try again.")
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="min-h-screen bg-[#F4F1F7] px-10 py-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8E7DA5] to-[#B6A7CC] text-white rounded-xl shadow-lg p-8 mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold">Notifications</h1>
          <p className="text-sm opacity-90 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => navigate("/instructor")}
          className="bg-white text-[#6E5C86] px-5 py-3 rounded-lg font-medium shadow hover:scale-105 transition"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-[#8E7DA5]" size={32} />
            <span className="ml-2 text-gray-600">Loading notifications...</span>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={fetchNotifications}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-xl shadow">
            <AlertCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.notificationId}
                className={`p-6 rounded-xl shadow transition ${
                  notification.isRead
                    ? "bg-white border border-gray-200"
                    : "bg-blue-50 border-2 border-blue-200"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification.notificationId)}
                        className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.notificationId)}
                      className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                      title="Delete notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
