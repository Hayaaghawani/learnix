import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Trash2, Loader2, AlertCircle, Send } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Send notification state
  const [studentEmail, setStudentEmail] = useState("")
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [sendLoading, setSendLoading] = useState(false)
  const [sendError, setSendError] = useState("")
  const [sendSuccess, setSendSuccess] = useState("")

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

  const handleSendNotification = async (e) => {
    e.preventDefault()
    setSendError("")
    setSendSuccess("")
    setSendLoading(true)

    if (!studentEmail || !notificationTitle || !notificationMessage) {
      setSendError("Please fill in all fields")
      setSendLoading(false)
      return
    }

    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setSendError("No authentication token found")
        setSendLoading(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}/notifications/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientEmail: studentEmail,
          title: notificationTitle,
          message: notificationMessage
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setSendError(errorData.detail || "Failed to send notification")
        setSendLoading(false)
        return
      }

      setSendSuccess("Message sent successfully!")
      setStudentEmail("")
      setNotificationTitle("")
      setNotificationMessage("")

      // Clear success message after 3 seconds
      setTimeout(() => setSendSuccess(""), 3000)
    } catch (error) {
      console.error("Error sending notification:", error)
      setSendError("Failed to send message. Please try again.")
    } finally {
      setSendLoading(false)
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

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Send Notification Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 border-t-4 border-[#8E7DA5]">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Send Message to Student</h2>

          {sendSuccess && (
            <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-4">
              {sendSuccess}
            </div>
          )}

          {sendError && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4">
              {sendError}
            </div>
          )}

          <form onSubmit={handleSendNotification} className="space-y-4">
            {/* Student Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Email
              </label>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E7DA5] focus:border-transparent"
                required
              />
            </div>

            {/* Notification Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Title
              </label>
              <input
                type="text"
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder="Enter message title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E7DA5] focus:border-transparent"
                required
              />
            </div>

            {/* Notification Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Content
              </label>
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter your message here..."
                rows="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E7DA5] focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setStudentEmail("")
                  setNotificationTitle("")
                  setNotificationMessage("")
                  setSendError("")
                  setSendSuccess("")
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={sendLoading}
                className="px-6 py-2 bg-gradient-to-r from-[#8E7DA5] to-[#B6A7CC] text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sendLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Received Notifications */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Received Messages</h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-[#8E7DA5]" size={32} />
              <span className="ml-2 text-gray-600">Loading messages...</span>
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
              <p className="text-gray-500 text-lg">No messages yet</p>
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
                        {notification.title}
                      </p>
                      <p className="text-gray-700 mb-2">
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
    </div>
  )
}

export default Notifications
