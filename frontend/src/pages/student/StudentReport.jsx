import { useNavigate, useParams } from "react-router-dom";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

function StudentReport() {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const topicData = [
    { topic: "Loops", score: 80 },
    { topic: "Recursion", score: 60 },
    { topic: "Variables", score: 85 },
    { topic: "Logic", score: 75 },
    { topic: "Arrays", score: 70 },
    { topic: "Functions", score: 78 }
  ];

  const activityData = [
    { day: "Mon", submissions: 2, hints: 1 },
    { day: "Tue", submissions: 5, hints: 3 },
    { day: "Wed", submissions: 3, hints: 2 },
    { day: "Thu", submissions: 8, hints: 5 },
    { day: "Fri", submissions: 4, hints: 2 },
    { day: "Sat", submissions: 1, hints: 0 },
    { day: "Sun", submissions: 6, hints: 2 }
  ];

  const weakTopics = [
    { topic: "Recursion Base Cases", percent: 32 },
    { topic: "Nested Loops", percent: 45 }
  ];

  const misconceptions = [
    {
      title: "Loop Termination",
      description:
        "You often miss the update step in while loops, which can lead to infinite loops."
    }
  ];

  const independenceScore = 85;

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-[#6E5C86] text-white px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Learning Report</h1>

        <button
          onClick={() => navigate(`/student/course/${courseId}`)}
          className="bg-white text-[#6E5C86] px-4 py-2 rounded-lg font-medium"
        >
          Back to Course
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        <p className="text-gray-600 mb-8">
          Comprehensive analysis of your performance across this course.
        </p>

        {/* Top Charts */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">

          {/* Topic Mastery */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-semibold mb-4">Topic Mastery</h2>

            <RadarChart
              outerRadius={90}
              width={350}
              height={250}
              data={topicData}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="topic" />
              <PolarRadiusAxis />
              <Radar
                name="Mastery"
                dataKey="score"
                stroke="#6E5C86"
                fill="#6E5C86"
                fillOpacity={0.6}
              />
            </RadarChart>
          </div>


          {/* Activity & Hints */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-semibold mb-4">Activity & Hint Usage</h2>

            <LineChart width={400} height={250} data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />

              <Line
                type="monotone"
                dataKey="submissions"
                stroke="#3b82f6"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="hints"
                stroke="#f59e0b"
                strokeDasharray="5 5"
              />
            </LineChart>
          </div>

        </div>


        {/* Bottom Cards */}
        <div className="grid md:grid-cols-3 gap-8">

          {/* Needs Attention */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-semibold mb-4">Needs Attention</h2>

            {weakTopics.map((item, index) => (
              <div key={index} className="mb-4">

                <div className="flex justify-between text-sm mb-1">
                  <span>{item.topic}</span>
                  <span className="text-red-500">{item.percent}%</span>
                </div>

                <div className="w-full bg-gray-200 h-2 rounded-full">
                  <div
                    className="bg-red-400 h-2 rounded-full"
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>

              </div>
            ))}
          </div>


          {/* Misconceptions */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="font-semibold mb-4 text-red-500">
              Detected Misconceptions
            </h2>

            {misconceptions.map((m, index) => (
              <div
                key={index}
                className="border border-red-200 bg-red-50 p-4 rounded-lg"
              >
                <p className="font-semibold text-red-600">{m.title}</p>
                <p className="text-sm text-gray-700">{m.description}</p>
              </div>
            ))}
          </div>


          {/* Independence Score */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <h2 className="font-semibold mb-4">Independence Score</h2>

            <div className="w-32 h-32 mx-auto rounded-full border-8 border-[#6E5C86] flex items-center justify-center">
              <span className="text-2xl font-bold">{independenceScore}</span>
            </div>

            <p className="text-gray-600 mt-3">High</p>
          </div>

        </div>

      </div>

    </div>
  );
}

export default StudentReport;