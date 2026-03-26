"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dark, setDark] = useState(true);

  const handleLogin = async () => {
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      // LOGIN
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        return;
      }

      // CHECK ROLE
      const { data: doctor, error: doctorError } = await supabase
        .from("doctors")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (doctorError) {
        setError("Error verifying account");
        return;
      }

      if (doctor) {
        router.push("/doctor");
      } else {
        router.push("/user");
      }
    } catch (err) {
      console.error(err);
      setError("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
    dark
      ? "bg-white/5 border-white/10 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-400"
      : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
  }`;

  return (
    <main
      className={`min-h-screen flex items-center justify-center px-4 ${
        dark
          ? "bg-[radial-gradient(circle_at_top,_#020617,_#020617,_#020617,_#020617)] text-white"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* BACK HOME */}
      <button
        onClick={() => router.push("/")}
        className={`absolute top-6 left-6 text-sm font-medium transition ${
          dark
            ? "text-slate-400 hover:text-white"
            : "text-gray-600 hover:text-black"
        }`}
      >
        ← Back Home
      </button>

      {/* THEME TOGGLE */}
      <button
        onClick={() => setDark(!dark)}
        className={`absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-semibold transition ${
          dark ? "bg-white/10 text-white" : "bg-gray-200 text-gray-900"
        }`}
      >
        {dark ? "Light" : "Dark"}
      </button>

      {/* CARD */}
      <div
        className={`w-full max-w-md rounded-[28px] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.4)] backdrop-blur-xl transition ${
          dark ? "bg-white/[0.04] border border-white/10" : "bg-white border"
        }`}
      >
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p
            className={`text-sm mt-1 ${
              dark ? "text-slate-400" : "text-gray-500"
            }`}
          >
            Login to access your dashboard
          </p>
        </div>

        {/* FORM */}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          {/* ERROR */}
          {error && (
            <div
              className={`text-sm rounded-lg px-3 py-2 ${
                dark
                  ? "bg-red-500/10 text-red-300 border border-red-500/20"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {error}
            </div>
          )}

          {/* BUTTON */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full rounded-xl py-3 text-sm font-semibold transition ${
              dark
                ? "bg-cyan-500 hover:bg-cyan-400 text-black"
                : "bg-black text-white hover:bg-gray-800"
            } disabled:opacity-50`}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </div>

        {/* FOOTER */}
        <div
          className={`mt-6 text-xs text-center ${
            dark ? "text-slate-500" : "text-gray-400"
          }`}
        >
          Secure authentication powered by Supabase
        </div>
      </div>
    </main>
  );
}
