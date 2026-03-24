import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function StudentCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("exercises");

  // Temporary mock data (later this will come from backend)
  const course = {
    id: courseId,
    name: "Database Systems",
    description:
      "This course introduces database design, SQL queries, normalization, and relational models."
  };

  const exercises = [
    {
      id: 1,
      title: "SQL Queries Practice",
      due: "March 18"
    },
    {
      id: 2,
      title: "Normalization Exercise",
      due: "March 22"
    }
  ];

  const materials = [
    {
      id: 1,
      title: "Lecture 1 Slides",
      type: "PDF"
    },
    {
      id: 2,
      title: "Database Design Video",
      type: "Video"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <div className="w-full bg-[#6E5C86] text-white px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">{course.name}</h1>

        <button
          onClick={() => navigate(`/student/course/${courseId}/report`)}
          className="bg-white text-[#6E5C86] px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
        >
          View My Report
        </button>
      </div>


      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Course Description */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-2">Course Description</h2>
          <p className="text-gray-600">{course.description}</p>
        </div>


        {/* Tabs */}
        <div className="flex gap-4 mb-6">

          <button
            onClick={() => setActiveTab("exercises")}
            className={`px-5 py-2 rounded-lg font-medium ${
              activeTab === "exercises"
                ? "bg-[#6E5C86] text-white"
                : "bg-white shadow"
            }`}
          >
            Exercises
          </button>

          <button
            onClick={() => setActiveTab("materials")}
            className={`px-5 py-2 rounded-lg font-medium ${
              activeTab === "materials"
                ? "bg-[#6E5C86] text-white"
                : "bg-white shadow"
            }`}
          >
            Materials
          </button>

        </div>


        {/* Content Area */}

        {activeTab === "exercises" && (
          <div className="grid md:grid-cols-2 gap-6">

            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <h3 className="font-semibold text-lg">{exercise.title}</h3>

                <p className="text-gray-600 mb-4">
                  Due: {exercise.due}
                </p>


<button
  onClick={() => navigate(`/exercise/${exercise.id}/workspace`)}
  className="bg-[#6E5C86] text-white px-4 py-2 rounded-lg hover:bg-[#5a4a70]"
>
  Open Exercise
</button>
              </div>
            ))}

          </div>
        )}


        {activeTab === "materials" && (
          <div className="grid md:grid-cols-2 gap-6">

            {materials.map((material) => (
              <div
                key={material.id}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <h3 className="font-semibold text-lg">{material.title}</h3>

                <p className="text-gray-600 mb-4">
                  Type: {material.type}
                </p>

                <button className="bg-[#6E5C86] text-white px-4 py-2 rounded-lg hover:bg-[#5a4a70]">
                  View Material
                </button>
              </div>
            ))}

          </div>
        )}

      </div>
    </div>
  );
}

export default StudentCoursePage;