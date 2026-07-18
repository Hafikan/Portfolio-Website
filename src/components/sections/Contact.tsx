"use client";

import React from "react";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon, TwitterIcon } from "../ui/BrandIcons";
import { useSocials } from "@/hooks/useSocials";
import { socialDisplay } from "@/lib/socials";

const Contact = () => {
  const socials = useSocials();

  const items = [
    {
      key: "email",
      label: "Email",
      value: socials.email,
      href: socials.email ? `mailto:${socials.email}` : "",
      display: socials.email,
      external: false,
      icon: <Mail size={24} />,
      iconClass: "bg-blue-500/20 text-blue-400",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      value: socials.linkedin,
      href: socials.linkedin,
      display: socialDisplay(socials.linkedin),
      external: true,
      icon: <LinkedInIcon className="h-6 w-6" />,
      iconClass: "bg-purple-500/20 text-purple-400",
    },
    {
      key: "github",
      label: "GitHub",
      value: socials.github,
      href: socials.github,
      display: socialDisplay(socials.github),
      external: true,
      icon: <GitHubIcon className="h-6 w-6" />,
      iconClass: "bg-gray-500/20 text-gray-400",
    },
    {
      key: "twitter",
      label: "X / Twitter",
      value: socials.twitter,
      href: socials.twitter,
      display: socialDisplay(socials.twitter),
      external: true,
      icon: <TwitterIcon className="h-6 w-6" />,
      iconClass: "bg-sky-500/20 text-sky-400",
    },
  ].filter((item) => item.value);

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
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-6"
      >
        {items.map((item) => (
          <a
            key={item.key}
            href={item.href}
            {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="flex items-center gap-4 p-4 rounded-xl glass-effect hover:border-zinc-700 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:-translate-y-1 transition-all group duration-300"
          >
            <div className={`p-3 rounded-xl ${item.iconClass} group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <div>
              <p className="text-sm text-gray-400">{item.label}</p>
              <p className="text-lg font-medium select-all">{item.display}</p>
            </div>
          </a>
        ))}

        {items.length === 0 && (
          <p className="text-center text-zinc-500 text-sm">No contact links configured yet.</p>
        )}
      </motion.div>
    </section>
  );
};

export default Contact;
