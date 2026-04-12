import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { User, Mail, BookOpen, Calendar, Code, Lock, Eye, EyeOff } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const ROLE_COLORS = {
  instructor: { bg: "bg-purple-100", text: "text-purple-700" },
  student: { bg: "bg-blue-100", text: "text-blue-700" },
  admin: { bg: "bg-red-100", text: "text-red-700" },
}

function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) { navigate("/"); return }
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) { setError("Failed to load profile."); return }
      const data = await response.json()
      setUser(data.user)
    } catch {
      setError("Failed to load profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError("")
    setPasswordSuccess("")
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill all password fields.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.")
      return
    }
    setChangingPassword(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      if (!response.ok) {
        const err = await response.json()
        setPasswordError(err.detail || "Failed to change password.")
        return
      }
      setPasswordSuccess("Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowPasswordSection(false)
    } catch {
      setPasswordError("Something went wrong. Please try again.")
    } finally {
      setChangingPassword(false)
    }
  }

  const getInitials = () => {
    if (!user) return "?"
    return `${user.firstname?.charAt(0) || ""}${user.lastname?.charAt(0) || ""}`.toUpperCase()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "Unknown"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F1F7] flex items-center justify-center">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F4F1F7] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  const roleStyle = ROLE_COLORS[user?.role] || ROLE_COLORS.student

  return (
    <div className="min-h-screen bg-[#F4F1F7] py-10 px-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-[#8E7DA5] to-[#B6A7CC] rounded-2xl p-8 text-white flex items-center gap-6 shadow-lg">
          <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold shrink-0">
            {getInitials()}
          </div>
          <div>
            <h1 className="text-3xl font-semibold mb-1">
              {user?.firstname} {user?.lastname}
            </h1>
            <p className="text-purple-200 text-sm mb-3">{user?.email}</p>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${roleStyle.bg} ${roleStyle.text} capitalize`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <BookOpen size={24} className="mx-auto text-[#8E7DA5] mb-2" />
            <p className="text-2xl font-semibold text-[#3e2764]">{user?.courseCount ?? 0}</p>
            <p className="text-sm text-gray-400 mt-1">
              {user?.role === "instructor" ? "Courses Created" : "Courses Enrolled"}
            </p>
          </div>

          {user?.role === "student" && (
            <div className="bg-white rounded-xl shadow p-5 text-center">
              <Code size={24} className="mx-auto text-[#8E7DA5] mb-2" />
              <p className="text-2xl font-semibold text-[#3e2764]">{user?.exerciseCount ?? 0}</p>
              <p className="text-sm text-gray-400 mt-1">Exercises Attempted</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-5 text-center">
            <Calendar size={24} className="mx-auto text-[#8E7DA5] mb-2" />
            <p className="text-sm font-semibold text-[#3e2764]">{formatDate(user?.joinDate)}</p>
            <p className="text-sm text-gray-400 mt-1">Member Since</p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="font-semibold text-[#3e2764] text-lg mb-2">Account Information</h2>

          <div className="flex items-center gap-4 py-3 border-b border-gray-100">
            <User size={18} className="text-[#8E7DA5] shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Full Name</p>
              <p className="font-medium text-gray-800">{user?.firstname} {user?.lastname}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-3 border-b border-gray-100">
            <Mail size={18} className="text-[#8E7DA5] shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Email Address</p>
              <p className="font-medium text-gray-800">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-3 border-b border-gray-100">
            <BookOpen size={18} className="text-[#8E7DA5] shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Role</p>
              <p className="font-medium text-gray-800 capitalize">{user?.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-3">
            <Calendar size={18} className="text-[#8E7DA5] shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Joined</p>
              <p className="font-medium text-gray-800">{formatDate(user?.joinDate)}</p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-xl shadow p-6">
          <button
            onClick={() => {
              setShowPasswordSection(!showPasswordSection)
              setPasswordError("")
              setPasswordSuccess("")
            }}
            className="flex items-center gap-3 w-full text-left"
          >
            <Lock size={18} className="text-[#8E7DA5]" />
            <span className="font-semibold text-[#3e2764]">Change Password</span>
            <span className="ml-auto text-gray-400 text-sm">
              {showPasswordSection ? "▲" : "▼"}
            </span>
          </button>

          {showPasswordSection && (
            <div className="mt-5 space-y-4">
              <div className="relative">
                <label className="text-xs text-gray-400 block mb-1">Current Password</label>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="flex-1 p-3 outline-none text-sm"
                    placeholder="Enter current password"
                  />
                  <button onClick={() => setShowCurrent(!showCurrent)} className="px-3 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">New Password</label>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 p-3 outline-none text-sm"
                    placeholder="Enter new password"
                  />
                  <button onClick={() => setShowNew(!showNew)} className="px-3 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border p-3 rounded-lg text-sm outline-none"
                  placeholder="Confirm new password"
                />
              </div>

              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
              {passwordSuccess && <p className="text-green-600 text-sm font-medium">{passwordSuccess}</p>}

              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="w-full bg-[#8E7DA5] text-white py-2.5 rounded-lg hover:bg-[#7B6A96] disabled:opacity-50 text-sm font-medium"
              >
                {changingPassword ? "Changing..." : "Update Password"}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[#6E5C86] hover:text-[#3e2764] font-medium"
        >
          ← Go Back
        </button>

      </div>
    </div>
  )
}

export default ProfilePage