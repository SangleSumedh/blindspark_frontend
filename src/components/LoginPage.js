"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Button } from "./ui/Button";

export default function LoginPage() {
  const { signInWithGoogle, signUp, signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Success callback not really needed as auth state change handles redirect, but kept for logic
  const onSuccess = () => {}; 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onSuccess?.();
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradient Mesh */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/20 blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[100px] animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      <Card className="w-full max-w-md z-10 border-zinc-800 bg-zinc-900/80 shadow-2xl animate-fade-in-up">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">⚡</span>
          </div>
          <CardTitle className="text-3xl bg-gradient-to-br from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            BlindSpark
          </CardTitle>
          <CardDescription>
            {isLogin ? "Welcome back! Ready to connect?" : "Join the community of spontaneous conversations."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white text-gray-900 font-medium py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all shadow-lg active:scale-95 mb-6"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-700"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-900 px-2 text-zinc-500">Or using email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-700 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-700 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full py-4 text-base shadow-emerald-900/40" disabled={loading}>
              {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-sm text-zinc-500">
            {isLogin ? "New here? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors"
            >
              {isLogin ? "Create an account" : "Sign in"}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
