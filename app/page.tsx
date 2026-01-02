import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
        }}
      >
        {/* Coming Soon Image */}
        <img
          src="/coming-soon.jpg"
          alt="Coming Soon"
          style={{
            width: "100%",
            borderRadius: 12,
            marginBottom: 16,
          }}
        />

        <div className="title">Cookie Doh</div>
        <div className="subtitle">Where the cookie magic happens</div>

        <div className="hr" />

        <div style={{ fontWeight: 900, fontSize: 22 }}>Coming Soon</div>
        <p className="muted" style={{ marginTop: 8 }}>
          We’re baking something special.
        </p>

        <div className="muted small" style={{ marginTop: 14 }}>
          (Website currently in testing)
        </div>
      </div>

      {/* TEST button bottom-right */}
        <Link href="/test" className="btn" style={{ position: "fixed", right: 16, bottom: 16, zIndex: 50 }}>
            TEST
        </Link>
    </main>
  );
}
