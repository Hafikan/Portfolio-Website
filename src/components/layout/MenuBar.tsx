"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Command } from "lucide-react";
import MenuDropdown, { MenuItem } from "../ui/MenuDropdown";
import ToastContainer, { toast } from "../ui/Toast";
import { usePathname } from "next/navigation";
import { scrollToSection } from "@/lib/navigation";
import MusicPlayer from "./MusicPlayer";
import SystemTray from "./SystemTray";
import SpotlightSearch from "./SpotlightSearch";

export default function MenuBar() {
  const pathname = usePathname();
  const [time, setTime] = useState("");
  const [is24Hour, setIs24Hour] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  // Check auth status for Admin Portal
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/check");
        if (res.ok) {
          const data = await res.json();
          setIsAdmin(!!data.authenticated);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        setIsAdmin(false);
      }
    };
    checkAuth();
  }, [isSpotlightOpen]);

  // Time & date cycle
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: !is24Hour,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [is24Hour]);

  // Click outside menu handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuHover = (menu: string) => {
    if (activeMenu) {
      setActiveMenu(menu);
    }
  };

  const handleMenuClick = (menu: string) => {
    if (activeMenu === menu) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menu);
    }
  };

  // Clock format and full date action
  const handleClockClick = () => {
    setIs24Hour((prev) => !prev);
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    toast(`System Date: ${dateStr} (Switched format)`, "success");
  };

  const menuData: Record<string, MenuItem[]> = {
    cerbos: [
      { label: "About cerb os", action: () => { setActiveMenu(null); scrollToSection("about") } },
      { divider: true, label: "" },
      { label: "System Preferences...", disabled: true },
      { label: "App Store...", disabled: true },
      { divider: true, label: "" },
      { label: "Restart", action: () => { window.location.reload(); } },
      { label: "Shut Down", disabled: true },
    ],
    File: [
      { label: "New Window", shortcut: "⌘N", action: () => { window.open(window.location.href, "_blank"); setActiveMenu(null); } },
      { divider: true, label: "" },
      { label: "Print...", shortcut: "⌘P", action: () => { window.print(); setActiveMenu(null); } },
      { label: "Close Window", shortcut: "⌘W", action: () => { toast("Cannot close main window.", "info"); setActiveMenu(null); } },
    ],
    Edit: [
      { label: "Undo", shortcut: "⌘Z", action: () => { toast("Undo", "info"); setActiveMenu(null); } },
      { label: "Redo", shortcut: "⇧⌘Z", action: () => { toast("Redo", "info"); setActiveMenu(null); } },
      { divider: true, label: "" },
      { label: "Cut", shortcut: "⌘X", action: () => { toast("Cut", "info"); setActiveMenu(null); } },
      { label: "Copy", shortcut: "⌘C", action: () => { toast("Copy", "info"); setActiveMenu(null); } },
      { label: "Paste", shortcut: "⌘V", action: () => { toast("Paste", "info"); setActiveMenu(null); } },
      { label: "Select All", shortcut: "⌘A", action: () => { toast("Select All", "info"); setActiveMenu(null); } },
    ],
    View: [
      { label: "Reload", shortcut: "⌘R", action: () => { window.location.reload(); } },
      {
        label: "Toggle Fullscreen", shortcut: "⌃⌘F", action: () => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          setActiveMenu(null);
        }
      },
    ],
  };

  if (pathname === "/projects" || pathname.startsWith("/admin")) return null;

  return (
    <>
      <ToastContainer />
      <motion.div
        ref={menuRef}
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="fixed top-0 inset-x-0 h-10 md:h-7 z-50 flex items-center justify-between px-6 md:px-4 bg-transparent md:bg-zinc-900/60 md:backdrop-blur-xl border-b-0 md:border-b border-white/10 text-[14px] md:text-[13px] font-medium text-white/90 select-none shadow-sm"
      >
        {/* Desktop Left side */}
        <div className="hidden md:flex items-center gap-5">
          <div className="relative" id="tour-cerbos">
            <div
              onClick={() => handleMenuClick("cerbos")}
              onMouseEnter={() => handleMenuHover("cerbos")}
              className={`flex items-center gap-2 px-2 py-0.5 rounded cursor-pointer transition-colors ${activeMenu === "cerbos" ? "bg-white/20" : "hover:bg-white/10"}`}
            >
              <Command className="w-3.5 h-3.5" />
              <span className="font-bold tracking-tight">cerb os</span>
            </div>
            <MenuDropdown isOpen={activeMenu === "cerbos"} items={menuData["cerbos"]} />
          </div>

          <div className="hidden md:flex items-center gap-1 text-white/80">
            {["File", "Edit", "View"].map((menu) => (
              <div key={menu} className="relative">
                <div
                  onClick={() => handleMenuClick(menu)}
                  onMouseEnter={() => handleMenuHover(menu)}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${activeMenu === menu ? "bg-white/20 text-white" : "hover:bg-white/10 hover:text-white"}`}
                >
                  {menu}
                </div>
                <MenuDropdown isOpen={activeMenu === menu} items={menuData[menu]} />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Left side (iOS Time) */}
        <div className="flex md:hidden items-center">
          <span className="font-semibold cursor-pointer" onClick={handleClockClick}>
            {time ? time.split(" ")[0] : "10:00"}
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 md:text-white/80">
          <div className="flex items-center gap-2 md:gap-3">
            <MusicPlayer />
            <SystemTray 
              setIsSpotlightOpen={setIsSpotlightOpen} 
            />
          </div>

          {/* ⏰ Clock Trigger */}
          <span
            className="hidden md:block text-white/90 cursor-pointer hover:text-white active:scale-95 transition-transform"
            onClick={handleClockClick}
            title="Toggle 24-hour clock / Show Date"
          >
            {time || "10:00 AM"}
          </span>
        </div>
      </motion.div>

      {/* 🔍 SPOTLIGHT SEARCH OVERLAY */}
      <SpotlightSearch 
        isSpotlightOpen={isSpotlightOpen} 
        setIsSpotlightOpen={setIsSpotlightOpen} 
        isAdmin={isAdmin} 
      />
    </>
  );
}
