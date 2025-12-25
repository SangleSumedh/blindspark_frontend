"use client";

import { useState } from "react";
import useWebRTC from "@/hooks/WebRTC";
import VideoTile from "@/components/videoTile";

export default function Home() {
  // Use the updated hook properties
  const { localVideoRef, remoteVideoRef, findMatch, role, connected, status } =
    useWebRTC();

  const handleStart = async () => {
    // Triggers camera init and joins the server queue
    await findMatch();
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl w-full space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">
            Random Video Chat
          </h1>
          <div className="mt-2 flex justify-center items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${
                connected ? "bg-green-500" : "bg-yellow-500 animate-pulse"
              }`}
            ></span>
            <p className="text-gray-400 font-medium">
              {status === "idle"
                ? "Ready to search"
                : status === "searching"
                ? "Finding someone..."
                : connected
                ? "Connected"
                : "Matching..."}
            </p>
          </div>
        </header>

        {status === "idle" ? (
          /* START SCREEN */
          <div className="bg-gray-800 p-12 rounded-2xl shadow-xl text-center space-y-6">
            <div className="bg-gray-700 h-24 w-24 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">🔍</span>
            </div>
            <h2 className="text-2xl font-semibold">
              Ready to meet someone new?
            </h2>
            <p className="text-gray-400">
              Click the button below to be matched with a random stranger.
            </p>
            <button
              onClick={handleStart}
              className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105"
            >
              Start Searching
            </button>
          </div>
        ) : (
          /* CALL/SEARCH SCREEN */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LOCAL VIDEO */}
            <div className="relative group">
              <VideoTile videoRef={localVideoRef} muted />
              <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-sm font-medium backdrop-blur-sm">
                You
              </div>
            </div>

            {/* REMOTE VIDEO / SEARCHING OVERLAY */}
            <div className="relative group">
              {!connected && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 rounded border-2 border-dashed border-gray-600">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">
                    {status === "searching"
                      ? "Looking for a partner..."
                      : "Establishing connection..."}
                  </p>
                </div>
              )}
              <VideoTile videoRef={remoteVideoRef} />
              <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded text-sm font-medium backdrop-blur-sm">
                Stranger
              </div>
            </div>
          </div>
        )}

        {status !== "idle" && (
          <footer className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-bold text-sm"
            >
              Next Stranger
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-400 px-6 py-2 rounded-lg font-bold text-sm"
            >
              Stop
            </button>
          </footer>
        )}
      </div>
    </main>
  );
}
