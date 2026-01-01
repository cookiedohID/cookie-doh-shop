"use client";

export type BoxSize = 1 | 3 | 6;

export type CartItem = {
  id: string; // unique line item
  boxSize: BoxSize;
  flavors: string[];
  qty: number;
};

const KEY = "cookieDohCartV1";

function safeParse<T>(v: string | null, fallback: T): T {
  try {
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  return safeParse<CartItem[]>(localStorage.getItem(KEY), []);
}

export function setCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToCart(item: Omit<CartItem, "id">) {
  const cur = getCart();
  const id =
    crypto?.randomUUID?.() ??
    String(Date.now()) + Math.random().toString(16).slice(2);
  cur.push({ ...item, id });
  setCart(cur);
}

export function removeFromCart(id: string) {
  const cur = getCart().filter((x) => x.id !== id);
  setCart(cur);
  return cur;
}

export function updateQty(id: string, qty: number) {
  const cur = getCart().map((x) => (x.id === id ? { ...x, qty } : x));
  setCart(cur);
  return cur;
}

export function clearCart() {
  setCart([]);
}
