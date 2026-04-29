"use client";
import React from 'react';
import Lottie from 'lottie-react';
import fireAnimationData from '../animations/fire.json';

export default function NavLogo() {
  return (
    <div className="flex items-center relative select-none" style={{ height: 32 }}>
      <span
        className="font-inter text-[18px] font-bold tracking-[0.08em] text-white leading-none"
        style={{ letterSpacing: '0.08em' }}
      >
        BLIND
      </span>

      {/* Fire icon inline */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 22,
          height: 32,
          marginTop: -10,
          marginLeft: -1,
          marginRight: -1,
        }}
      >
        <Lottie
          animationData={fireAnimationData}
          loop
          autoplay
          style={{ width: 28, height: 28, pointerEvents: 'none' }}
        />
      </div>

      <span
        className="font-inter text-[18px] font-bold tracking-[0.08em] text-white leading-none"
        style={{ letterSpacing: '0.08em' }}
      >
        SPARK
      </span>
    </div>
  );
}
