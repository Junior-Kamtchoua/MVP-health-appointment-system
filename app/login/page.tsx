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

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    // 1️⃣ Login
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    // 2️⃣ Vérifier si l’email est un docteur
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (doctorError) {
      setError("Erreur lors de la vérification du compte");
      setLoading(false);
      return;
    }

    // 3️⃣ Redirection finale
    if (doctor) {
      router.push("/doctor");
    } else {
      router.push("/user");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900">
      <div className="w-full max-w-sm space-y-4 bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-gray-900">Login</h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-black text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Login"}
        </button>
      </div>
    </main>
  );
}
