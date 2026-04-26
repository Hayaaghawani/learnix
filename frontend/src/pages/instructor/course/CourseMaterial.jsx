import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { UploadCloud, Trash2, Download, FileText, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

const FILE_ICONS = { pdf: "📄", slides: "📊", notes: "📝", article: "📰", doc: "📃" }

function CourseMaterial() {
  const { id } = useParams()
  const [materials,  setMaterials]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [title,      setTitle]      = useState("")
  const [filetype,   setFiletype]   = useState("pdf")
  const [file,       setFile]       = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [error,      setError]      = useState("")
  const [success,    setSuccess]    = useState("")

  useEffect(() => { fetchMaterials() }, [id])

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/materials/course/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      setMaterials(data.materials || [])
    } catch {}
    finally { setLoading(false) }
  }

  const handleFile = (f) => {
    const allowed = ["application/pdf","text/plain","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if (!allowed.includes(f.type) && !f.name.match(/\.(pdf|txt|ppt|pptx|doc|docx)$/i)) { setError("Only PDF, TXT, PPT, DOC files are allowed."); return }
    setFile(f); setError("")
  }

  const handleUpload = async () => {
    if (!title.trim()) { setError("Please provide a title"); return }
    if (!file)         { setError("Please select a file"); return }
    setUploading(true); setError(""); setSuccess("")
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/materials/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ courseId: id, title: title.trim(), filetype, filename: file.name, content: reader.result }),
        })
        if (!res.ok) { const err = await res.json(); setError(err.detail || "Upload failed"); return }
        setSuccess("Material uploaded successfully!"); setTitle(""); setFile(null)
        fetchMaterials()
      } catch { setError("Upload failed. Please try again.") }
      finally { setUploading(false) }
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = async (materialId) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_BASE_URL}/materials/${materialId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      fetchMaterials()
    } catch {}
  }

  const handleDownload = (material) => {
    const link = document.createElement("a")
    link.href = material.content; link.download = material.filename; link.click()
  }

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans',sans-serif", fontSize: 13,
    outline: "none", transition: "all 0.2s", boxSizing: "border-box",
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');
        .mat-input:focus { border-color:rgba(178,152,218,0.5)!important; box-shadow:0 0 0 3px rgba(142,125,165,0.12); }
        .mat-input::placeholder { color:rgba(255,255,255,0.2); }
        option { background:#1e0f38; color:rgba(255,255,255,0.8); }
      `}</style>

      <h1 style={{ fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.88)", marginBottom: 6 }}>Course Materials</h1>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 28 }}>Upload PDFs, slides, and notes for your students</p>

      {/* Upload card */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 26px", marginBottom: 24 }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18, display: "block" }}>Upload Material</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: 10, marginBottom: 14 }}>
          <input className="mat-input" placeholder="Material title..." value={title} onChange={e => setTitle(e.target.value)} style={{ ...inputStyle }} />
          <select className="mat-input" value={filetype} onChange={e => setFiletype(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            <option value="pdf">PDF</option>
            <option value="slides">Slides (PPT)</option>
            <option value="doc">Word Document</option>
            <option value="notes">Notes (TXT)</option>
            <option value="article">Article</option>
          </select>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={e => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          style={{
            border: `2px dashed ${dragActive ? "rgba(178,152,218,0.6)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 12, padding: "32px 20px", textAlign: "center",
            background: dragActive ? "rgba(142,125,165,0.08)" : "rgba(255,255,255,0.02)",
            transition: "all 0.2s", cursor: "pointer", marginBottom: 14,
          }}
        >
          <UploadCloud size={32} style={{ color: dragActive ? "#b298da" : "rgba(255,255,255,0.2)", margin: "0 auto 12px" }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Drag & drop file here</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginBottom: 12 }}>or click to browse</p>
          <input type="file" accept=".pdf,.txt,.ppt,.pptx,.doc,.docx" onChange={e => handleFile(e.target.files[0])} style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, display: "block", margin: "0 auto" }} />
          {file && (
            <p style={{ marginTop: 10, fontSize: 12, color: "#4ade80" }}>✓ {file.name}</p>
          )}
        </div>

        <AnimatePresence>
          {error   && <motion.p initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ fontSize:12, color:"#f87171", marginBottom:10 }}>{error}</motion.p>}
          {success && <motion.p initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} style={{ fontSize:12, color:"#4ade80", marginBottom:10 }}>{success}</motion.p>}
        </AnimatePresence>

        <button
          onClick={handleUpload} disabled={uploading}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10,
            background: "linear-gradient(135deg,#8E7DA5,#6E5C86)",
            border: "1px solid rgba(178,152,218,0.25)",
            color: "white", fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500,
            cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1, transition: "all 0.2s",
          }}
          onMouseEnter={e => !uploading && (e.currentTarget.style.boxShadow = "0 6px 20px rgba(110,92,134,0.4)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
        >
          {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><UploadCloud size={14} /> Upload Material</>}
        </button>
      </div>

      {/* Materials list */}
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Uploaded Materials</span>
          {materials.length > 0 && (
            <span style={{ fontSize: 10, color: "rgba(178,152,218,0.5)", background: "rgba(142,125,165,0.1)", border: "1px solid rgba(142,125,165,0.15)", borderRadius: 99, padding: "1px 7px" }}>{materials.length}</span>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
            <Loader2 size={14} className="animate-spin" style={{ color: "#8E7DA5" }} /> Loading materials...
          </div>
        ) : materials.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <FileText size={28} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 10px" }} />
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No materials uploaded yet</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {materials.map((material, i) => (
              <motion.div
                key={material.materialId}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 14px", borderRadius: 10, transition: "background 0.2s",
                  borderBottom: i < materials.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22 }}>{FILE_ICONS[material.filetype] || "📁"}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)", marginBottom: 2 }}>{material.title}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{material.filename}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => handleDownload(material)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, background: "rgba(142,125,165,0.12)", border: "1px solid rgba(142,125,165,0.18)", color: "rgba(178,152,218,0.7)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(142,125,165,0.22)"; e.currentTarget.style.color = "rgba(255,255,255,0.9)" }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(142,125,165,0.12)"; e.currentTarget.style.color = "rgba(178,152,218,0.7)" }}
                  >
                    <Download size={13} /> Download
                  </button>
                  <button
                    onClick={() => handleDelete(material.materialId)}
                    style={{ padding: "6px", borderRadius: 8, background: "none", border: "none", color: "rgba(255,255,255,0.2)", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(239,68,68,0.1)" }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.2)"; e.currentTarget.style.background = "transparent" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseMaterial