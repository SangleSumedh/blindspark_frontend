"use client";
import React, { useState } from 'react';
import styles from './auth.module.css';

export default function AuthForm({ onLogin, onSignup, onGoogleLogin, error, loading }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Signup form state
  const [signupData, setSignupData] = useState({ username: '', email: '', password: '' });

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    onLogin(loginData.email, loginData.password);
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    onSignup(signupData.email, signupData.password);
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <div className={styles.noiseOverlay} />
      {/* ambient glow top-center */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none z-0" style={{ background: 'radial-gradient(circle, rgba(255, 80, 0, 0.1) 0%, transparent 70%)' }}></div>

      <div className={`${styles.loginCard} relative z-[2] w-full max-w-[420px] px-[48px] pt-[52px] pb-[44px] border border-white/10 bg-white/[0.02] backdrop-blur-[12px]`}>

        {/* Logo */}
        <div className="font-bebas text-[36px] tracking-[0.12em] text-white text-center mb-[6px] drop-shadow-[0_0_40px_rgba(255,90,0,0.35)]">
          BL<span className="text-[#ff6a00]">I</span>NDSPARK
        </div>
        <p className="font-rajdhani text-[11px] font-light tracking-[0.4em] text-white/25 uppercase text-center mb-[40px]">Ignite your edge</p>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-[32px]">
          <button
            className={`${styles.tabBtn} ${activeTab === 'login' ? `${styles.tabBtnActive} text-white` : 'text-white/30'} flex-1 bg-transparent border-none py-[10px] font-rajdhani text-[12px] font-semibold tracking-[0.35em] uppercase cursor-pointer relative transition-colors duration-300`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'signup' ? `${styles.tabBtnActive} text-white` : 'text-white/30'} flex-1 bg-transparent border-none py-[10px] font-rajdhani text-[12px] font-semibold tracking-[0.35em] uppercase cursor-pointer relative transition-colors duration-300`}
            onClick={() => setActiveTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 mb-4 rounded-sm text-sm font-rajdhani font-semibold text-center tracking-widest">
            {error}
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {activeTab === 'login' && (
          <form className="flex flex-col gap-[16px]" onSubmit={handleLoginSubmit}>

            <div className="flex flex-col gap-[7px]">
              <label className="font-rajdhani text-[10px] font-semibold tracking-[0.35em] uppercase text-white/35">Email</label>
              <input
                type="email"
                required
                placeholder="your@email.com"
                className="bg-white/5 border border-white/10 px-[16px] py-[12px] font-rajdhani text-[14px] font-normal text-white outline-none transition-all duration-300 w-full placeholder:text-white/20 focus:border-[#ff6a00]/50 focus:bg-white/10"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-[7px]">
              <label className="font-rajdhani text-[10px] font-semibold tracking-[0.35em] uppercase text-white/35">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="bg-white/5 border border-white/10 px-[16px] py-[12px] font-rajdhani text-[14px] font-normal text-white outline-none transition-all duration-300 w-full placeholder:text-white/20 focus:border-[#ff6a00]/50 focus:bg-white/10"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className={`${styles.loginSubmit} mt-[8px] w-full p-[14px] bg-transparent border border-[#ff6a00]/50 font-rajdhani text-[12px] font-semibold tracking-[0.45em] uppercase text-white/85 cursor-pointer relative overflow-hidden transition-all duration-300 hover:border-[#ff8c00]/90 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,100,0,0.55)]`}>
              {loading ? "Processing..." : "Enter"}
            </button>

            <div className={`${styles.loginDivider} flex items-center gap-[14px] my-[4px]`}><span className="font-rajdhani text-[10px] tracking-[0.2em] text-white/20 uppercase">or</span></div>

            <button type="button" disabled={loading} className="w-full p-[13px] bg-transparent border border-white/10 flex items-center justify-center gap-[10px] font-rajdhani text-[12px] font-semibold tracking-[0.25em] uppercase text-white/50 cursor-pointer transition-all duration-300 hover:border-white/25 hover:text-white/80" onClick={onGoogleLogin}>
              {/* Google SVG icon */}
              <svg className="w-[16px] h-[16px] shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

          </form>
        )}

        {/* ── SIGNUP FORM ── */}
        {activeTab === 'signup' && (
          <form className="flex flex-col gap-[16px]" onSubmit={handleSignupSubmit}>

            <div className="flex flex-col gap-[7px]">
              <label className="font-rajdhani text-[10px] font-semibold tracking-[0.35em] uppercase text-white/35">Email</label>
              <input
                type="email"
                required
                placeholder="your@email.com"
                className="bg-white/5 border border-white/10 px-[16px] py-[12px] font-rajdhani text-[14px] font-normal text-white outline-none transition-all duration-300 w-full placeholder:text-white/20 focus:border-[#ff6a00]/50 focus:bg-white/10"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-[7px]">
              <label className="font-rajdhani text-[10px] font-semibold tracking-[0.35em] uppercase text-white/35">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="bg-white/5 border border-white/10 px-[16px] py-[12px] font-rajdhani text-[14px] font-normal text-white outline-none transition-all duration-300 w-full placeholder:text-white/20 focus:border-[#ff6a00]/50 focus:bg-white/10"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={loading} className={`${styles.loginSubmit} mt-[8px] w-full p-[14px] bg-transparent border border-[#ff6a00]/50 font-rajdhani text-[12px] font-semibold tracking-[0.45em] uppercase text-white/85 cursor-pointer relative overflow-hidden transition-all duration-300 hover:border-[#ff8c00]/90 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,100,0,0.55)]`}>
              {loading ? "Processing..." : "Create Account"}
            </button>

            <div className={`${styles.loginDivider} flex items-center gap-[14px] my-[4px]`}><span className="font-rajdhani text-[10px] tracking-[0.2em] text-white/20 uppercase">or</span></div>

            <button type="button" disabled={loading} className="w-full p-[13px] bg-transparent border border-white/10 flex items-center justify-center gap-[10px] font-rajdhani text-[12px] font-semibold tracking-[0.25em] uppercase text-white/50 cursor-pointer transition-all duration-300 hover:border-white/25 hover:text-white/80" onClick={onGoogleLogin}>
              <svg className="w-[16px] h-[16px] shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

          </form>
        )}

      </div>
    </div>
  );
}
