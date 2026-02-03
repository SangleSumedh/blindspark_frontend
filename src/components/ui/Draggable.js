"use client";

import { useState, useRef, useEffect } from "react";

export default function Draggable({ children, className = "", initialPos = { x: 0, y: 0 } }) {
  const [position, setPosition] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialPosRef = useRef({ x: 0, y: 0 }); // Track where we were before drag started

  // Mouse Down / Touch Start
  const handleStart = (clientX, clientY) => {
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };
    initialPosRef.current = { ...position };
  };

  const onMouseDown = (e) => handleStart(e.clientX, e.clientY);
  const onTouchStart = (e) => {
    // e.preventDefault(); // Prevent scrolling while dragging (optional)
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (clientX, clientY) => {
      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;

      setPosition({
        x: initialPosRef.current.x + deltaX,
        y: initialPosRef.current.y + deltaY,
      });
    };

    const handleMouseMove = (e) => {
      e.preventDefault();
      onMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      // e.preventDefault(); 
      const touch = e.touches[0];
      onMove(touch.clientX, touch.clientY);
    };

    const handleEnd = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging]);

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: "none", // Critical for touch devices
        cursor: isDragging ? "grabbing" : "grab",
      }}
      className={`absolute z-50 transition-shadow ${isDragging ? "shadow-2xl scale-105" : "shadow-lg"} ${className}`}
    >
      {children}
    </div>
  );
}
