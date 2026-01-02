import Link from "next/link";

export default function Home() {
  return (
    <main style={{ minHeight: "80vh", display: "flex", alignItems: "center" }}>
      <div className="card" style={{ width: "100%" }}>
        <div className="title">Cookie Doh</div>
        <div className="subtitle">Where the cookie magic happens</div>

        <div className="hr" />

        <div style={{ fontWeight: 900, fontSize: 22 }}>Coming Soon</div>
        <p className="muted" style={{ marginTop: 8 }}>
          We’re baking something special. Please check back soon.
        </p>

        <div className="muted small" style={{ marginTop: 14 }}>
          (This website is currently in testing.)
        </div>
      </div>

      {/* Test button bottom-right */}
      <Link
        href="/checkout"
        className="btn"
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 50,
        }}
      >
        TEST
      </Link>
    </main>
  );
}
