import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { UploadCloud, Trash2 } from "lucide-react"

function CourseMaterial() {

  const { id } = useParams()

  const [course, setCourse] = useState(null)
  const [title, setTitle] = useState("")
  const [type, setType] = useState("pdf")
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)



  useEffect(() => {

    const courses = JSON.parse(localStorage.getItem("courses")) || []
    const selectedCourse = courses[id]

    if (!selectedCourse.materials) {
      selectedCourse.materials = []
    }

    setCourse(selectedCourse)

  }, [id])



  if (!course) return <div className="p-10">Loading...</div>



  /* ---------- FILE HANDLING ---------- */

  const handleFile = (uploadedFile) => {

    setFile(uploadedFile)

  }



  const handleDrop = (e) => {

    e.preventDefault()
    setDragActive(false)

    const uploadedFile = e.dataTransfer.files[0]

    if (uploadedFile) {
      handleFile(uploadedFile)
    }

  }



  const handleUpload = () => {

    if (!title || !file) {
      alert("Please provide title and file")
      return
    }

    const reader = new FileReader()

    reader.onload = () => {

      const base64 = reader.result

      const courses = JSON.parse(localStorage.getItem("courses")) || []

      const newMaterial = {
        title,
        type,
        fileName: file.name,
        data: base64
      }

      courses[id].materials.push(newMaterial)

      localStorage.setItem("courses", JSON.stringify(courses))

      setCourse(courses[id])

      setTitle("")
      setFile(null)

    }

    reader.readAsDataURL(file)

  }



  const deleteMaterial = (index) => {

    const courses = JSON.parse(localStorage.getItem("courses")) || []

    courses[id].materials.splice(index, 1)

    localStorage.setItem("courses", JSON.stringify(courses))

    setCourse(courses[id])

  }



  return (

    <div className="min-h-screen bg-[#F4F1F7] p-10">

      <h1 className="text-2xl font-semibold text-[#3e2764] mb-8">
        Course Materials
      </h1>



      {/* Upload Box */}

      <div className="bg-white p-6 rounded-xl shadow mb-8 space-y-4">

        <h2 className="font-semibold">
          Upload Material
        </h2>



        <input
          placeholder="Material Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-3 rounded-lg w-full"
        />



        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border p-3 rounded-lg w-full"
        >
          <option value="pdf">PDF</option>
          <option value="slides">Slides</option>
          <option value="video">Video</option>
          <option value="notes">Notes</option>
          <option value="article">Article</option>
        </select>



        {/* DROP AREA */}

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition
          ${dragActive ? "border-purple-500 bg-purple-50" : "border-gray-300"}`}
        >

          <UploadCloud className="mx-auto mb-3 text-[#8E7DA5]" size={40} />

          <p className="text-gray-600">
            Drag & Drop file here
          </p>

          <p className="text-sm text-gray-400 mb-3">
            or click to upload
          </p>

          <input
            type="file"
            onChange={(e) => handleFile(e.target.files[0])}
            className="mx-auto"
          />

          {file && (
            <p className="mt-3 text-sm text-green-600">
              Selected: {file.name}
            </p>
          )}

        </div>



        <button
          onClick={handleUpload}
          className="bg-[#8E7DA5] text-white px-5 py-2 rounded-lg"
        >
          Upload Material
        </button>

      </div>



      {/* Uploaded Materials */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="font-semibold mb-4">
          Uploaded Materials
        </h2>

        {course.materials.length === 0 ? (

          <p className="text-gray-500">
            No materials uploaded yet.
          </p>

        ) : (

          <div className="space-y-4">

            {course.materials.map((material, index) => (

              <div
                key={index}
                className="flex justify-between items-center border-b pb-3"
              >

                <div>

                  <p className="font-medium">
                    {material.title}
                  </p>

                  <p className="text-sm text-gray-500">
                    {material.fileName}
                  </p>

                </div>

                <div className="flex gap-3">

                  <a
                    href={material.data}
                    download={material.fileName}
                    className="text-blue-600 underline text-sm"
                  >
                    Download
                  </a>

                  <Trash2
                    size={18}
                    className="text-red-500 cursor-pointer"
                    onClick={() => deleteMaterial(index)}
                  />

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