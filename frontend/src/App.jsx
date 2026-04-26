import { Routes, Route, Navigate } from "react-router-dom"

import Navbar from "./components/Navbar"

import Login from "./pages/Login"
import ForgotPassword from "./pages/ForgotPassword"
import ProfilePage from "./pages/ProfilePage"

import InstructorDashboard from "./pages/instructor/InstructorDashboard"
import StudentDashboard from "./pages/student/StudentDashboard"
import AdminDashboard from "./pages/admin/AdminDashboard"

import StudentCoursePage from "./pages/student/StudentCoursePage"
import StudentReport from "./pages/student/StudentReport"
import StudentNotifications from "./pages/student/StudentNotifications"
import JoinCourse from "./pages/student/JoinCourse"

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
import InstructorExerciseDetails from "./pages/instructor/exercise/InstructorExerciseDetails"

import InstructorHelpRequests from "./pages/instructor/InstructorHelpRequests"

import About from "./pages/AboutPage"
import Contact from "./pages/ContactPage"
import Privacy from "./pages/PrivacyPage"

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/course/:courseId" element={<StudentCoursePage />} />
        <Route path="/student/course/:courseId/report" element={<StudentReport />} />
        <Route path="/student/notifications" element={<StudentNotifications />} />
        <Route path="/join-course/:joinKey" element={<JoinCourse />} />

        <Route path="/instructor" element={<InstructorDashboard />} />
        <Route path="/instructor/create-course" element={<CreateCourse />} />
        <Route path="/instructor/notifications" element={<Notifications />} />
        <Route path="/instructor/exercise/create/:id" element={<CreateExercise />} />
        <Route path="/instructor/help-requests" element={<InstructorHelpRequests />} />

        <Route path="/instructor/course/:id/*" element={<CourseLayout />}>
          <Route index element={<Navigate to="exercises" />} />
          <Route path="exercises" element={<CourseExercises />} />
          <Route path="students" element={<CourseStudents />} />
          <Route path="material" element={<CourseMaterial />} />
          <Route path="ai" element={<AIModes />} />
          <Route path="analytics" element={<CourseAnalytics />} />
        </Route>

        <Route path="/exercise/:id/workspace" element={<ExerciseWorkspace />} />
        <Route path="/instructor/course/:courseId/exercise/:exerciseId" element={<InstructorExerciseDetails />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </>
  )
}

export default App