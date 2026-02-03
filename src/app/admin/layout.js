"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ADMIN_EMAILS = ["sanglesumedh15@gmail.com"];

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !ADMIN_EMAILS.includes(user.email)) {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  if (loading) return null;

  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-red-500/30">
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛡️</span>
              <span className="font-bold text-lg tracking-tight">Admin Console</span>
            </div>
            <div className="text-sm text-zinc-400">
              {user.email}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
