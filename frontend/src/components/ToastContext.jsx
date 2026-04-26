import { createContext, useContext, useState, useCallback, useRef } from "react"
import { CheckCircle2, XCircle, AlertTriangle, Info, X, Loader2 } from "lucide-react"

// ─── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext(null)
const ConfirmContext = createContext(null)

// ─── Hook exports ───────────────────────────────────────────────────────────

export function useToast() {
  return useContext(ToastContext)
}

export function useConfirm() {
  return useContext(ConfirmContext)
}

// ─── Toast icons & colours ──────────────────────────────────────────────────

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    bar:  "bg-green-500",
    icon_cls: "text-green-500",
    bg:   "bg-white",
  },
  error: {
    icon: XCircle,
    bar:  "bg-red-500",
    icon_cls: "text-red-500",
    bg:   "bg-white",
  },
  warning: {
    icon: AlertTriangle,
    bar:  "bg-amber-400",
    icon_cls: "text-amber-500",
    bg:   "bg-white",
  },
  info: {
    icon: Info,
    bar:  "bg-[#8E7DA5]",
    icon_cls: "text-[#8E7DA5]",
    bg:   "bg-white",
  },
}

// ─── Single Toast item ───────────────────────────────────────────────────────

function ToastItem({ toast, onRemove }) {
  const v = VARIANTS[toast.type] || VARIANTS.info
  const Icon = v.icon

  return (
    <div
      className="relative flex items-start gap-3 w-80 rounded-xl shadow-xl overflow-hidden bg-white border border-gray-100"
      style={{ animation: "learnix-slide-in 0.3s cubic-bezier(.22,1,.36,1) both" }}
    >
      {/* left colour bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${v.bar} rounded-l-xl`} />

      <div className="pl-4 pt-4 shrink-0">
        <Icon size={20} className={v.icon_cls} />
      </div>

      <div className="flex-1 py-4 pr-2 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-[#3e2764] leading-tight mb-0.5">{toast.title}</p>
        )}
        <p className="text-sm text-gray-600 leading-snug break-words">{toast.message}</p>
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        className="mt-3.5 mr-3 shrink-0 text-gray-300 hover:text-gray-500 transition"
      >
        <X size={15} />
      </button>

      {/* progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${v.bar} opacity-40`}
        style={{ animation: `learnix-shrink ${toast.duration}ms linear both` }}
      />
    </div>
  )
}

// ─── Confirm Modal ───────────────────────────────────────────────────────────

function ConfirmModal({ options, onResolve }) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (options.onConfirm) {
      setLoading(true)
      try { await options.onConfirm() } finally { setLoading(false) }
    }
    onResolve(true)
  }

  const icon = options.icon || "warning"
  const iconMap = {
    warning: { el: AlertTriangle, cls: "text-amber-500 bg-amber-50" },
    danger:  { el: XCircle,       cls: "text-red-500   bg-red-50"   },
    info:    { el: Info,          cls: "text-[#8E7DA5] bg-purple-50" },
    success: { el: CheckCircle2,  cls: "text-green-500 bg-green-50"  },
  }
  const { el: IconEl, cls: iconCls } = iconMap[icon] || iconMap.warning

  const confirmCls = {
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    danger:  "bg-red-500   hover:bg-red-600   text-white",
    info:    "bg-[#8E7DA5] hover:bg-[#7B6A96] text-white",
    success: "bg-green-500 hover:bg-green-600 text-white",
  }[icon] || "bg-[#8E7DA5] hover:bg-[#7B6A96] text-white"

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{ animation: "learnix-fade-in 0.2s ease both" }}
        onClick={() => onResolve(false)}
      />

      {/* card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 flex flex-col items-center text-center"
        style={{ animation: "learnix-pop-in 0.25s cubic-bezier(.22,1,.36,1) both" }}
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${iconCls}`}>
          <IconEl size={32} />
        </div>

        <h2 className="text-xl font-semibold text-[#3e2764] mb-2">
          {options.title || "Are you sure?"}
        </h2>

        {options.message && (
          <p className="text-gray-500 text-sm mb-1">{options.message}</p>
        )}

        {options.detail && (
          <p className="text-[#3e2764] font-semibold text-sm mb-1">"{options.detail}"</p>
        )}

        {options.subtext && (
          <p className="text-gray-400 text-xs mt-1 mb-6">{options.subtext}</p>
        )}

        {!options.subtext && <div className="mb-6" />}

        <div className="flex gap-3 w-full">
          <button
            onClick={() => onResolve(false)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition disabled:opacity-50"
          >
            {options.cancelLabel || "Cancel"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 ${confirmCls}`}
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> {options.loadingLabel || "Processing..."}</>
              : (options.confirmLabel || "Confirm")
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Provider ────────────────────────────────────────────────────────────────

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [confirm, setConfirm] = useState(null)
  const resolveRef = useRef(null)

  // Toast API
  const toast = useCallback((type, message, { title, duration = 4000 } = {}) => {
    const id = ++_id
    setToasts(prev => [...prev, { id, type, message, title, duration }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration + 300)
  }, [])

  const toastApi = {
    success: (msg, opts) => toast("success", msg, opts),
    error:   (msg, opts) => toast("error",   msg, opts),
    warning: (msg, opts) => toast("warning", msg, opts),
    info:    (msg, opts) => toast("info",    msg, opts),
  }

  // Confirm API — returns a Promise<boolean>
  const showConfirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setConfirm(options)
    })
  }, [])

  const handleResolve = (result) => {
    setConfirm(null)
    resolveRef.current?.(result)
    resolveRef.current = null
  }

  return (
    <ToastContext.Provider value={toastApi}>
      <ConfirmContext.Provider value={showConfirm}>
        {children}

        {/* Toast stack */}
        <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem
                toast={t}
                onRemove={id => setToasts(prev => prev.filter(x => x.id !== id))}
              />
            </div>
          ))}
        </div>

        {/* Confirm modal */}
        {confirm && <ConfirmModal options={confirm} onResolve={handleResolve} />}

        {/* Keyframe animations injected once */}
        <style>{`
          @keyframes learnix-slide-in {
            from { opacity: 0; transform: translateX(40px) scale(0.95); }
            to   { opacity: 1; transform: translateX(0)    scale(1);    }
          }
          @keyframes learnix-shrink {
            from { width: 100%; }
            to   { width: 0%;   }
          }
          @keyframes learnix-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes learnix-pop-in {
            from { opacity: 0; transform: scale(0.92) translateY(10px); }
            to   { opacity: 1; transform: scale(1)    translateY(0);    }
          }
        `}</style>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  )
}