import React, { useState, useEffect } from "react"
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

function AdminDashboard() {

  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState([])
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({})
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("Student")

  const [settings, setSettings] = useState({
    aiModel: "GPT-4o",
    hintLimit: 5,
    executionTimeout: 5
  })

  const COLORS = ["#8B5CF6", "#A78BFA"]

 useEffect(() => {

  setStats({
    users: 120,
    students: 95,
    instructors: 12,
    courses: 18
  })

  setUsers([
    { id:1, name:"Ahmad Ali", email:"ahmad@psut.edu", role:"Student", active:true },
    { id:2, name:"Dr. Sara", email:"sara@psut.edu", role:"Instructor", active:true }
  ])

  setCourses([
    { id:1, name:"CS1 Programming", instructor:"Dr. Sara", students:40, status:"Active" }
  ])

  setLogs([
    { message:"Student requested too many hints" },
    { message:"Possible plagiarism detected" }
  ])

}, [])

  const fetchStats = async () => {
    const res = await fetch("/api/admin/stats")
    const data = await res.json()
    setStats(data)
  }

  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users")
    const data = await res.json()
    setUsers(data)
  }

  const fetchCourses = async () => {
    const res = await fetch("/api/admin/courses")
    const data = await res.json()
    setCourses(data)
  }

  const fetchLogs = async () => {
    const res = await fetch("/api/admin/logs")
    const data = await res.json()
    setLogs(data)
  }

  const sendInvite = async () => {
    if (!inviteEmail) return

    await fetch("/api/admin/invite-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        role: inviteRole
      })
    })

    setInviteEmail("")
    fetchUsers()
  }

  const toggleUserStatus = async (id, active) => {
    await fetch(`/api/admin/user/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active })
    })

    fetchUsers()
  }

  const deleteUser = async (id) => {
    await fetch(`/api/admin/user/${id}`, {
      method: "DELETE"
    })

    fetchUsers()
  }

  const saveSettings = async () => {
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    })
  }

  const userChart = [
    { name: "Students", value: stats.students || 0 },
    { name: "Instructors", value: stats.instructors || 0 }
  ]

  return (
    <div className="p-6 space-y-10">

      <h1 className="text-3xl font-bold text-purple-600">
        Admin Dashboard
      </h1>

      {/* SYSTEM OVERVIEW */}

      <div className="grid grid-cols-4 gap-6">

        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500">Users</p>
          <p className="text-2xl font-semibold">{stats.users || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500">Students</p>
          <p className="text-2xl font-semibold">{stats.students || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500">Instructors</p>
          <p className="text-2xl font-semibold">{stats.instructors || 0}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <p className="text-gray-500">Courses</p>
          <p className="text-2xl font-semibold">{stats.courses || 0}</p>
        </div>

      </div>

      {/* USER DISTRIBUTION CHART */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="text-xl font-semibold mb-4">
          User Distribution
        </h2>

        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={userChart}
              dataKey="value"
              nameKey="name"
              outerRadius={80}
              label
            >
              {userChart.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

      </div>

      {/* INVITE USER */}

      <div className="bg-white p-6 rounded-xl shadow space-y-4">

        <h2 className="text-xl font-semibold">
          Invite User
        </h2>

        <div className="flex gap-4">

          <input
            className="border p-2 rounded w-full"
            placeholder="Email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />

          <select
            className="border p-2 rounded"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          >
            <option>Student</option>
            <option>Instructor</option>
          </select>

          <button
            onClick={sendInvite}
            className="bg-purple-600 text-white px-4 rounded"
          >
            Send Invite
          </button>

        </div>

      </div>

      {/* USERS TABLE */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="text-xl font-semibold mb-4">
          Users
        </h2>

        <table className="w-full">

          <thead className="text-left border-b">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {users.map((u) => (

              <tr key={u.id} className="border-b">

                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  {u.active ? "Active" : "Inactive"}
                </td>

                <td className="space-x-2">

                  <button
                    onClick={() => toggleUserStatus(u.id, u.active)}
                    className="text-blue-600"
                  >
                    Toggle
                  </button>

                  <button
                    onClick={() => deleteUser(u.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* COURSE MONITORING */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="text-xl font-semibold mb-4">
          Courses
        </h2>

        <table className="w-full">

          <thead className="border-b text-left">
            <tr>
              <th>Course</th>
              <th>Instructor</th>
              <th>Students</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>

            {courses.map((c) => (

              <tr key={c.id} className="border-b">

                <td>{c.name}</td>
                <td>{c.instructor}</td>
                <td>{c.students}</td>
                <td>{c.status}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {/* SYSTEM SETTINGS */}

      <div className="bg-white p-6 rounded-xl shadow space-y-4">

        <h2 className="text-xl font-semibold">
          System Settings
        </h2>

        <div className="grid grid-cols-3 gap-6">

          <div>
            <label className="text-sm text-gray-600">
              AI Model
            </label>

            <select
              className="border p-2 rounded w-full"
              value={settings.aiModel}
              onChange={(e) =>
                setSettings({ ...settings, aiModel: e.target.value })
              }
            >
              <option>GPT-4o</option>
              <option>Claude</option>
              <option>Gemini</option>
            </select>

          </div>

          <div>
            <label className="text-sm text-gray-600">
              Hint Limit
            </label>

            <input
              type="number"
              className="border p-2 rounded w-full"
              value={settings.hintLimit}
              onChange={(e) =>
                setSettings({ ...settings, hintLimit: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">
              Execution Timeout (s)
            </label>

            <input
              type="number"
              className="border p-2 rounded w-full"
              value={settings.executionTimeout}
              onChange={(e) =>
                setSettings({ ...settings, executionTimeout: e.target.value })
              }
            />
          </div>

        </div>

        <button
          onClick={saveSettings}
          className="bg-purple-600 text-white px-6 py-2 rounded"
        >
          Save Settings
        </button>

      </div>

      {/* SECURITY LOGS */}

      <div className="bg-white p-6 rounded-xl shadow">

        <h2 className="text-xl font-semibold mb-4">
          Security Logs
        </h2>

        <ul className="space-y-2">

          {logs.map((log, i) => (

            <li
              key={i}
              className="border p-3 rounded text-sm text-gray-700"
            >
              {log.message}
            </li>

          ))}

        </ul>

      </div>

    </div>
  )
}

export default AdminDashboard