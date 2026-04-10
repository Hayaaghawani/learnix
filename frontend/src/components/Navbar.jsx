import { NavLink, useLocation, useNavigate } from "react-router-dom"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

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
      navigate("/")
    }
  }

  return (
    <header className="sticky top-0 left-0 w-full z-50 bg-[#7B6BA0] backdrop-blur-sm border-b border-[#6a5a8e]">
      <div className="max-w-7xl mx-auto px-8 py-3.5 flex justify-between items-center">

    {/* Logo */}
<div
  onClick={() => navigate("/")}
  className="flex items-center gap-0.5 cursor-pointer group"
>
  <span style={{ fontFamily: "'Great Vibes', cursive", color: "#f0ecda" }} className="text-5xl leading-none">
    L
  </span>
  <span className="text-white/90 font-semibold tracking-widest text-lg">
    earni
  </span>
  <span style={{ fontFamily: "'Great Vibes', cursive", color: "#ece7cd" }} className="text-5xl leading-none">
    x
  </span>
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
              onClick={handleLogout}
              className="ml-2 text-white/90 border border-white/30 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-white/10 hover:border-white/50 transition duration-200"
            >
              Logout
            </button>
          )}

        </nav>
      </div>
    </header>
  )
}

export default Navbar