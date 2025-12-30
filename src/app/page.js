"use client";

import { useState } from "react";
import useWebRTC from "@/hooks/WebRTC";
import VideoTile from "@/components/videoTile";

export default function Home() {
  const {
    localVideoRef,
    remoteVideoRef,
    findMatch,
    role,
    connected,
    status,
    // Note: I recommend adding 'socketId' and 'roomId' to your hook's return
  } = useWebRTC();

  const handleStart = async () => {
    await findMatch();
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl w-full space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">
            BlindSpark <span className="text-emerald-500">v0.0.0</span>
          </h1>

          {/* Status Bar */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  connected ? "bg-emerald-500" : "bg-yellow-500 animate-pulse"
                }`}
              ></span>
              <p className="text-gray-400 font-medium uppercase tracking-widest text-xs">
                {status} {role ? `(${role})` : ""}
              </p>
            </div>
            {connected && (
              <p className="text-emerald-400 text-sm font-bold">
                Live Connection Established
              </p>
            )}
          </div>
        </header>

        {status === "idle" ? (
          <div className="bg-gray-800 p-12 rounded-2xl shadow-xl text-center space-y-6 border border-gray-700">
            <div className="bg-gray-700 h-24 w-24 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">🔍</span>
            </div>
            <h2 className="text-2xl font-semibold">
              Ready to meet someone new?
            </h2>
            <button
              onClick={handleStart}
              className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-blue-900/20"
            >
              Start Searching
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative overflow-hidden rounded-xl border-2 border-gray-800">
              <VideoTile videoRef={localVideoRef} muted />
              <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded text-[10px] uppercase font-bold">
                Local Feed {role === "caller" && "• Host"}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border-2 border-gray-800 bg-black">
              {!connected && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm">
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-300 font-medium italic">
                    {status === "searching"
                      ? "Waiting for someone to join..."
                      : "Handshaking..."}
                  </p>
                </div>
              )}
              <VideoTile videoRef={remoteVideoRef} />
              <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded text-[10px] uppercase font-bold">
                Remote Feed {role === "callee" && "• Client"}
              </div>
            </div>
          </div>
        )}

        {/* Footer Controls */}
        {status !== "idle" && (
          <footer className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-600 px-6 py-2 rounded-lg font-bold text-sm transition-colors"
            >
              Next Stranger
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 px-6 py-2 rounded-lg font-bold text-sm transition-all"
            >
              Stop
            </button>
          </footer>
        )}

        {/* DEBUG PANEL: Remove this once matching works */}
        <div className="mt-12 p-4 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] text-gray-500">
          <p className="uppercase font-bold mb-2 text-gray-400">System Logs</p>
          <div className="grid grid-cols-2 gap-2">
            <p>
              Status: <span className="text-white">{status}</span>
            </p>
            <p>
              Role: <span className="text-white">{role || "none"}</span>
            </p>
            <p>
              WebRTC:{" "}
              <span className={connected ? "text-emerald-400" : "text-red-400"}>
                {connected ? "Connected" : "Disconnected"}
              </span>
            </p>
            <p>
              Signal: <span className="text-emerald-400">Socket.io Active</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
