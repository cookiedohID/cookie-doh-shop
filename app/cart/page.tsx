"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CartItem,
  clearCart,
  getCart,
  removeFromCart,
  updateQty,
} from "@/lib/cart";

const PRICES: Record<1 | 3 | 6, number> = {
  1: 32500,
  3: 90000,
  6: 180000,
};

function formatIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(getCart());
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + PRICES[it.boxSize] * it.qty,
        0
      ),
    [items]
  );

  return (
    <main className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="row">
          <div>
            <div className="title">Cart</div>
            <div className="subtitle">
              Mix Box 1 / 3 / 6 in one order
            </div>
          </div>

          <button
            className="btn secondary"
            onClick={() => {
              clearCart();
              setItems([]);
            }}
          >
            Clear
          </button>
        </div>

        <div className="hr" />

        {items.length === 0 ? (
          <div className="muted">
            Your cart is empty.{" "}
            <Link href="/">Go shopping</Link>
          </div>
        ) : (
          <div className="grid" style={{ gap: 12 }}>
            {items.map((it) => (
              <div key={it.id} className="card">
                <div className="row">
                  <div>
                    <div style={{ fontWeight: 900 }}>
                      Box {it.boxSize}
                    </div>
                    <div className="muted small">
                      {it.flavors.join(" • ")}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900 }}>
                      {formatIdr(
                        PRICES[it.boxSize] * it.qty
                      )}
                    </div>
                    <div className="muted small">
                      {formatIdr(PRICES[it.boxSize])} each
                    </div>
                  </div>
                </div>

                <div className="hr" />

                <div className="row">
                  <div style={{ width: 140 }}>
                    <label className="small muted">
                      Quantity
                    </label>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      max={50}
                      value={it.qty}
                      onChange={(e) => {
                        const q = Math.max(
                          1,
                          Math.min(
                            50,
                            Number(e.target.value || 1)
                          )
                        );
                        setItems(updateQty(it.id, q));
                      }}
                    />
                  </div>

                  <button
                    className="btn secondary"
                    onClick={() =>
                      setItems(removeFromCart(it.id))
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="card">
              <div className="row">
                <div style={{ fontWeight: 900 }}>
                  Subtotal
                </div>
                <div style={{ fontWeight: 900 }}>
                  {formatIdr(subtotal)}
                </div>
              </div>

              <div className="muted small" style={{ marginTop: 6 }}>
                Next: Checkout (same-day / next-day delivery)
              </div>

              <div className="hr" />

              <div className="row">
                <Link className="btn ghost" href="/">
                  ← Continue shopping
                </Link>
                <Link className="btn" href="/checkout">
                  Checkout →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
