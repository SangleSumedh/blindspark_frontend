"use client";

import { useState } from "react";
import "./landing.css";
import Link from "next/link";

const themes = [
  {
    name: "Sage",
    colors: {
      "--bg-main": "#F2F5F3",
      "--text-main": "#163D2B",
      "--text-muted": "#4e6e55",
      "--primary": "#163D2B",
      "--primary-fg": "#ffffff",
      "--border": "#c5ccbf",
      "--hover": "#e3e8e4",
      "--dot": "#c8a24e",
      "--image-bg": "#dbe2da"
    }
  },
  {
    name: "Neon",
    colors: {
      "--bg-main": "#050505",
      "--text-main": "#EDEDED",
      "--text-muted": "#A1A1A1",
      "--primary": "#CCFF00",
      "--primary-fg": "#000000",
      "--border": "#333333",
      "--hover": "#1A1A1A",
      "--dot": "#CCFF00",
      "--image-bg": "#1A1A1A"
    }
  }
];

export default function LandingPage() {
  const [currentTheme, setCurrentTheme] = useState(themes[0]);

  return (
    <div
      className="min-h-screen transition-colors duration-500 bg-[var(--bg-main)] text-[var(--text-main)]"
      style={currentTheme.colors}
    >

      {/* ───── Theme Switcher (Fixed) ───── */}
      <div className="fixed bottom-6 right-6 z-50 flex gap-2 bg-white/10 backdrop-blur-md p-2 rounded-full border border-[var(--border)] shadow-2xl">
        {themes.map((t) => (
          <button
            key={t.name}
            onClick={() => setCurrentTheme(t)}
            className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: t.colors["--bg-main"],
              borderColor: currentTheme.name === t.name ? t.colors["--primary"] : "transparent",
              boxShadow: currentTheme.name === t.name ? `0 0 10px ${t.colors["--text-main"]}40` : "none" // 40 is opacity hex
            }}
            title={t.name}
          >
            <span className="sr-only">{t.name}</span>
            <div className="w-full h-full rounded-full opacity-50 block" style={{ backgroundColor: t.colors["--primary"] }}></div>
          </button>
        ))}
      </div>

      {/* ───── Navbar ───── */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5">
        {/* Logo */}
        <Link href="/landing" className="flex items-center gap-2 no-underline group">
          <span className="font-bold text-xl tracking-tight transition-colors duration-300 text-[var(--text-main)]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            BlindSpark
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--dot)] inline-block transition-colors duration-300" />
        </Link>

        {/* Center Nav Links — inside a pill */}
        <div className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-full border border-[var(--border)] transition-colors duration-300">
          {["Solution", "Features", "About", "Contact"].map((item, i) => (
            <div key={item} className="flex items-center">
              <a href={`#${item.toLowerCase()}`}
                 className="text-[var(--text-main)] no-underline text-[0.8rem] font-medium px-3.5 py-1.5 rounded-full hover:bg-[var(--hover)] transition-colors duration-200">
                {item}
              </a>
              {i < 3 && <span className="text-[var(--border)] text-xs px-1">·</span>}
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Link href="/" className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] text-sm font-semibold no-underline hover:brightness-110 transition-all duration-300">
          Get Started
          <span className="w-5 h-5 rounded-full bg-[var(--primary-fg)]/20 flex items-center justify-center text-[10px]">↗</span>
        </Link>

        {/* Mobile hamburger */}
        <button className="md:hidden bg-transparent border-none text-[var(--text-main)] text-2xl cursor-pointer" aria-label="Menu">☰</button>
      </nav>

      {/* ───── Hero Section ───── */}
      <section className="flex flex-col items-center text-center px-6 pt-12 md:pt-20 pb-0">

        {/* Heading */}
        <h1 className="anim-up-1 text-[clamp(2.4rem,5.5vw,4rem)] font-bold leading-[1.15] mb-5 text-[var(--text-main)] max-w-[700px] transition-colors duration-300"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          A better way to meet people who get you
        </h1>

        {/* Subtitle */}
        <p className="anim-up-2 text-[0.95rem] leading-relaxed text-[var(--text-muted)] mb-8 max-w-[460px] transition-colors duration-300">
          BlindSpark connects you with real people through smart,
          interest-based matching — anonymous, safe, and instant.
        </p>

        {/* CTA Buttons */}
        <div className="anim-up-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[var(--primary)] text-[var(--primary-fg)] text-sm font-semibold no-underline hover:brightness-110 transition-all duration-300 shadow-lg shadow-[var(--primary)]/20">
            Get started
            <span className="w-5 h-5 rounded-full bg-[var(--primary-fg)]/20 flex items-center justify-center text-[10px]">↗</span>
          </Link>
          <a href="#how-it-works"
             className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-transparent text-[var(--text-main)] text-sm font-semibold no-underline border border-[var(--border)] hover:bg-[var(--hover)] transition-colors duration-300">
            See how it works
            <span className="w-5 h-5 rounded-full bg-[var(--text-main)] text-[var(--bg-main)] flex items-center justify-center text-[10px] pl-0.5">▶</span>
          </a>
        </div>

        {/* Image Placeholder — 85% width, only top half visible initially */}
        <div className="anim-up-3 mt-12 w-[85vw] mx-auto aspect-[16/10] rounded-2xl bg-[var(--image-bg)] border border-[var(--border)] overflow-hidden flex items-center justify-center transition-colors duration-300 shadow-xl shadow-[var(--primary)]/5 relative">
          <img
            src="/"
            alt="BlindSpark App Interface"
            className="w-full h-full object-cover"
          />
        </div>
      </section>
    </div>
  );
}
