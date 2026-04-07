"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";

import { 
  Music, 
  Gamepad2, 
  Laptop, 
  Palette, 
  Plane, 
  Film, 
  Book, 
  Trophy, 
  Utensils, 
  Camera, 
  Dog, 
  Laugh,
  Rocket
} from "lucide-react";

const INTERESTS_LIST = [
  { label: "Music", icon: Music },
  { label: "Gaming", icon: Gamepad2 },
  { label: "Tech", icon: Laptop },
  { label: "Art", icon: Palette },
  { label: "Travel", icon: Plane },
  { label: "Movies", icon: Film },
  { label: "Reading", icon: Book },
  { label: "Sports", icon: Trophy },
  { label: "Food", icon: Utensils },
  { label: "Photography", icon: Camera },
  { label: "Pets", icon: Dog },
  { label: "Memes", icon: Laugh }
];

const LANGUAGES = ["English", "Spanish", "Hindi", "French", "German"];

export default function ProfileSetup({ onComplete }) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleInterest = (interestLabel) => {
    if (selectedInterests.includes(interestLabel)) {
      setSelectedInterests(prev => prev.filter(i => i !== interestLabel));
    } else {
      if (selectedInterests.length >= 5) return; // Max 5
      setSelectedInterests(prev => [...prev, interestLabel]);
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
            <CardTitle className="text-3xl text-center bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
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
                className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
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
                className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none"
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
                {INTERESTS_LIST.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleInterest(label)}
                    className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                      selectedInterests.includes(label)
                        ? "bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.2)]"
                        : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 mr-1.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full py-6 text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-900/40"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Start Matching <Rocket className="w-5 h-5" />
                </span>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
