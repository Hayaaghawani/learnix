import { motion } from "framer-motion"

function PrivacyPage() {
  return (
    <div className="min-h-screen relative bg-[#D6CEDC] overflow-hidden">

      {/* Diamond Background */}
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
            Privacy & Data Protection
          </h1>

          <div className="w-24 h-[2px] bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto rounded-full"></div>

          <p className="text-lg text-gray-700 leading-relaxed">
            Learnix is committed to protecting the privacy of its users. 
            As an educational platform designed for structured programming 
            learning, Learnix collects limited information required to 
            support personalized feedback, instructor supervision, and 
            academic integrity within the learning environment.
          </p>

          <p className="text-gray-700 leading-relaxed">
            Our privacy practices prioritize transparency, responsible data
            handling, and strict access control to ensure that student and
            instructor data remains protected throughout the learning process.
          </p>
        </motion.div>
      </section>



      {/* DATA COLLECTION */}
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
              What Information We Collect
            </h2>

            <p className="text-gray-700 leading-relaxed">
              Learnix stores only the information required to support
              educational workflows. This includes account information
              such as name, email address, and role (student or instructor).
            </p>

            <p className="text-gray-700 leading-relaxed">
              The platform also records learning interactions including
              code submissions, execution results, hint requests, and
              activity timestamps. These records help generate learning
              analytics and personalized reports that guide students
              toward improvement.
            </p>
          </div>

          <div className="text-[#5A4A73] text-xl italic">
            “Data should support learning — never exploit it.”
          </div>

        </motion.div>
      </section>



    {/* DATA USAGE */}
<section className="relative z-10 py-24 px-6">
  <motion.div
    initial={{ opacity: 0, y: 60 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 1 }}
    viewport={{ once: true }}
    className="max-w-5xl mx-auto space-y-16"
  >

    <h2 className="text-3xl font-semibold text-[#5A4A73] text-center">
      How Data Supports Learning
    </h2>

    <div className="space-y-10">

      <div className="flex items-start gap-6">
        <div className="w-10 h-10 rounded-full bg-[#8E7AAE] text-white flex items-center justify-center font-semibold">
          1
        </div>
        <p className="text-gray-700 leading-relaxed">
          When students interact with exercises, the system records key
          learning interactions such as code submissions, execution
          results, and AI hint requests.
        </p>
      </div>

      <div className="flex items-start gap-6">
        <div className="w-10 h-10 rounded-full bg-[#8E7AAE] text-white flex items-center justify-center font-semibold">
          2
        </div>
        <p className="text-gray-700 leading-relaxed">
          These interactions are analyzed to identify learning patterns,
          common misconceptions, and areas where students may struggle
          with programming concepts.
        </p>
      </div>

      <div className="flex items-start gap-6">
        <div className="w-10 h-10 rounded-full bg-[#8E7AAE] text-white flex items-center justify-center font-semibold">
          3
        </div>
        <p className="text-gray-700 leading-relaxed">
          The system then generates personalized learning reports and
          instructor analytics dashboards to support data-driven
          teaching and targeted student improvement.
        </p>
      </div>

    </div>

  </motion.div>
</section>


      {/* SECURITY SECTION */}
      <section className="relative z-10 py-24 px-6 bg-white/30">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto space-y-10"
        >

          <h2 className="text-3xl font-semibold text-[#5A4A73] text-center">
            Security & Responsible Data Use
          </h2>

          <p className="text-gray-700 leading-relaxed">
            Learnix implements security practices designed to protect user
            information and maintain system integrity. Data is stored in
            secure databases and protected through role-based access control,
            ensuring that only authorized instructors or administrators can
            view relevant analytics or reports.
          </p>

          <p className="text-gray-700 leading-relaxed">
            The platform limits AI access strictly to instructor-approved
            course materials. This ensures that generated hints remain aligned
            with official course content while preventing unsafe or unrelated
            responses.
          </p>

          <p className="text-gray-700 leading-relaxed">
            Our goal is to maintain a responsible AI learning environment where
            privacy, academic integrity, and student growth remain central
            priorities.
          </p>

        </motion.div>
      </section>

    </div>
  )
}

export default PrivacyPage