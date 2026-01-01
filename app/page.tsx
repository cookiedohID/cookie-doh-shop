import Link from "next/link";

const BOXES = [
  { size: 1, price: 32500, packaging: "paper bag (no box)" },
  { size: 3, price: 90000, packaging: "box • 11×10×10 cm" },
  { size: 6, price: 180000, packaging: "box • 22×10×10 cm" },
];

function formatIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Home() {
  return (
    <main className="grid" style={{ gap: 24 }}>
      <section className="card">
        <div className="title">Cookie Doh</div>
        <div className="subtitle">Where the cookie magic happens</div>

        <div className="hr" />

        <p className="muted">
          Build your own box (1 / 3 / 6). For freshness (3-day shelf life), we
          only deliver via same-day or next-day services.
        </p>

        <div className="grid grid2" style={{ marginTop: 16 }}>
          {BOXES.map((b) => (
            <div key={b.size} className="card">
              <div className="row">
                <div>
                  <div style={{ fontWeight: 800 }}>Box {b.size}</div>
                  <div className="muted small">{b.packaging}</div>
                </div>
                <div style={{ fontWeight: 800 }}>{formatIdr(b.price)}</div>
              </div>

              <div className="hr" />

              <Link className="btn" href={`/product/${b.size}`}>
                Build Box {b.size}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div style={{ fontWeight: 900 }}>Freshness Guarantee</div>
        <p className="muted" style={{ marginTop: 8 }}>
          To ensure the best quality, Cookie Doh only delivers via same-day or
          next-day services.
        </p>
      </section>
    </main>
  );
}
