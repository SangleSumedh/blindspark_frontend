"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import IntroScreen from "./IntroScreen";
import AuthForm from "./AuthForm";

export default function LoginPage() {
  const { signInWithGoogle, signUp, signIn } = useAuth();
  const [view, setView] = useState('intro'); // 'intro' or 'auth'
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email, password) => {
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (email, password) => {
    setError("");
    setLoading(true);
    try {
      await signUp(email, password);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
    }
  };

  if (view === 'intro') {
    return <IntroScreen onEnter={() => setView('auth')} />;
  }

  return (
    <AuthForm 
      onLogin={handleLogin}
      onSignup={handleSignup}
      onGoogleLogin={handleGoogleLogin}
      error={error}
      loading={loading}
    />
  );
}
