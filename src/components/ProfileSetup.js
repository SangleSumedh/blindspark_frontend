"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";

const INTERESTS_LIST = [
  "🎵 Music", "🎮 Gaming", "💻 Tech", "🎨 Art", 
  "✈️ Travel", "🍿 Movies", "📚 Reading", "⚽ Sports",
  "🍔 Food", "📸 Photography", "🐶 Pets", "😂 Memes"
];

const LANGUAGES = ["English", "Spanish", "Hindi", "French", "German"];

export default function ProfileSetup({ onComplete }) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(prev => prev.filter(i => i !== interest));
    } else {
      if (selectedInterests.length >= 5) return; // Max 5
      setSelectedInterests(prev => [...prev, interest]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return setError("Display name is required");
    if (selectedInterests.length === 0) return setError("Select at least 1 interest");

    setLoading(true);
    try {
      // 1. Upload Avatar if selected
      let photoURL = user.photoURL;
      // if (avatarFile) { ... }

      // 2. Sanitize Inputs
      const sanitizedDisplayName = displayName.trim().substring(0, 20); // Max 20 chars
      const sanitizedInterests = selectedInterests
        .map(i => i.trim().substring(0, 20)) 
        .filter(i => i.length > 0)
        .slice(0, 10); 

      // 3. Save to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: sanitizedDisplayName || "Anonymous",
        photoURL,
        interests: sanitizedInterests,
        language,
        createdAt: new Date().toISOString(),
        isBanned: false,
        reportCount: 0,
        karma: 100,
      });
      
      onComplete(); 
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-zinc-800 bg-zinc-900/90 shadow-2xl animate-fade-in-up">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-3xl text-center bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              Welcome to BlindSpark!
            </CardTitle>
            <CardDescription className="text-center text-zinc-400">
              Let's create your persona. This is how others will see you.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                placeholder="e.g. CyberPunk99"
                maxLength={20}
              />
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Primary Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* Interests */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-zinc-300">Interests</label>
                <span className="text-xs text-zinc-500">{selectedInterests.length}/5 selected</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS_LIST.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                      selectedInterests.includes(interest)
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                        : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full py-6 text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/40"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Saving...
                </span>
              ) : "Start Matching 🚀"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
