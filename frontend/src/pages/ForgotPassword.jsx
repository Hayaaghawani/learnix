import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, Eye, EyeOff, CheckCircle } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function ForgotPassword() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1 = enter email, 2 = set new password, 3 = success
  const [email, setEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCheckEmail = async () => {
    setError("")
    if (!email.trim()) { setError("Please enter your email."); return }

    setLoading(true)
    try {
      // Verify the email exists by attempting a dummy check
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), newPassword: "CHECK_ONLY_DO_NOT_RESET" })
      })
      // If 404, email not found. Otherwise proceed to step 2
      if (response.status === 404) {
        setError("No account found with this email.")
        return
      }
      setStep(2)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setError("")
    if (!newPassword) { setError("Please enter a new password."); return }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return }

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), newPassword })
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.detail || "Failed to reset password.")
        return
      }

      setStep(3)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#D6CEDC] px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">

        {/* Header */}
        <h1 className="text-4xl text-center font-luxury tracking-wide mb-2">
          <span className="text-5xl italic">L</span>earnix
        </h1>
        <div className="w-16 h-[2px] bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto mt-2 mb-6 rounded-full"></div>

        {/* Step 1 — Enter Email */}
        {step === 1 && (
          <>
            <h2 className="text-xl font-semibold text-center text-[#3e2764] mb-2">Reset Password</h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              Enter your account email to get started
            </p>

            <div className="relative mb-4">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError("") }}
                onKeyDown={(e) => e.key === "Enter" && handleCheckEmail()}
                className="w-full pl-10 pr-4 py-3 border border-[#E0D8E6] rounded-lg outline-none focus:border-[#8E7DA5] transition"
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
              onClick={handleCheckEmail}
              disabled={loading}
              className="w-full bg-[#8E7DA5] text-white py-3 rounded-lg hover:bg-[#7B6A96] transition font-medium disabled:opacity-50"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </>
        )}

        {/* Step 2 — Set New Password */}
        {step === 2 && (
          <>
            <h2 className="text-xl font-semibold text-center text-[#3e2764] mb-2">New Password</h2>
            <p className="text-gray-500 text-sm text-center mb-6">
              Setting new password for <span className="font-medium text-[#6E5C86]">{email}</span>
            </p>

            {/* New Password */}
            <div className="relative mb-4">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type={showNew ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError("") }}
                className="w-full pl-10 pr-10 py-3 border border-[#E0D8E6] rounded-lg outline-none focus:border-[#8E7DA5] transition"
              />
              <button
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative mb-4">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError("") }}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                className="w-full pl-10 pr-10 py-3 border border-[#E0D8E6] rounded-lg outline-none focus:border-[#8E7DA5] transition"
              />
              <button
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-[#8E7DA5] text-white py-3 rounded-lg hover:bg-[#7B6A96] transition font-medium disabled:opacity-50 mb-3"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            <button
              onClick={() => { setStep(1); setError("") }}
              className="w-full text-sm text-[#6E5C86] hover:text-[#3e2764] transition"
            >
              ← Change email
            </button>
          </>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <CheckCircle size={56} className="mx-auto text-green-500" />
            <h2 className="text-xl font-semibold text-[#3e2764]">Password Reset!</h2>
            <p className="text-gray-500 text-sm">
              Your password has been updated successfully. You can now log in with your new password.
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-[#8E7DA5] text-white py-3 rounded-lg hover:bg-[#7B6A96] transition font-medium mt-4"
            >
              Go to Login
            </button>
          </div>
        )}

        {step !== 3 && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Remember your password?{" "}
            <span
              onClick={() => navigate("/")}
              className="text-[#8E7AAE] cursor-pointer hover:underline font-medium"
            >
              Sign in
            </span>
          </p>
        )}

      </div>
    </div>
  )
}

export default ForgotPassword