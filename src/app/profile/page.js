"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import {
  Camera,
  Check,
  Loader2,
  Music,
  Gamepad2,
  Laptop,
  Palette,
  Plane,
  Film,
  Book,
  Trophy,
  Utensils,
  Camera as CameraIcon,
  Dog,
  Laugh,
  Zap,
  Save,
  X,
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
  { label: "Photography", icon: CameraIcon },
  { label: "Pets", icon: Dog },
  { label: "Memes", icon: Laugh },
];

const LANGUAGES = ["English", "Spanish", "Hindi", "French", "German", "Portuguese", "Japanese", "Korean", "Mandarin", "Arabic"];

export default function ProfilePage() {
  const { user, userProfile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [language, setLanguage] = useState("English");
  const [photoURL, setPhotoURL] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // UI state
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Populate from existing profile
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || "");
      // Only keep interests that exist in our INTERESTS_LIST to avoid "ghost" interests
      const validLowerLabels = INTERESTS_LIST.map((i) => i.label.toLowerCase());
      const filtered = (userProfile.interests || [])
        .map((i) => i.toLowerCase())
        .filter((i) => validLowerLabels.includes(i));
        
      setSelectedInterests(filtered);
      setLanguage(userProfile.language || "English");
      setPhotoURL(userProfile.photoURL || null);
    }
  }, [userProfile]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isInterestSelected = (label) =>
    selectedInterests.includes(label.toLowerCase());

  const toggleInterest = (label) => {
    const key = label.toLowerCase();
    if (selectedInterests.includes(key)) {
      setSelectedInterests((prev) => prev.filter((i) => i !== key));
    } else {
      if (selectedInterests.length >= 5) return;
      setSelectedInterests((prev) => [...prev, key]);
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    setError("");
    try {
      const base64 = await new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.readAsDataURL(file);
      });

      const res = await fetch("/api/upload-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPhotoURL(data.url);
    } catch (err) {
      console.error(err);
      setError("Failed to upload photo. Please try again.");
      setPhotoPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoURL(null);
    setPhotoPreview(null);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }
    if (selectedInterests.length === 0) {
      setError("Select at least 1 interest.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const sanitizedDisplayName = displayName.trim().substring(0, 20);
      const sanitizedInterests = selectedInterests
        .map((i) => i.trim().substring(0, 20))
        .filter((i) => i.length > 0)
        .slice(0, 10);

      await updateDoc(doc(db, "users", user.uid), {
        displayName: sanitizedDisplayName,
        interests: sanitizedInterests,
        language,
        photoURL: photoURL || null,
      });

      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
      setError("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  const currentPhoto = photoPreview || photoURL;

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-orange-500/30">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-orange-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-900/10 blur-[120px]" />
      </div>

      <Navbar />


      <main className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-10">
          {/* Avatar */}
          <div className="relative group mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-zinc-800 shadow-2xl bg-zinc-900 flex items-center justify-center">
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-zinc-600">
                  {getInitials(displayName || userProfile.displayName)}
                </span>
              )}

              {/* Upload overlay */}
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
              )}
            </div>

            {/* Camera button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-400 flex items-center justify-center shadow-lg transition-all border-2 border-zinc-950 group-hover:scale-110"
            >
              <Camera size={16} className="text-white" />
            </button>

            {/* Remove photo */}
            {currentPhoto && (
              <button
                onClick={handleRemovePhoto}
                className="absolute top-0 right-0 w-7 h-7 rounded-full bg-zinc-800 hover:bg-red-500/20 flex items-center justify-center border border-zinc-700 hover:border-red-500/30 transition-all opacity-0 group-hover:opacity-100"
              >
                <X size={12} className="text-zinc-400 hover:text-red-400" />
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          <h1 className="text-2xl font-bold mb-1">{userProfile.displayName}</h1>
          <p className="text-zinc-500 text-sm">{user.email}</p>

          {/* Karma badge */}
          <div className="flex items-center gap-2 mt-3 bg-orange-500/5 border border-orange-500/10 px-4 py-2 rounded-xl">
            <Zap size={16} className="text-orange-500" />
            <span className="text-lg font-black text-orange-400">{userProfile.karma}</span>
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Karma Points</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center mb-6 animate-fade-in-up">
            {error}
          </div>
        )}

        {/* Success */}
        {saved && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm text-center mb-6 animate-fade-in-up flex items-center justify-center gap-2">
            <Check size={16} /> Profile updated successfully!
          </div>
        )}

        {/* Form Sections */}
        <div className="space-y-8">
          {/* Display Name */}
          <section className="glass-panel rounded-2xl p-6">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-4">
              Display Name
            </h2>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
              placeholder="e.g. CyberPunk99"
              maxLength={20}
            />
            <p className="text-[11px] text-zinc-600 mt-2">
              {displayName.length}/20 characters
            </p>
          </section>

          {/* Language */}
          <section className="glass-panel rounded-2xl p-6">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-4">
              Primary Language
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    language === lang
                      ? "bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.15)]"
                      : "bg-zinc-900/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </section>

          {/* Interests */}
          <section className="glass-panel rounded-2xl p-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest">
                Interests
              </h2>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  selectedInterests.length >= 5
                    ? "bg-orange-500/20 text-orange-400"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {selectedInterests.length}/5
              </span>
            </div>
            {selectedInterests.length >= 5 && (
              <p className="text-[11px] text-zinc-500 mb-3">
                Tap a selected interest to remove it, then pick a new one.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {INTERESTS_LIST.map(({ label, icon: Icon }) => {
                const isSelected = isInterestSelected(label);
                const isMaxed = selectedInterests.length >= 5 && !isSelected;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleInterest(label)}
                    disabled={isMaxed}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      isSelected
                        ? "bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.15)] hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-300"
                        : "bg-zinc-900/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    } ${isMaxed ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {isSelected ? (
                      <X className="w-3.5 h-3.5" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Account Info (read-only) */}
          <section className="glass-panel rounded-2xl p-6">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-4">
              Account Info
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-zinc-500">Email</span>
                <span className="text-sm text-zinc-300 font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-zinc-500">Karma</span>
                <span className="text-sm text-orange-400 font-bold">{userProfile.karma}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-sm text-zinc-500">Reports</span>
                <span className="text-sm text-zinc-300 font-medium">{userProfile.reportCount || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-zinc-500">Joined</span>
                <span className="text-sm text-zinc-300 font-medium">
                  {userProfile.createdAt
                    ? new Date(userProfile.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Save Button */}
        <div className="sticky bottom-6 mt-10 flex justify-center">
          <Button
            onClick={handleSave}
            disabled={saving || uploading}
            size="lg"
            className="px-12 shadow-xl shadow-orange-900/30 text-base font-bold"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </span>
            ) : saved ? (
              <span className="flex items-center gap-2">
                <Check className="w-5 h-5" />
                Saved!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-5 h-5" />
                Save Changes
              </span>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
