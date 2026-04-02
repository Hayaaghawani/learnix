import { NavLink, useNavigate } from "react-router-dom"

function Navbar() {
  const navigate = useNavigate()

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
<nav className="flex gap-10 text-sm tracking-wide text-white font-medium">
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

        </nav>

      </div>
    </header>
  )
}

export default Navbar
