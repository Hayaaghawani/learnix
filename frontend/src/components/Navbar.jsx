import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { Home, ArrowLeft } from "lucide-react"
import { useState } from "react"


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const isLoggedIn = Boolean(localStorage.getItem("token"))
  const userData = localStorage.getItem("user")
  let userRole = null

  if (userData) {
    try {
      const parsed = JSON.parse(userData)
      userRole = parsed.role
    } catch (e) {
      console.error("Error parsing user data:", e)
    }
  }

  const handleLogout = async () => {
    const token = localStorage.getItem("token")
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        })
      }
    } catch (error) {
      console.error("Logout request failed:", error)
    } finally {
      localStorage.removeItem("token")
      localStorage.removeItem("access_token")
      localStorage.removeItem("user")
      setShowLogoutModal(false)
      navigate("/")
    }
  }

  const handleHomeDashboard = () => {
    if (userRole === "instructor") navigate("/instructor")
    else if (userRole === "student") navigate("/student")
    else if (userRole === "admin") navigate("/admin")
    else navigate("/")
  }

  return (
    <>
      <header className="sticky top-0 left-0 w-full z-50 bg-[#7B6BA0] backdrop-blur-sm border-b border-[#6a5a8e]">
        <div className="max-w-7xl mx-auto px-8 py-3.5 flex justify-between items-center">

          {/* Logo + Home icon */}
          <div className="flex items-center gap-3">
           {isLoggedIn && (userRole === "student" || userRole === "instructor" || userRole === "admin") && (
  <div className="flex gap-6 items-center ">
    <button
      onClick={() => navigate(-1)}
      className="text-white/70 hover:text-white transition"
      title="Go back"
    >
      <ArrowLeft size={22} />
    </button>
    <button 
      onClick={handleHomeDashboard}
      className="text-white/70 hover:text-white transition"
      title="Go to Dashboard"
    >
      <Home  size={22} />
    </button>
  </div>
)}
            
            <div
              onClick={() => navigate("/")}
              className="flex items-center gap-0.5 cursor-pointer group"
            >
              <span style={{ fontFamily: "'Great Vibes', cursive", color: "#f0ecda" }} className="text-5xl leading-none">L</span>
              <span className="text-white/90 font-semibold tracking-widest text-lg">earni</span>
              <span style={{ fontFamily: "'Great Vibes', cursive", color: "#ece7cd" }} className="text-5xl leading-none">x</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex gap-8 text-sm tracking-wide text-white/80 font-medium items-center">
            {["About", "Contact", "Privacy"].map((label) => (
              <NavLink
                key={label}
                to={`/${label.toLowerCase()}`}
                className={({ isActive }) =>
                  isActive
                    ? "text-white relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-white after:rounded-full"
                    : "hover:text-white transition duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-white/60 after:rounded-full hover:after:w-full after:transition-all after:duration-300"
                }
              >
                {label}
              </NavLink>
            ))}

            {isLoggedIn && location.pathname !== "/" && (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="ml-2 text-white/90 border border-white/30 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:border-white/50 transition duration-200"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center">
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6E5C86" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#3e2764] mb-2">Log out?</h2>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to log out of Learnix?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-lg bg-[#6E5C86] text-white hover:bg-[#5a4a70] transition text-sm font-medium"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar