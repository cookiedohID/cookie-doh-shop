"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CartItem, clearCart, getCart } from "@/lib/cart";

declare global {
  interface Window {
    snap: any;
  }
}

const PRICES: Record<1 | 3 | 6, number> = { 1: 32500, 3: 90000, 6: 180000 };

function formatIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

type ShippingChoice = "SAME_DAY" | "NEXT_DAY";

type ShippingOption = {
  courierCode: string;
  courierName: string;
  serviceCode: string;
  serviceName: string;
  price: number;
  etd: string;
  isSameDay: boolean;
  isNextDay: boolean;
};

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [shippingChoice, setShippingChoice] =
    useState<ShippingChoice>("NEXT_DAY");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "Jakarta",
    postal: "",
    notes: "",
  });

  const [rates, setRates] = useState<{
    sameday: ShippingOption[];
    nextday: ShippingOption[];
  } | null>(null);

  const [selectedRate, setSelectedRate] = useState<ShippingOption | null>(null);
  const [rateError, setRateError] = useState<string>("");
  const [loadingRates, setLoadingRates] = useState(false);

  useEffect(() => {
    setItems(getCart());
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + PRICES[it.boxSize] * it.qty, 0),
    [items]
  );

  const shippingCost = useMemo(() => {
    if (selectedRate) return selectedRate.price;
    return shippingChoice === "SAME_DAY" ? 45000 : 25000;
  }, [selectedRate, shippingChoice]);

  const total = subtotal + shippingCost;
  const cartEmpty = items.length === 0;

  async function fetchRates() {
    setLoadingRates(true);
    setRateError("");
    try {
      const res = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressLine: form.address,
          city: form.city,
          postalCode: form.postal,
          weightGrams: 1600,
          length: 22,
          width: 10,
          height: 10,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRates(null);
        setSelectedRate(null);
        setRateError(data?.error || "Failed to load rates");
        return;
      }

      setRates(data);

      const same: ShippingOption[] = data.sameday || [];
      const next: ShippingOption[] = data.nextday || [];
      const paxelSame = same.find(
        (o) => (o.courierCode || "").toLowerCase() === "paxel"
      );
      const paxelNext = next.find(
        (o) => (o.courierCode || "").toLowerCase() === "paxel"
      );

      setSelectedRate(paxelSame || paxelNext || same[0] || next[0] || null);
    } catch (e: any) {
      setRateError(e?.message || "Failed to load rates");
    } finally {
      setLoadingRates(false);
    }
  }

  async function payWithMidtrans() {
    if (!form.name || !form.phone || !form.address || !form.city) {
      alert("Please fill Name, WhatsApp, Address, and City.");
      return;
    }
    if (items.length === 0) {
      alert("Cart is empty.");
      return;
    }

    // 1) Create order in DB first
const createRes = await fetch("/api/orders/create", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    customer: {
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      address: form.address,
      city: form.city,
      postal: form.postal || null,
      notes: form.notes || null,
    },
    cartItems: items,
    shipping: selectedRate
  ? {
      price: selectedRate.price,
      courierCode: selectedRate.courierCode,
      courierService: selectedRate.serviceCode,
      etd: selectedRate.etd,
      shippingSpeed: selectedRate.isSameDay ? "SAME_DAY" : "NEXT_DAY",
    }
  : {
      price: shippingCost,
      courierCode: null,
      courierService: shippingChoice,
      etd: shippingChoice,
      shippingSpeed: shippingChoice === "SAME_DAY" ? "SAME_DAY" : "NEXT_DAY",
    },

  }),
});

const created = await createRes.json();
if (!createRes.ok) {
  alert("Failed to create order: " + (created?.error || "Unknown"));
  return;
}

const orderId = created.orderNo;

// 2) Create Midtrans Snap token using the SAME orderId and total
const res = await fetch("/api/payments/snap-token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    orderId,
    grossAmount: created.total,
    customerName: form.name,
    customerPhone: form.phone,
    customerEmail: form.email || undefined,
  }),
});

const data = await res.json();
if (!res.ok) {
  alert("Midtrans error. Check Terminal logs.");
  return;
}


    if (!window.snap) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = data.snapJsUrl;
        s.setAttribute("data-client-key", data.clientKey);
        s.onload = () => resolve();
        s.onerror = () => reject();
        document.body.appendChild(s);
      });
    }

    window.snap.pay(data.snapToken, {
      onSuccess: function () {
        alert("Payment success ✅");
      },
      onPending: function () {
        alert("Payment pending ⏳");
      },
      onError: function () {
        alert("Payment failed ❌");
      },
      onClose: function () {
        alert("Payment popup closed.");
      },
    });
  }

const rateGroups: Array<[string, ShippingOption[]]> = rates
  ? [
      ["Same-day", rates.sameday],
      ["Next-day", rates.nextday],
    ]
  : [];


  return (
    <main className="grid" style={{ gap: 16 }}>
      <div className="card">
        <div className="row">
          <div>
            <div className="title">Checkout</div>
            <div className="subtitle">
              Freshness Guarantee: same-day or next-day only.
            </div>
          </div>
          <Link className="btn secondary" href="/cart">
            Back to cart
          </Link>
        </div>

        <div className="hr" />

        {cartEmpty ? (
          <div className="muted">
            Your cart is empty. <Link href="/">Go shopping</Link>
          </div>
        ) : (
          <div className="grid grid2">
            {/* LEFT */}
            <div className="grid" style={{ gap: 10 }}>
              <div>
                <label className="small muted">Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="small muted">WhatsApp</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="small muted">Email (optional)</label>
                <input
                  className="input"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="small muted">Address</label>
                <textarea
                  className="input"
                  value={form.address}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, address: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid2">
                <div>
                  <label className="small muted">City</label>
                  <input
                    className="input"
                    value={form.city}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, city: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="small muted">Postal code (optional)</label>
                  <input
                    className="input"
                    value={form.postal}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, postal: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="small muted">Notes (optional)</label>
                <textarea
                  className="input"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                />
              </div>

              <div className="card" style={{ borderStyle: "dashed" }}>
                <div className="row">
                  <div>
                    <div style={{ fontWeight: 900 }}>Delivery options</div>
                    <div className="muted small" style={{ marginTop: 6 }}>
                      Same-day / Next-day only.
                    </div>
                  </div>

                  <button
                    className="btn secondary"
                    onClick={fetchRates}
                    disabled={loadingRates}
                  >
                    {loadingRates ? "Loading..." : "Get options"}
                  </button>
                </div>

                {rateError && (
                  <div className="muted small" style={{ marginTop: 10 }}>
                    ⚠️ {rateError}
                  </div>
                )}

                <div className="hr" />

                {!rates ? (
                  <>
                    <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="radio"
                        checked={shippingChoice === "NEXT_DAY"}
                        onChange={() => {
                          setSelectedRate(null);
                          setShippingChoice("NEXT_DAY");
                        }}
                      />
                      Next-day (recommended) — {formatIdr(25000)}
                    </label>
                    <div style={{ height: 8 }} />
                    <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="radio"
                        checked={shippingChoice === "SAME_DAY"}
                        onChange={() => {
                          setSelectedRate(null);
                          setShippingChoice("SAME_DAY");
                        }}
                      />
                      Same-day — {formatIdr(45000)}
                    </label>
                  </>
                ) : (
                  <div className="grid" style={{ gap: 12 }}>
{rateGroups.map(([title, list]) => (
  <div key={title}>
    <div style={{ fontWeight: 800 }}>{title}</div>

    <div className="grid" style={{ gap: 8, marginTop: 8 }}>
      {(list as ShippingOption[]).length === 0 ? (
        <div className="muted small">No options for this address.</div>
      ) : (
        (list as ShippingOption[]).map((o, idx) => (
          <label
            key={o.courierCode + o.serviceCode + idx}
            className="card"
            style={{ cursor: "pointer" }}
          >
            <div className="row" style={{ alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="radio"
                  checked={
                    selectedRate?.courierCode === o.courierCode &&
                    selectedRate?.serviceCode === o.serviceCode
                  }
                  onChange={() => setSelectedRate(o)}
                />
                <div>
                  <div style={{ fontWeight: 900 }}>
                    {o.courierName} — {o.serviceName}
                  </div>
                  <div className="muted small">ETA: {o.etd || title}</div>
                </div>
              </div>

              <div style={{ fontWeight: 900 }}>{formatIdr(o.price)}</div>
            </div>
          </label>
        ))
      )}
    </div>
  </div>
))}

                  </div>
                )}
              </div>

              <button className="btn" onClick={payWithMidtrans}>
                Continue to payment
              </button>

              <div className="muted small">
                COD is disabled. Payment via Midtrans (QRIS/VA/e-wallet).
              </div>
            </div>

            {/* RIGHT */}
            <div className="grid" style={{ gap: 10 }}>
              <div className="card">
                <div style={{ fontWeight: 900 }}>Order summary</div>
                <div className="hr" />

                <div className="grid" style={{ gap: 10 }}>
                  {items.map((it) => (
                    <div key={it.id}>
                      <div className="row">
                        <div style={{ fontWeight: 800 }}>
                          Box {it.boxSize} × {it.qty}
                        </div>
                        <div style={{ fontWeight: 800 }}>
                          {formatIdr(PRICES[it.boxSize] * it.qty)}
                        </div>
                      </div>
                      <div className="muted small">{it.flavors.join(" • ")}</div>
                    </div>
                  ))}
                </div>

                <div className="hr" />

                <div className="row">
                  <div>Subtotal</div>
                  <div style={{ fontWeight: 800 }}>{formatIdr(subtotal)}</div>
                </div>
                <div className="row">
                  <div>Shipping</div>
                  <div style={{ fontWeight: 800 }}>{formatIdr(shippingCost)}</div>
                </div>
                <div className="row">
                  <div style={{ fontWeight: 900 }}>Total</div>
                  <div style={{ fontWeight: 900 }}>{formatIdr(total)}</div>
                </div>
              </div>

              <button
                className="btn secondary"
                onClick={() => {
                  clearCart();
                  setItems([]);
                }}
              >
                Clear cart
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
