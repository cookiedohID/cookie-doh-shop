import BoxBuilder from "./ui";

const FLAVORS = [
  "the one",
  "the other one",
  "matcha magic",
  "oatmeal raisin",
  "orange in the dark",
  "after coffee",
] as const;

type BoxSize = 1 | 3 | 6;

const BOXES: Record<BoxSize, { price: number; packaging: string; dims?: string }> =
  {
    1: { price: 32500, packaging: "paper bag (no box)" },
    3: { price: 90000, packaging: "box", dims: "11×10×10 cm" },
    6: { price: 180000, packaging: "box", dims: "22×10×10 cm" },
  };

function formatIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Make it async so it works even if Next passes params in an async shape
export default async function ProductPage({
  params,
}: {
  params: any;
}) {
  const p = await Promise.resolve(params);
  const raw = Array.isArray(p?.box) ? p.box[0] : p?.box;
  const size = Number(String(raw ?? "").trim()) as BoxSize;

  if (size !== 1 && size !== 3 && size !== 6) {
    return (
      <div className="card">
        <div className="title">Invalid box</div>
        <div className="muted">
          I received: <strong>{String(raw)}</strong>
        </div>
        <div className="muted" style={{ marginTop: 8 }}>
          Please go back and select Box 1 / 3 / 6.
        </div>
      </div>
    );
  }

  const box = BOXES[size];

  return (
    <main className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="row">
          <div>
            <div className="title">Build Box {size}</div>
            <div className="subtitle">
              {box.packaging}
              {box.dims ? ` • ${box.dims}` : ""}
            </div>
          </div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>
            {formatIdr(box.price)}
          </div>
        </div>

        <div className="hr" />

        <BoxBuilder boxSize={size} flavors={[...FLAVORS]} />
      </div>
    </main>
  );
}
