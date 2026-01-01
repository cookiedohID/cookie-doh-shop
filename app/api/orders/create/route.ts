import { NextResponse } from "next/server";
import { Pool } from "pg";

const PRICES: Record<number, number> = { 1: 32500, 3: 90000, 6: 180000 };

// Create a dedicated pool here to avoid any weird import issues
let pool: Pool | null = null;
function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

function makeOrderNo() {
  return "CD-" + Date.now();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customer = body.customer;
    const cartItems = body.cartItems;
    const shipping = body.shipping;

    if (!customer?.name || !customer?.phone || !customer?.address || !customer?.city) {
      return NextResponse.json({ error: "Missing customer fields" }, { status: 400 });
    }
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const subtotal = cartItems.reduce((sum: number, it: any) => {
      const unit = PRICES[it.boxSize] ?? 0;
      return sum + unit * Number(it.qty ?? 1);
    }, 0);

    const shippingCost = Number(shipping?.price ?? 0);
    const total = subtotal + shippingCost;

    const orderNo = makeOrderNo();

    const client = await getPool().connect();
    try {
      await client.query("BEGIN");

      const orderRes = await client.query(
        `insert into orders (
          order_no, customer_name, phone, email, address, city, postal, notes,
          subtotal_idr, shipping_cost_idr, total_idr,
          courier_code, courier_service, courier_etd,
          payment_status, midtrans_order_id
        ) values (
          $1,$2,$3,$4,$5,$6,$7,$8,
          $9,$10,$11,
          $12,$13,$14,
          'PENDING',$15
        )
        returning id`,
        [
          orderNo,
          customer.name,
          customer.phone,
          customer.email || null,
          customer.address,
          customer.city,
          customer.postal || null,
          customer.notes || null,
          subtotal,
          shippingCost,
          total,
          shipping?.courierCode || null,
          shipping?.courierService || null,
          shipping?.etd || null,
          orderNo,
        ]
      );

      const orderId = orderRes.rows[0].id;

      for (const it of cartItems) {
        const unitPrice = PRICES[it.boxSize] ?? 0;
        await client.query(
          `insert into order_items (order_id, box_size, qty, flavors_json, unit_price_idr)
           values ($1,$2,$3,$4,$5)`,
          [orderId, it.boxSize, it.qty, JSON.stringify(it.flavors), unitPrice]
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    return NextResponse.json({ orderNo, subtotal, shippingCost, total });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Create order failed" }, { status: 500 });
  }
}
