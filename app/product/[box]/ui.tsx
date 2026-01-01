"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addToCart } from "@/lib/cart";


type BoxSize = 1 | 3 | 6;

export default function BoxBuilder({
  boxSize,
  flavors,
}: {
  boxSize: BoxSize;
  flavors: string[];
}) {
  const [selected, setSelected] = useState<string[]>(Array(boxSize).fill(""));
  const [qty, setQty] = useState<number>(1);

  const ready = useMemo(() => {
    return selected.length === boxSize && selected.every(Boolean);
  }, [selected, boxSize]);

  return (
    <div className="grid" style={{ gap: 12 }}>
      <div className="card" style={{ borderStyle: "dashed" }}>
        <div style={{ fontWeight: 800 }}>Choose your flavors</div>
        <div className="muted small">Pick exactly {boxSize} flavors.</div>

        <div className="hr" />

        <div className="grid" style={{ gap: 10 }}>
          {Array.from({ length: boxSize }).map((_, i) => (
            <div key={i}>
              <label className="small muted">Flavor {i + 1}</label>
              <select
                className="input"
                value={selected[i] || ""}
                onChange={(e) =>
                  setSelected((prev) => {
                    const next = [...prev];
                    next[i] = e.target.value;
                    return next;
                  })
                }
              >
                <option value="" disabled>
                  Select flavor {i + 1}
                </option>
                {flavors.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div>
            <label className="small muted">Quantity</label>
            <input
              className="input"
              type="number"
              min={1}
              max={20}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value || 1))}
            />
          </div>
        </div>
      </div>

      <div className="row">
        <button
          className={"btn" + (ready ? "" : " secondary")}
          disabled={!ready}
  style={!ready ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
  onClick={() => {
    if (!ready) return;
    addToCart({ boxSize, flavors: selected, qty });
    alert("Added to cart ✅");
  }}
>
  Add to cart
</button>

        <Link className="btn ghost" href="/">
          ← Back
        </Link>
      </div>

      <div className="muted small">
        Next step: we’ll add Cart + Checkout (Midtrans + Biteship).
      </div>
    </div>
  );
}
