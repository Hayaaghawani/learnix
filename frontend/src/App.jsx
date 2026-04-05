import { Routes, Route, Navigate } from "react-router-dom"

import Navbar from "./components/Navbar"

import Login from "./pages/Login"

import InstructorDashboard from "./pages/instructor/InstructorDashboard"
import StudentDashboard from "./pages/student/StudentDashboard"
import AdminDashboard from "./pages/admin/AdminDashboard"

import StudentCoursePage from "./pages/student/StudentCoursePage"
import StudentReport from "./pages/student/StudentReport"

import CreateCourse from "./pages/instructor/CreateCourse"
import CreateExercise from "./pages/instructor/exercise/CreateExercise"
import Notifications from "./pages/instructor/Notifications"

import CourseLayout from "./pages/instructor/course/CourseLayout"
import CourseExercises from "./pages/instructor/course/CourseExercises"
import CourseStudents from "./pages/instructor/course/CourseStudents"
import CourseMaterial from "./pages/instructor/course/CourseMaterial"
import CourseAnalytics from "./pages/instructor/course/CourseAnalytics"
import AIModes from "./pages/instructor/course/AIModes"
import ExerciseWorkspace from "./pages/instructor/exercise/ExerciseWorkspace"

import About from "./pages/AboutPage"
import Contact from "./pages/ContactPage"
import Privacy from "./pages/PrivacyPage"




function App() {
  return (
    <>
      <Navbar />

      <Routes>

        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Student */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/course/:courseId" element={<StudentCoursePage />} />
        <Route path="/student/course/:courseId/report" element={<StudentReport />} />

        {/* Instructor Dashboard */}
        <Route path="/instructor" element={<InstructorDashboard />} />
        <Route path="/instructor/create-course" element={<CreateCourse />} />
        <Route path="/instructor/notifications" element={<Notifications />} />

        {/* Create Exercise Page */}
        <Route path="/instructor/exercise/create/:id" element={<CreateExercise />} />

        {/* Course Workspace with Sidebar */}


          {/* Default page */}
         <Route path="/instructor/course/:id/*" element={<CourseLayout />}>

  <Route index element={<Navigate to="exercises" />} />

  <Route path="exercises" element={<CourseExercises />} />
  <Route path="students" element={<CourseStudents />} />
  <Route path="material" element={<CourseMaterial />} />
  <Route path="ai" element={<AIModes />} />
  <Route path="analytics" element={<CourseAnalytics />} />

</Route>

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Static Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />

<Route path="/exercise/:id/workspace" element={<ExerciseWorkspace />} />
      </Routes>
    </>
  )
}

export default App