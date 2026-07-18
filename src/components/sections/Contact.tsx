"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "../ui/BrandIcons";

const Contact = () => {
  return (
    <section id="contact" className="py-20 px-6 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-6xl font-black mb-5 tracking-tighter leading-none">Get In Touch</h2>
        <p className="text-zinc-300 text-lg max-w-2xl mx-auto leading-relaxed text-balance">
          I&apos;m currently open to new opportunities and collaborations.
          Whether you have a project in mind or just want to say hi, feel free to reach out!
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-6"
      >
        <a
          href="mailto:dasanuvab38@gmail.com"
          className="flex items-center gap-4 p-4 rounded-xl glass-effect hover:border-zinc-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:-translate-y-1 transition-all group duration-300"
        >
          <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
            <Mail size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Email</p>
            <p className="text-lg font-medium select-all">dasanuvab38@gmail.com</p>
          </div>
        </a>

        <a
          href="https://www.linkedin.com/in/anv-dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 rounded-xl glass-effect hover:border-zinc-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:-translate-y-1 transition-all group duration-300"
        >
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
            <LinkedInIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400">LinkedIn</p>
            <p className="text-lg font-medium">linkedin.com/in/anv-dev</p>
          </div>
        </a>

        <a
          href="https://github.com/Hafikan"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4 rounded-xl glass-effect hover:border-zinc-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:-translate-y-1 transition-all group duration-300"
        >
          <div className="p-3 rounded-xl bg-gray-500/20 text-gray-400 group-hover:scale-110 transition-transform">
            <GitHubIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-400">GitHub</p>
            <p className="text-lg font-medium">github.com/Hafikan</p>
          </div>
        </a>
      </motion.div>
    </section>
  );
};

export default Contact;
