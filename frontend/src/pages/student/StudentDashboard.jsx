import { useState } from "react";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const navigate = useNavigate();

  const [courses] = useState([
    {
      id: 1,
      name: "Database Systems",
      instructor: "Dr. Ahmad",
      progress: 60
    },
    {
      id: 2,
      name: "Operating Systems",
      instructor: "Dr. Lina",
      progress: 30
    }
  ]);

  const deadlines = [
    { id: 1, title: "Database Assignment 2", date: "March 18" },
    { id: 2, title: "OS Quiz", date: "March 20" }
  ];

  const announcements = [
    "Database Systems – Assignment 2 uploaded",
    "Operating Systems – Midterm date announced"
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <div className="w-full bg-[#6E5C86] text-white px-8 py-4 flex justify-between items-center">
<h1 className="text-xl italic text-purple-50 font-semibold">Student Dashboard</h1>
        <div className="flex gap-6">
          <button 
            onClick={() => navigate("/student/notifications")}
            className="hover:text-gray-200 transition"
          >
            Notifications
          </button>
          <button className="hover:text-gray-200">Profile</button>
          <button className="hover:text-gray-200">Logout</button>
        </div>
      </div>


      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Welcome */}
        <h2 className="text-2xl font-semibold mb-6">
          Welcome back 👋
        </h2>


        {/* Quick Join Course */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Join a Course</h3>

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Paste enrollment link..."
              className="flex-1 border rounded-lg px-4 py-2"
            />

            <button className="bg-[#6E5C86] text-white px-5 py-2 rounded-lg hover:bg-[#5a4a70]">
              Join
            </button>
          </div>
        </div>


        {/* Upcoming Deadlines */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>

          {deadlines.map((item) => (
            <div
              key={item.id}
              className="flex justify-between border-b py-2 last:border-none"
            >
              <span>{item.title}</span>
              <span className="text-red-500 font-medium">{item.date}</span>
            </div>
          ))}
        </div>


        {/* My Courses */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">My Courses</h3>

          <div className="grid md:grid-cols-2 gap-6">

            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <h4 className="text-lg font-semibold">{course.name}</h4>
                <p className="text-gray-600 mb-4">
                  Instructor: {course.instructor}
                </p>

                {/* Progress */}
                <div className="mb-2 text-sm text-gray-600">
                  Progress
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-[#6E5C86] h-2 rounded-full"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>

                <button
 onClick={() => navigate(`/student/course/${course.id}`)}
 className="bg-[#6E5C86] text-white px-4 py-2 rounded-lg"
>
Open Course
</button>
              </div>
            ))}

          </div>
        </div>


        {/* Announcements */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            Recent Announcements
          </h3>

          {announcements.map((announcement, index) => (
            <p key={index} className="border-b py-2 last:border-none">
              {announcement}
            </p>
          ))}
        </div>

      </div>
    </div>
  );
}

export default StudentDashboard;