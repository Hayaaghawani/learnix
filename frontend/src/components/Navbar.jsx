import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { Home, ArrowLeft, LogOut, X } from "lucide-react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isLoggedIn = Boolean(localStorage.getItem("token"))
  const userData = localStorage.getItem("user")
  let userRole = null
  let userInitials = "?"

  if (userData) {
    try {
      const parsed = JSON.parse(userData)
      userRole = parsed.role
      const first = parsed.firstname?.[0] || ""
      const last  = parsed.lastname?.[0]  || ""
      userInitials = (first + last).toUpperCase() || parsed.email?.[0]?.toUpperCase() || "?"
    } catch (e) {
      console.error("Error parsing user data:", e)
    }
  }

  // Shrink navbar slightly on scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    const token = localStorage.getItem("token")
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
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
    if      (userRole === "instructor") navigate("/instructor")
    else if (userRole === "student")    navigate("/student")
    else if (userRole === "admin")      navigate("/admin")
    else                                navigate("/")
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300&family=DM+Sans:wght@300;400;500&display=swap');

        .nav-link-pill {
          position: relative;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.55);
          transition: color 0.25s ease;
          padding: 4px 0;
        }
        .nav-link-pill::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1px;
          background: rgba(178,152,218,0.8);
          border-radius: 99px;
          transition: width 0.3s ease;
        }
        .nav-link-pill:hover { color: rgba(255,255,255,0.9); }
        .nav-link-pill:hover::after { width: 100%; }
        .nav-link-pill.active { color: rgba(255,255,255,0.95); }
        .nav-link-pill.active::after { width: 100%; background: #b298da; }

        .logout-btn {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: rgba(255,255,255,0.6);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 6px 14px;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.04);
        }
        .logout-btn:hover {
          color: rgba(255,255,255,0.9);
          border-color: rgba(178,152,218,0.4);
          background: rgba(142,125,165,0.15);
        }

        .avatar-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8E7DA5, #5a4570);
          border: 1px solid rgba(178,152,218,0.35);
          color: rgba(255,255,255,0.9);
          font-size: 11px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          flex-shrink: 0;
        }
        .avatar-btn:hover {
          border-color: rgba(178,152,218,0.7);
          box-shadow: 0 0 0 3px rgba(142,125,165,0.2);
        }

        .nav-icon-btn {
          color: rgba(255,255,255,0.45);
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-icon-btn:hover {
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.07);
        }

        .modal-overlay {
          background: rgba(10,5,25,0.7);
          backdrop-filter: blur(8px);
        }
        .modal-card {
          background: rgba(30,18,52,0.95);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
        }
        .modal-cancel {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.55);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          border-radius: 10px;
          padding: 10px;
          transition: all 0.2s ease;
        }
        .modal-cancel:hover {
          background: rgba(255,255,255,0.09);
          color: rgba(255,255,255,0.85);
        }
        .modal-confirm {
          background: linear-gradient(135deg, #8E7DA5, #6E5C86);
          border: 1px solid rgba(178,152,218,0.25);
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          border-radius: 10px;
          padding: 10px;
          transition: all 0.2s ease;
        }
        .modal-confirm:hover {
          box-shadow: 0 6px 20px rgba(110,92,134,0.45);
          transform: translateY(-1px);
        }

        .separator {
          width: 1px;
          height: 16px;
          background: rgba(255,255,255,0.1);
        }
      `}</style>

      <motion.header
        initial={{ y: -64 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 left-0 w-full z-50"
        style={{
          background: scrolled
            ? "rgba(22,12,46,0.92)"
            : "rgba(26,15,46,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          transition: "background 0.35s ease, padding 0.35s ease",
        }}
      >
        <div
          className="max-w-7xl mx-auto px-8 flex justify-between items-center"
          style={{ height: scrolled ? "52px" : "60px", transition: "height 0.35s ease" }}
        >

          {/* Left: nav controls + logo */}
          <div className="flex items-center gap-4">

            {/* Back + Home */}
            <AnimatePresence>
              {isLoggedIn && (userRole === "student" || userRole === "instructor" || userRole === "admin") && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-1"
                >
                  <button onClick={() => navigate(-1)} className="nav-icon-btn" title="Go back">
                    <ArrowLeft size={17} />
                  </button>
                  <button onClick={handleHomeDashboard} className="nav-icon-btn" title="Dashboard">
                    <Home size={17} />
                  </button>
                  <div className="separator mx-2" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Logo */}
            <div className="flex items-center gap-0 select-none" style={{ lineHeight: 1 }}>
              <span style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "2rem",
                color: "rgba(240,236,218,0.95)",
                letterSpacing: "-0.01em",
              }}>
                L
              </span>
              <span style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 400,
                fontSize: "0.95rem",
                color: "rgba(255,255,255,0.75)",
                letterSpacing: "0.18em",
                marginLeft: "1px",
                marginTop: "4px",
              }}>
                EARNIX
              </span>
            </div>
          </div>

          {/* Right: nav links + avatar + logout */}
          <nav className="flex items-center gap-6">

            {["About", "Contact", "Privacy"].map((label) => (
              <NavLink
                key={label}
                to={`/${label.toLowerCase()}`}
                className={({ isActive }) =>
                  `nav-link-pill ${isActive ? "active" : ""}`
                }
              >
                {label}
              </NavLink>
            ))}

            {isLoggedIn && (
              <>
                <div className="separator" />

                {/* Avatar — navigates to profile */}
                <button
                  className="avatar-btn"
                  onClick={() => navigate("/profile")}
                  title="My profile"
                >
                  {userInitials}
                </button>

                {/* Logout — only show when not on the landing page */}
                {location.pathname !== "/" && (
                  <button
                    className="logout-btn"
                    onClick={() => setShowLogoutModal(true)}
                  >
                    <LogOut size={13} />
                    Logout
                  </button>
                )}
              </>
            )}
          </nav>
        </div>
      </motion.header>

      {/* ── Logout Modal ── */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center px-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="modal-card rounded-2xl p-7 w-full max-w-sm"
            >
              {/* Close button */}
              <div className="flex justify-end mb-1">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="nav-icon-btn"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div style={{
                  width: 52, height: 52,
                  borderRadius: "50%",
                  background: "rgba(142,125,165,0.15)",
                  border: "1px solid rgba(178,152,218,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <LogOut size={20} color="#b298da" />
                </div>
              </div>

              <h2 style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: "17px",
                color: "rgba(255,255,255,0.92)",
                textAlign: "center",
                marginBottom: "8px",
              }}>
                Log out of Learnix?
              </h2>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "13px",
                color: "rgba(255,255,255,0.38)",
                textAlign: "center",
                marginBottom: "24px",
                lineHeight: 1.6,
              }}>
                Your session will end and you'll need to sign in again to continue.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="modal-cancel flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="modal-confirm flex-1"
                >
                  Yes, log out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar