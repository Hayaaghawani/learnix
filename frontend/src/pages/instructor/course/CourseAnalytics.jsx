import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

function CourseAnalytics() {

  const { id } = useParams()
  const [course, setCourse] = useState(null)

  useEffect(() => {

    const courses = JSON.parse(localStorage.getItem("courses")) || []

    const selectedCourse = courses[id]

    if (!selectedCourse) {
      setCourse(null)
      return
    }

    // ensure safe structure
    if (!Array.isArray(selectedCourse.students)) {
      selectedCourse.students = []
    }

    if (!Array.isArray(selectedCourse.exercises)) {
      selectedCourse.exercises = []
    }

    setCourse(selectedCourse)

  }, [id])


  if (!course) {
    return <div className="p-10">Loading analytics...</div>
  }



  /* ---------- SAFE DATA ---------- */

  const students = Array.isArray(course.students) ? course.students : []
  const exercises = Array.isArray(course.exercises) ? course.exercises : []



  /* ---------- ANALYTICS DATA ---------- */

  const studentProgress = students.map((s, i) => ({
    name: s?.name || `Student ${i + 1}`,
    progress: s?.progress ?? Math.floor(Math.random() * 100)
  }))


  const exerciseCompletion = exercises.map((e, i) => ({
    name: e?.title || `Exercise ${i + 1}`,
    completed: Math.floor(Math.random() * 30) + 5
  }))


  const hintUsage = [
    { name: "Hints Used", value: 60 },
    { name: "No Hints", value: 40 }
  ]


  const COLORS = ["#8E7DA5", "#CBBED8"]



  return (

    <div className="min-h-screen bg-[#F4F1F7] p-10">

      <h1 className="text-2xl font-semibold text-[#3e2764] mb-8">
        Course Analytics
      </h1>



      {/* STUDENT PROGRESS */}

      <div className="bg-white p-6 rounded-xl shadow mb-8">

        <h2 className="font-semibold mb-4">
          Student Progress
        </h2>

        <ResponsiveContainer width="100%" height={300}>

          <BarChart data={studentProgress}>

            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />

            <Bar dataKey="progress" fill="#8E7DA5" />

          </BarChart>

        </ResponsiveContainer>

      </div>



      {/* EXERCISE COMPLETION */}

      <div className="bg-white p-6 rounded-xl shadow mb-8">

        <h2 className="font-semibold mb-4">
          Exercise Completion
        </h2>

        <ResponsiveContainer width="100%" height={300}>

          <BarChart data={exerciseCompletion}>

            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />

            <Bar dataKey="completed" fill="#CBBED8" />

          </BarChart>

        </ResponsiveContainer>

      </div>



      {/* HINT USAGE */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="font-semibold mb-4">
          Hint Usage
        </h2>

        <ResponsiveContainer width="100%" height={300}>

          <PieChart>

            <Pie
              data={hintUsage}
              dataKey="value"
              outerRadius={100}
              label
            >

              {hintUsage.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}

            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}

export default CourseAnalytics