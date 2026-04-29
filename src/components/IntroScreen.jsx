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
    setFirePos({ left: cx - 30 - 17, top: topOfI - 60 });
  };

  useEffect(() => {
    // Initial delay to allow fonts to load and render
    const t0 = setTimeout(measureI, 100);
    window.addEventListener('resize', measureI);
    const t1 = setTimeout(() => setFireVisible(true), 600);
    const t1b = setTimeout(() => setGlowVisible(true), 1000);
    const t2 = setTimeout(() => setTextVisible(true), 1400);
    const t3 = setTimeout(() => setTagVisible(true),  3000);
    const t4 = setTimeout(() => setCtaVisible(true),  3800);
    return () => {
      clearTimeout(t0); clearTimeout(t1); clearTimeout(t1b); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
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
      
      {/* Flood overlay — uses CSS class for smooth transition */}
      <div
        className={`${styles.floodOverlay} fixed inset-0 z-50 pointer-events-none ${orangeFlood ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundColor: blackFlood ? '#000' : '#ff5500' }}
      />

      {/* Ambient glow orb */}
      {firePos && (
        <div
          className={`absolute w-[520px] h-[520px] rounded-full pointer-events-none z-[2] ${styles.glowOrb} ${glowVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            left: firePos.left + 30, top: firePos.top + 30,
            marginLeft: -260, marginTop: -260,
            background: 'radial-gradient(circle, rgba(255, 90, 0, 0.14) 0%, rgba(255, 40, 0, 0.06) 40%, transparent 70%)',
            transition: 'opacity 1.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}

      {/* Title text */}
      <div className="relative z-[3]">
        <span
          className={`font-inter text-[clamp(64px,11vw,128px)] tracking-[0.1em] text-white leading-none relative select-none whitespace-nowrap inline-block`}
          style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(8px)',
            filter: textVisible ? 'drop-shadow(0 0 60px rgba(255,100,0,0.28))' : 'drop-shadow(0 0 0px rgba(255,100,0,0))',
            transition: 'opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1), transform 1.4s cubic-bezier(0.16, 1, 0.3, 1), filter 2s ease-out',
            willChange: 'opacity, transform, filter',
          }}
        >
          BL
          <span className="inline-block relative" ref={iRef}>I</span>
          NDSPARK
        </span>
      </div>

      {/* Fire Lottie */}
      {firePos && (
        <div
          className={`absolute z-10 pointer-events-none ${fireVisible ? styles.fireContainer : ''}`}
          style={{
            ...fireStyle,
            width:  fireSize.w,
            height: fireSize.h,
            opacity: fireVisible ? 1 : 0,
            transition: fireSize.w > 60
              ? 'width 1.1s cubic-bezier(0.22, 1, 0.36, 1), height 1.1s cubic-bezier(0.22, 1, 0.36, 1), left 1.1s cubic-bezier(0.22, 1, 0.36, 1), top 1.1s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.8s ease-out'
              : 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'width, height, left, top, opacity, transform',
          }}
        >
          <Lottie
            animationData={fireAnimationData}
            loop
            autoplay
            style={{ width: '100%', height: '100%' }}
            rendererSettings={{
              preserveAspectRatio: 'xMidYMid slice',
            }}
          />
        </div>
      )}

      {/* Tagline */}
      <p
        className={`absolute bottom-[calc(50%-90px)] left-0 right-0 text-center font-rajdhani text-[clamp(10px,1.1vw,13px)] font-light tracking-[0.5em] text-white/50 uppercase whitespace-nowrap z-[4] ${styles.tagline} ${tagVisible ? styles.taglineVisible : 'opacity-0'}`}
      >
        Ignite your edge
      </p>

      {/* CTA group */}
      <div
        className={`absolute bottom-[52px] left-0 right-0 flex justify-center z-[6] ${styles.ctaGroup} ${ctaVisible ? styles.ctaGroupVisible : 'opacity-0'}`}
      >
        <div className="flex flex-col items-center gap-[14px]">
          <div className={styles.pulseLine} />
          <button
            className={`${styles.enterBtn} font-rajdhani text-[12px] font-semibold tracking-[0.45em] uppercase text-white/80 bg-transparent border border-[rgba(255,100,0,0.45)] px-[44px] py-[13px] cursor-pointer`}
            onClick={handleEnter}
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
}
