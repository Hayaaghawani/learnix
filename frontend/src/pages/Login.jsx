import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Instagram, Facebook, Linkedin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

// Floating orb component
function Orb({ style }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={style}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.08, 1],
      }}
      transition={{
        duration: style.duration || 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: style.delay || 0,
      }}
    />
  )
}

function Login() {
  const navigate = useNavigate()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [emailFocused, setEmailFocused]       = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const handleLogin = async () => {
    setError('')
    if (!email || !password) { setError('Please enter both email and password.'); return }
    setLoading(true)
    try {
      const res  = await fetch(`${API_BASE_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Login failed. Check your credentials.'); return }

      localStorage.setItem('token', data.access_token)

      const userRes  = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      const userData = await userRes.json()
      if (!userRes.ok) { setError(userData.detail || 'Failed to fetch user profile.'); return }

      const currentUser = userData.user || userData
      localStorage.setItem('user', JSON.stringify(currentUser))

      const role = currentUser?.role
      if      (role === 'admin')      navigate('/admin')
      else if (role === 'instructor') navigate('/instructor')
      else if (role === 'student')    navigate('/student')
      else                            setError('Your account role is not recognized.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin() }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ background: '#1a0f2e', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

        .input-field {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
          transition: all 0.3s ease;
          outline: none;
          font-family: 'DM Sans', sans-serif;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.3); }
        .input-field.focused {
          background: rgba(255,255,255,0.09);
          border-color: rgba(178,152,218,0.6);
          box-shadow: 0 0 0 3px rgba(142,125,165,0.15);
        }
        .input-field:autofill,
        .input-field:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px rgba(40,20,70,0.95) inset !important;
          -webkit-text-fill-color: #fff !important;
        }
        .sign-btn {
          background: linear-gradient(135deg, #8E7DA5 0%, #6E5C86 50%, #5a4570 100%);
          border: 1px solid rgba(178,152,218,0.3);
          font-family: 'DM Sans', sans-serif;
          letter-spacing: 0.08em;
          position: relative;
          overflow: hidden;
        }
        .sign-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
          transition: left 0.5s ease;
        }
        .sign-btn:hover::before { left: 100%; }
        .sign-btn:hover {
          box-shadow: 0 8px 30px rgba(110,92,134,0.5);
          transform: translateY(-1px);
        }
        .sign-btn:active { transform: translateY(0); }

        .glass-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .left-panel {
          background: linear-gradient(160deg, #2d1a4e 0%, #1e0f38 40%, #160c2e 100%);
        }

        .logo-text {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-weight: 300;
        }

        .divider-line {
          background: linear-gradient(90deg, transparent, rgba(178,152,218,0.5), transparent);
        }

        .feature-item {
          border-left: 2px solid rgba(142,125,165,0.4);
        }
      `}</style>

      {/* Background orbs */}
      <Orb style={{ width: 500, height: 500, top: -100, left: -150, background: 'radial-gradient(circle, rgba(110,92,134,0.25) 0%, transparent 70%)', duration: 10, delay: 0 }} />
      <Orb style={{ width: 400, height: 400, bottom: -80, right: -100, background: 'radial-gradient(circle, rgba(62,39,100,0.3) 0%, transparent 70%)', duration: 12, delay: 2 }} />
      <Orb style={{ width: 300, height: 300, top: '40%', left: '30%', background: 'radial-gradient(circle, rgba(142,125,165,0.1) 0%, transparent 70%)', duration: 9, delay: 1 }} />

      <div className="flex-1 flex">

        {/* ── LEFT DECORATIVE PANEL ── */}
        <motion.div
          initial={{ x: -60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex left-panel w-[52%] flex-col justify-between p-16 relative overflow-hidden"
        >
          {/* Subtle grid texture */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />

          {/* Decorative arcs */}
          <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white/5" />
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-white/5" />
          <div className="absolute -right-8  top-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-purple-400/10" />

          {/* Top: Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="logo-text text-6xl text-white/90 tracking-wide">Learnix</h1>
            <div className="divider-line h-px w-24 mt-4 mb-5" />
            <p className="text-white/40 text-sm tracking-widest uppercase font-light">
              Guided by AI. Driven by you.
            </p>
          </motion.div>

          {/* Middle: Feature highlights */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            {[
              { label: "Adaptive AI Hints",    desc: "Context-aware guidance that meets each student where they are." },
              { label: "Real-Time Feedback",   desc: "Instant code evaluation with Monaco-powered editor." },
              { label: "Instructor Insights",  desc: "Monitor progress and respond to help requests in one place." },
            ].map((f, i) => (
              <motion.div
                key={f.label}
                className="feature-item pl-5"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.15, duration: 0.6 }}
              >
                <p className="text-white/80 font-medium text-sm mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{f.label}</p>
                <p className="text-white/35 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Bottom: Social + copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex items-center justify-between"
          >
            <p className="text-white/25 text-xs">© 2026 Learnix</p>
            <div className="flex gap-4">
              {[
                { Icon: Instagram, href: "https://www.instagram.com/learnix100/" },
                { Icon: Facebook,  href: "https://web.facebook.com/profile.php?id=61587731650405" },
                { Icon: Linkedin,  href: "#" },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                  className="text-white/30 hover:text-purple-300 transition-colors duration-300">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── RIGHT LOGIN PANEL ── */}
        <div className="flex-1 flex items-center justify-center px-8 py-16 relative">

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="glass-card rounded-3xl p-10 w-full max-w-md"
          >
            {/* Mobile logo */}
            <div className="lg:hidden mb-8 text-center">
              <h1 className="logo-text text-5xl text-white/90">Learnix</h1>
              <div className="divider-line h-px w-20 mx-auto mt-3" />
            </div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-10"
            >
              <h2 className="text-2xl font-semibold text-white/90 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Welcome back
              </h2>
              <p className="text-white/35 text-sm">Sign in to continue your learning journey</p>
            </motion.div>

            <div className="space-y-4">

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="relative"
              >
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
                  size={16}
                  style={{ color: emailFocused ? '#b298da' : 'rgba(255,255,255,0.3)' }}
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  onKeyDown={handleKeyDown}
                  className={`input-field w-full pl-11 pr-4 py-3.5 rounded-xl text-sm ${emailFocused ? 'focused' : ''}`}
                />
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="relative"
              >
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
                  size={16}
                  style={{ color: passwordFocused ? '#b298da' : 'rgba(255,255,255,0.3)' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onKeyDown={handleKeyDown}
                  className={`input-field w-full pl-11 pr-12 py-3.5 rounded-xl text-sm ${passwordFocused ? 'focused' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-purple-300 transition-colors duration-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </motion.div>

              {/* Forgot password */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55, duration: 0.5 }}
                className="text-right"
              >
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-white/35 hover:text-purple-300 transition-colors duration-300"
                >
                  Forgot password?
                </button>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-red-400 text-xs text-center bg-red-400/10 border border-red-400/20 rounded-lg py-2.5 px-3">
                      {error}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sign In button */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="sign-btn w-full text-white py-3.5 rounded-xl font-medium text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 mt-2"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={15} className="opacity-70" />
                    </>
                  )}
                </button>
              </motion.div>
            </div>

            {/* Bottom links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.5 }}
              className="mt-8 pt-6 border-t border-white/8 flex justify-center gap-6 text-xs text-white/25"
            >
              <button onClick={() => navigate('/about')}   className="hover:text-purple-300 transition-colors duration-300">About</button>
              <button onClick={() => navigate('/contact')} className="hover:text-purple-300 transition-colors duration-300">Contact</button>
              <button onClick={() => navigate('/privacy')} className="hover:text-purple-300 transition-colors duration-300">Privacy</button>
            </motion.div>

            {/* Mobile social icons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              className="lg:hidden mt-5 flex justify-center gap-5"
            >
              {[
                { Icon: Instagram, href: "https://www.instagram.com/learnix100/" },
                { Icon: Facebook,  href: "https://web.facebook.com/profile.php?id=61587731650405" },
                { Icon: Linkedin,  href: "#" },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                  className="text-white/25 hover:text-purple-300 transition-colors duration-300">
                  <Icon size={16} />
                </a>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Login