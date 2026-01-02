"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TestLoginPage() {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function login() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/test/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error || "Login failed");
        return;
      }
      router.push("/checkout");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ minHeight: "80vh", display: "flex", alignItems: "center" }}>
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        <div className="title">TEST Access</div>
        <div className="subtitle">Enter password to access Cookie Doh testing pages.</div>

        <div className="hr" />

        <label className="small muted">Password</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {err && <div className="muted" style={{ marginTop: 10 }}>⚠️ {err}</div>}

        <div style={{ height: 12 }} />

        <button className="btn" onClick={login} disabled={loading}>
          {loading ? "Checking..." : "Enter TEST Mode"}
        </button>
      </div>
    </main>
  );
}
