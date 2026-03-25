import { useState } from "react"
import { motion } from "framer-motion"
function ContactPage() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-28 bg-[#EEEAF4]">

      <div className="bg-white shadow-xl rounded-2xl p-10 w-[420px]">

        <h1 className="text-3xl font-semibold text-center mb-2">
          Contact Us
        </h1>

        <p className="text-gray-500 text-center mb-8">
          We'd love to hear from you.
        </p>

        <form className="flex flex-col gap-4">

          <input
            type="text"
            placeholder="Your Name"
            className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8E7AAE]"
          />

          <input
            type="email"
            placeholder="Email"
            className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8E7AAE]"
          />

          <textarea
            placeholder="Message"
            rows="4"
            className="border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8E7AAE]"
          />

          <button
            type="submit"
            className="mt-3 bg-[#8E7AAE] text-white py-3 rounded-lg hover:opacity-90 transition"
          >
            Send Message
          </button>

        </form>

      </div>

    </div>
  )
}

export default ContactPage