import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { Mail, Lock, Eye, EyeOff, Instagram, Facebook, Linkedin } from "lucide-react"
import { motion } from "framer-motion"

function Login() {
  const navigate = useNavigate()

  const [role, setRole] = useState("student")
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

 const API_BASE = "http://127.0.0.1:8000"

const handleLogin = async () => {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      alert(data.detail || `Login failed (${response.status})`)
      return
    }

    localStorage.setItem("token", data.access_token)
    localStorage.setItem("userid", data.userid)

    alert("Login successful")
    navigate(`/${role}`)
  } catch (error) {
    console.error("FETCH ERROR:", error)
    alert("Cannot connect to backend: " + error.message)
  }
}

  return (
    <div className="min-h-screen flex flex-col bg-[#D6CEDC] pt-24">
      <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition duration-300 p-10 w-full max-w-xl mx-auto mt-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-md w-full max-w-md rounded-2xl shadow-xl p-10 border border-white/30 relative z-10"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-5xl text-center font-luxury tracking-wide"
          >
            <span className="text-6xl italic">L</span>earnix
          </motion.h1>

          <div className="w-16 h-[2px] bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto mt-3 mb-6 rounded-full"></div>

          <p className="text-center text-gray-500 mb-8">
            Guided by AI. Driven by you.
          </p>

          <div className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-[#E0D8E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E7DA5] transition"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-[#E0D8E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E7DA5] transition"
              />
              <div
                className="absolute right-3 top-3.5 cursor-pointer text-gray-500 hover:text-[#8E7DA5] transition"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 border border-[#E0D8E6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E7DA5]"
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>

            <button
              onClick={handleLogin}
              className="w-full bg-[#8E7DA5] text-white py-3 rounded-lg hover:bg-[#7B6A96] hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-medium tracking-wide"
            >
              Sign In
            </button>

            <p className="text-sm text-center mt-4">
              <span className="text-gray-600">Forgot Password? </span>
              <span
                onClick={() => navigate("/forgot-password")}
                className="text-[#8E7AAE] cursor-pointer hover:underline font-medium"
              >
                Click here
              </span>
            </p>
          </div>
        </motion.div>

        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[#CBBED8]/40 to-transparent blur-2xl"></div>
      </div>

      <div className="relative w-full h-24 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.12]">
          <svg width="100%" height="100%">
            <pattern id="diamondPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect
                x="10"
                y="10"
                width="6"
                height="6"
                transform="rotate(45 13 13)"
                fill="#3e2764"
                opacity="0.9"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#diamondPattern)" />
          </svg>
        </div>

        <svg
          className="absolute bottom-0 w-full h-32"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#BBAFC8"
            fillOpacity="0.6"
            d="M0,192L80,170.7C160,149,320,107,480,101.3C640,96,800,128,960,144C1120,160,1280,160,1360,160L1440,160V320H0Z"
          />
        </svg>
      </div>

      <footer className="w-full bg-[#6E5C86] text-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm opacity-90">
            © 2026 Learnix. All rights reserved.
          </div>

          <div className="flex gap-8 text-sm tracking-wide">
            <span
              onClick={() => navigate("/about")}
              className="cursor-pointer hover:text-yellow-300 transition"
            >
              About Us
            </span>

            <span
              onClick={() => navigate("/contact")}
              className="cursor-pointer hover:text-yellow-300 transition"
            >
              Contact
            </span>

            <span
              onClick={() => navigate("/privacy")}
              className="cursor-pointer hover:text-yellow-300 transition"
            >
              Privacy Policy
            </span>
          </div>

          <div className="flex gap-5">
            <a
              href="https://www.instagram.com/learnix100/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram
                className="cursor-pointer hover:text-yellow-300 transition"
                size={18}
              />
            </a>

            <a
              href="https://web.facebook.com/profile.php?id=61587731650405"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Facebook
                className="cursor-pointer hover:text-yellow-300 transition"
                size={18}
              />
            </a>

            <a href="#">
              <Linkedin
                className="cursor-pointer hover:text-yellow-300 transition"
                size={18}
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Login