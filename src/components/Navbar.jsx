"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
import NavLogo from "@/components/NavLogo";
import {
  Zap,
  MessageSquare,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";

export default function Navbar({ status, peerDisconnected }) {
  const { user, userProfile, logout } = useAuth();
  const { totalUnread } = useChat(user?.uid);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!userProfile) return null;

  return (
    <header className="relative z-30 w-full border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/">
            <NavLogo />
          </Link>
          {/* Only show status indicator if status prop is provided (home page) */}
          {status !== undefined && (
            <>
              <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />
              <div className="flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full transition-all duration-500 shadow-sm ${
                    peerDisconnected
                      ? "bg-red-500 shadow-[0_0_8px_#ef4444]"
                      : status === "matched"
                      ? "bg-green-500 shadow-[0_0_8px_#22c55e]"
                      : status === "searching" || status === "connecting"
                      ? "bg-yellow-500 shadow-[0_0_8px_#eab308] animate-pulse"
                      : "bg-yellow-500/50 shadow-[0_0_4px_#eab30855]"
                  }`}
                />
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold hidden sm:inline">
                  {peerDisconnected
                    ? "Peer Disconnected"
                    : status === "matched"
                    ? "Live"
                    : status === "searching"
                    ? "Searching"
                    : status === "connecting"
                    ? "Connecting"
                    : "Standby"}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {/* Karma Focus */}
          <div className="flex items-center gap-2 bg-orange-500/5 border border-orange-500/10 px-3 py-1.5 rounded-lg">
            <Zap size={14} className="text-orange-500" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">
                Karma
              </span>
              <span className="text-sm font-black text-orange-400 tracking-tight">
                {userProfile.karma}
              </span>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-white/5 hidden md:block" />

          <Link
            href="/chat"
            className="relative text-zinc-400 hover:text-orange-400 transition-colors"
          >
            <MessageSquare size={22} />
            {totalUnread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-zinc-950">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </Link>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="flex items-center gap-2 group p-0.5 rounded-full hover:bg-white/5 transition-all"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-xs shadow-lg group-hover:scale-105 transition-transform border-2 border-zinc-900 overflow-hidden">
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(userProfile.displayName)
                )}
              </div>
              <ChevronDown
                size={14}
                className={`text-zinc-500 transition-transform duration-300 ${
                  isUserDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isUserDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl overflow-hidden z-50 animate-fade-in-up border-white/5 shadow-2xl">
                  <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                    <p className="text-sm font-bold text-white truncate">
                      {userProfile.displayName}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate uppercase tracking-widest mt-0.5">
                      {user?.email}
                    </p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/profile"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <User size={16} />
                      Profile
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <Settings size={16} />
                      Settings
                    </Link>
                    <div className="h-[1px] bg-white/5 my-1 mx-2" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
