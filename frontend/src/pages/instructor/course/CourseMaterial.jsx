import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { UploadCloud, Trash2, FileText, Download } from "lucide-react"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

function CourseMaterial() {
  const { id } = useParams()

  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState("")
  const [filetype, setFiletype] = useState("pdf")
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchMaterials()
  }, [id])

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/materials/course/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) return
      const data = await response.json()
      setMaterials(data.materials || [])
    } catch {}
    finally { setLoading(false) }
  }

  const handleFile = (uploadedFile) => {
    // Only allow text-based files
    const allowed = ["application/pdf", "text/plain", "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if (!allowed.includes(uploadedFile.type) && !uploadedFile.name.match(/\.(pdf|txt|ppt|pptx|doc|docx)$/i)) {
      setError("Only PDF, TXT, PPT, DOC files are allowed.")
      return
    }
    setFile(uploadedFile)
    setError("")
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    const uploadedFile = e.dataTransfer.files[0]
    if (uploadedFile) handleFile(uploadedFile)
  }

  const handleUpload = async () => {
    if (!title.trim()) { setError("Please provide a title"); return }
    if (!file) { setError("Please select a file"); return }

    setUploading(true)
    setError("")
    setSuccess("")

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const token = localStorage.getItem("token")
        const response = await fetch(`${API_BASE_URL}/materials/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            courseId: id,
            title: title.trim(),
            filetype: filetype,
            filename: file.name,
            content: reader.result  // base64 data URL
          })
        })

        if (!response.ok) {
          const err = await response.json()
          setError(err.detail || "Upload failed")
          return
        }

        setSuccess("Material uploaded successfully!")
        setTitle("")
        setFile(null)
        fetchMaterials()
      } catch {
        setError("Upload failed. Please try again.")
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = async (materialId) => {
    if (!window.confirm("Delete this material?")) return
    try {
      const token = localStorage.getItem("token")
      await fetch(`${API_BASE_URL}/materials/${materialId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchMaterials()
    } catch {}
  }

  const handleDownload = (material) => {
    const link = document.createElement("a")
    link.href = material.content
    link.download = material.filename
    link.click()
  }

  const getFileIcon = (filetype) => {
    const icons = {
      pdf: "📄", slides: "📊", notes: "📝",
      article: "📰", doc: "📃"
    }
    return icons[filetype] || "📁"
  }

  return (
    <div className="min-h-screen bg-[#F4F1F7] p-10">
      <h1 className="text-2xl font-semibold text-[#3e2764] mb-8">Course Materials</h1>

      {/* Upload Box */}
      <div className="bg-white p-6 rounded-xl shadow mb-8 space-y-4">
        <h2 className="font-semibold">Upload Material</h2>

        <input
          placeholder="Material Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-3 rounded-lg w-full"
        />

        <select
          value={filetype}
          onChange={(e) => setFiletype(e.target.value)}
          className="border p-3 rounded-lg w-full"
        >
          <option value="pdf">PDF</option>
          <option value="slides">Slides (PPT)</option>
          <option value="doc">Word Document</option>
          <option value="notes">Notes (TXT)</option>
          <option value="article">Article</option>
        </select>

        {/* Drop Area */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition
            ${dragActive ? "border-purple-500 bg-purple-50" : "border-gray-300"}`}
        >
          <UploadCloud className="mx-auto mb-3 text-[#8E7DA5]" size={40} />
          <p className="text-gray-600">Drag & Drop file here</p>
          <p className="text-sm text-gray-400 mb-3">or click to browse</p>
          <input
            type="file"
            accept=".pdf,.txt,.ppt,.pptx,.doc,.docx"
            onChange={(e) => handleFile(e.target.files[0])}
            className="mx-auto"
          />
          {file && (
            <p className="mt-3 text-sm text-green-600 font-medium">
              ✓ Selected: {file.name}
            </p>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm font-medium">{success}</p>}

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-[#8E7DA5] text-white px-5 py-2 rounded-lg hover:bg-[#7B6A96] disabled:opacity-50 flex items-center gap-2"
        >
          {uploading ? "Uploading..." : <><UploadCloud size={16} /> Upload Material</>}
        </button>
      </div>

      {/* Materials List */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-4">
          Uploaded Materials
          {materials.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({materials.length})</span>
          )}
        </h2>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading materials...</p>
        ) : materials.length === 0 ? (
          <p className="text-gray-500 text-sm">No materials uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => (
              <div
                key={material.materialId}
                className="flex justify-between items-center border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getFileIcon(material.filetype)}</span>
                  <div>
                    <p className="font-medium text-gray-800">{material.title}</p>
                    <p className="text-sm text-gray-400">{material.filename}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDownload(material)}
                    className="flex items-center gap-1 text-sm text-[#6E5C86] hover:text-[#3e2764] font-medium"
                  >
                    <Download size={15} /> Download
                  </button>
                  <button
                    onClick={() => handleDelete(material.materialId)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseMaterial