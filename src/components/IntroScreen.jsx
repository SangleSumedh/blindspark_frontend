"use client";
import React, { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import fireAnimationData from '../animations/fire.json';
import styles from './intro.module.css';

export default function IntroScreen({ onEnter }) {
  const [fireVisible, setFireVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [glowVisible, setGlowVisible] = useState(false);
  const [ctaVisible,  setCtaVisible]  = useState(false);
  const [tagVisible,  setTagVisible]  = useState(false);
  const [firePos,     setFirePos]     = useState(null);

  // explosion
  const [fireSize,    setFireSize]    = useState({ w: 60, h: 60 });
  const [fireOffset,  setFireOffset]  = useState({ x: 0, y: 0 });
  const [orangeFlood, setOrangeFlood] = useState(false);
  const [blackFlood,  setBlackFlood]  = useState(false);

  const containerRef = useRef(null);
  const iRef         = useRef(null);

  const measureI = () => {
    if (!iRef.current || !containerRef.current) return;
    const iRect = iRef.current.getBoundingClientRect();
    const cRect = containerRef.current.getBoundingClientRect();
    const cx     = iRect.left + iRect.width  / 2 - cRect.left;
    const topOfI = iRect.top  - cRect.top;
    setFirePos({ left: cx - 30 - 6, top: topOfI - 60 });
  };

  useEffect(() => {
    // Initial delay to allow fonts to load and render
    const t0 = setTimeout(measureI, 100);
    window.addEventListener('resize', measureI);
    const t1 = setTimeout(() => { setFireVisible(true); setGlowVisible(true); }, 2000);
    const t2 = setTimeout(() => setTextVisible(true), 2700);
    const t3 = setTimeout(() => setTagVisible(true),  4200);
    const t4 = setTimeout(() => setCtaVisible(true),  5000);
    return () => {
      clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      window.removeEventListener('resize', measureI);
    };
  }, []);

  const handleEnter = () => {
    if (!firePos || !containerRef.current) return;

    const cRect  = containerRef.current.getBoundingClientRect();
    const screenW = cRect.width;
    const screenH = cRect.height;

    const fireCX = firePos.left + 30;
    const fireCY = firePos.top  + 30;
    const maxDim = Math.max(screenW, screenH) * 2.8;

    setFireSize({ w: maxDim, h: maxDim });
    setFireOffset({
      x: fireCX - maxDim / 2,
      y: fireCY - maxDim / 2,
    });

    setTimeout(() => setOrangeFlood(true), 900);
    setTimeout(() => setBlackFlood(true), 1600);
    setTimeout(() => onEnter(), 2400);
  };

  const fireStyle = fireOffset.x !== 0
    ? { left: fireOffset.x, top: fireOffset.y }
    : firePos
      ? { left: firePos.left, top: firePos.top }
      : {};

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center relative overflow-hidden" ref={containerRef}>
      <div className={styles.noiseOverlay} />
      
      <div className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-500 ease-in-out ${orangeFlood ? 'opacity-100' : 'opacity-0'} ${blackFlood ? 'bg-black !opacity-100 duration-700' : 'bg-[#ff5500]'}`} />

      {firePos && (
        <div
          className={`absolute w-[520px] h-[520px] rounded-full pointer-events-none z-[2] transition-opacity duration-[1400ms] ease-in-out -translate-x-1/2 -translate-y-1/2 ${glowVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            left: firePos.left + 30, top: firePos.top + 30,
            background: 'radial-gradient(circle, rgba(255, 90, 0, 0.14) 0%, rgba(255, 40, 0, 0.06) 40%, transparent 70%)'
          }}
        />
      )}

      <div className="relative z-[3]">
        <span className={`font-inter text-[clamp(64px,11vw,128px)] tracking-[0.1em] text-white leading-none relative select-none whitespace-nowrap transition-all duration-[1300ms] ease-[cubic-bezier(0.16,1,0.3,1)] inline-block ${textVisible ? 'opacity-100 scale-100 translate-y-0 drop-shadow-[0_0_60px_rgba(255,100,0,0.28)]' : 'opacity-0 scale-95 translate-y-[6px]'}`} >
          BL
          <span className="inline-block relative" ref={iRef}>I</span>
          NDSPARK
        </span>
      </div>

      {firePos && (
        <div
          className={`absolute z-10 pointer-events-none transition-opacity duration-600 ease-in-out ${fireVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{
            ...fireStyle,
            width:  fireSize.w,
            height: fireSize.h,
            transition: fireSize.w > 60
              ? 'width 1s cubic-bezier(0.4, 0, 0.2, 1), height 1s cubic-bezier(0.4, 0, 0.2, 1), left 1s cubic-bezier(0.4, 0, 0.2, 1), top 1s cubic-bezier(0.4, 0, 0.2, 1)'
              : 'none',
          }}
        >
          <Lottie
            animationData={fireAnimationData}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      )}

      <p className={`absolute bottom-[calc(50%-90px)] left-1/2 -translate-x-1/2 font-rajdhani text-[clamp(10px,1.1vw,13px)] font-light tracking-[0.5em] text-white/30 uppercase whitespace-nowrap z-[4] transition-opacity duration-[1400ms] ease-in-out ${tagVisible ? 'opacity-100' : 'opacity-0'}`}>
        Ignite your edge
      </p>

      <div className={`absolute bottom-[52px] left-1/2 -translate-x-1/2 z-[6] flex flex-col items-center gap-[14px] transition-opacity duration-[900ms] ease-in-out ${ctaVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className={styles.pulseLine} />
        <button className={`${styles.enterBtn} font-rajdhani text-[12px] font-semibold tracking-[0.45em] uppercase text-white/80 bg-transparent border border-[rgba(255,100,0,0.45)] px-[44px] py-[13px] cursor-pointer relative overflow-hidden transition-all duration-300 ease-in-out hover:border-[rgba(255,140,0,0.85)] hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,100,0,0.55)]`} onClick={handleEnter}>
          Enter
        </button>
      </div>
    </div>
  );
}
