import { NavLink, useLocation, useNavigate } from "react-router-dom"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isLoggedIn = Boolean(localStorage.getItem("token"))

  const handleLogout = async () => {
    const token = localStorage.getItem("token")

    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          }
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
   <header className="sticky top-0 left-0 w-full z-50 bg-[#8E7AAE]">
      <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">

        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          className="text-2xl font-luxury cursor-pointer tracking-wide"
        >
          <span className="italic text-3xl">L</span>earnix
        </div>

        {/* Navigation Links */}
  <nav className="flex gap-10 text-sm tracking-wide text-white font-medium items-center">
          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive
                ? "text-white border-b-2 border-[#3e2764] pb-1"
                : "hover:text-[#3e2764] transition"
            }
          >
            About
          </NavLink>

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              isActive
                ? "text-white border-b-2 border-[#3e2764] pb-1"
                : "hover:text-[#3e2764] transition"
            }
          >
            Contact
          </NavLink>

          <NavLink
            to="/privacy"
            className={({ isActive }) =>
              isActive
                ? "text-white border-b-2 border-[#3e2764] pb-1"
                : "hover:text-[#3e2764] transition"
            }
          >
            Privacy
          </NavLink>

          {isLoggedIn && location.pathname !== "/" && (
            <button
              onClick={handleLogout}
              className="bg-white/20 px-3 py-1.5 rounded-md hover:bg-white/30 transition"
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
