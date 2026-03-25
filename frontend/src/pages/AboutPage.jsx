import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"

function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen relative bg-[#D6CEDC] overflow-hidden">

      {/* Subtle Diamond Background */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <svg width="100%" height="100%">
          <pattern id="diamondBg" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect
              x="20"
              y="20"
              width="8"
              height="8"
              transform="rotate(45 24 24)"
              fill="#3e2764"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#diamondBg)" />
        </svg>
      </div>

      

      {/* HERO SECTION */}
      <section className="relative z-10 py-28 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <h1 className="text-5xl font-luxury tracking-wide">
            About Learnix
          </h1>

          <div className="w-24 h-[2px] bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto rounded-full"></div>

          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
  Learnix is a structured AI-guided learning platform designed to support 
  foundational programming education within academically rigorous environments. 
  Our platform integrates intelligent assistance directly into the learning process 
  while preserving the principles of independent problem-solving, instructor oversight, 
  and institutional integrity.
</p>
<p className="text-gray-700 text-base leading-relaxed max-w-3xl mx-auto">
  Designed with both educators and students in mind, Learnix bridges the 
  evolving intersection between artificial intelligence and formal instruction. 
  The platform provides scalable, ethically grounded AI support tailored 
  specifically for early-stage computer science education.
</p>
        </motion.div>
      </section>



      {/* MISSION SECTION */}
      <section className="relative z-10 py-24 px-6 bg-white/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center"
        >
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-[#5A4A73]">
              Our Mission
            </h2>

            <p className="text-gray-700 leading-relaxed">
  Our mission is to redefine the role of artificial intelligence in education. 
  Rather than positioning AI as a source of immediate answers, Learnix is built 
  to function as a guided instructional assistant. The system encourages 
  reflective thinking, progressive hint delivery, and instructor-configurable 
  boundaries that align with course objectives.
  
  By combining AI capabilities with pedagogical structure, Learnix promotes 
  deeper conceptual understanding while maintaining transparency, fairness, 
  and accountability within the learning environment.
</p>
          </div>

          <div className="text-[#5A4A73] text-xl italic">
            “AI should guide the learner — not replace the learner.”
          </div>
        </motion.div>
      </section>

      {/* VALUES SECTION */}
      <section className="relative z-10 py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto text-center space-y-16"
        >
          <h2 className="text-3xl font-semibold text-[#5A4A73]">
            Core Principles
          </h2>

          <div className="grid md:grid-cols-4 gap-10">

            {[
              "Ethical AI Integration",
              "Instructor Empowerment",
              "Structured Learning Paths",
              "Transparency & Accountability"
            ].map((value, index) => (
              <div
                key={index}
                className="bg-white/60 backdrop-blur-md p-8 rounded-xl shadow-md border border-white/40"
              >
                <p className="font-medium text-[#5A4A73]">
                  {value}
                </p>
              </div>
            ))}

          </div>
        </motion.div>
      </section>
      {/* RESEARCH & EDUCATIONAL PHILOSOPHY */}
<section className="relative z-10 py-24 px-6 bg-white/30">
  <motion.div
    initial={{ opacity: 0, y: 60 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    viewport={{ once: true }}
    className="max-w-5xl mx-auto space-y-10"
  >
    <h2 className="text-3xl font-semibold text-[#5A4A73] text-center">
      Research & Educational Philosophy
    </h2>

    <p className="text-gray-700 leading-relaxed">
      Learnix is informed by established research in computer science education,
      cognitive development, and instructional scaffolding. Studies consistently
      demonstrate that novice programmers benefit most from guided support that
      encourages problem decomposition, incremental reasoning, and reflective learning.
    </p>

    <p className="text-gray-700 leading-relaxed">
      Rather than delivering direct solutions, Learnix applies structured hinting,
      misconception detection, and progressive assistance aligned with course
      materials defined by instructors. This approach mirrors effective teaching
      assistant interactions while maintaining consistency, scalability, and
      measurable engagement metrics.
    </p>

    <p className="text-gray-700 leading-relaxed">
      Our philosophy centers on balancing technological innovation with pedagogical
      responsibility. Artificial intelligence, when integrated thoughtfully,
      should enhance cognitive development — not diminish it. Learnix is built
      to ensure that AI remains a tool for empowerment, not dependency.
    </p>
  </motion.div>
</section>
 {/* TEAM SECTION */}
      <section className="py-20 px-6 bg-white/30">
        <div className="max-w-5xl mx-auto text-center space-y-10">

          <h2 className="text-3xl font-semibold text-[#5A4A73]">
            The Team Behind Learnix
          </h2>

          <div className="flex flex-col md:flex-row justify-center gap-12 text-gray-700 text-lg">
            <span>Tala Abu Mohammed</span>
            <span>Haya Alaghawani</span>
            <span>Hala Al Sallal</span>
          </div>

        </div>
      </section>
    </div>
  )
}

export default AboutPage