import { NextResponse } from "next/server";
import { Pool } from "pg";
import { biteshipCreateShipment } from "@/app/lib/biteship";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function POST(req: Request) {
  try {
    const notif = await req.json();

    const orderNo = String(notif.order_id || "");
    const transactionStatus = String(notif.transaction_status || "");
    const fraudStatus = String(notif.fraud_status || "");

    const paid =
      (transactionStatus === "capture" && fraudStatus === "accept") ||
      transactionStatus === "settlement";

    const paymentStatus = paid
      ? "PAID"
      : transactionStatus === "expire"
      ? "EXPIRED"
      : transactionStatus === "cancel" || transactionStatus === "deny"
      ? "FAILED"
      : "PENDING";

    const db = getPool();

    // Update payment status
    const { rows } = await db.query(
      `update orders
       set payment_status=$1, midtrans_transaction_status=$2
       where order_no=$3
       returning
         id, order_no, customer_name, phone, email, address, city, postal,
         courier_code, courier_service, courier_etd,
         biteship_order_id, shipping_speed`,
      [paymentStatus, transactionStatus, orderNo]
    );

    if (rows.length === 0) return NextResponse.json({ ok: true });

    const order = rows[0];

    // Auto-book ONLY if PAID and courier_etd includes "next" or "next-day" or "1 day"
    
    const isNextDay = String(order.shipping_speed || "NEXT_DAY") === "NEXT_DAY";


    if (paid && isNextDay && !order.biteship_order_id) {
      if (!process.env.BITESHIP_API_KEY) throw new Error("BITESHIP_API_KEY not set");

      // Pick item dimensions/weight (safe max estimate)
      const items = [
        {
          name: "Cookie Doh",
          description: "Fresh cookies (Next-day only)",
          quantity: 1,
          weight: 1600,
          length: 22,
          width: 10,
          height: 10,
        },
      ];

      const shipment = await biteshipCreateShipment({
        apiKey: process.env.BITESHIP_API_KEY,
        referenceId: order.order_no,
        courierCompany: order.courier_code,
        courierType: order.courier_service,
        destination: {
          contactName: order.customer_name,
          contactPhone: order.phone,
          address: order.address,
          city: order.city,
          postal: order.postal,
        },
        origin: {
          contactName: process.env.BITESHIP_ORIGIN_CONTACT_NAME || "Cookie Doh",
          contactPhone: process.env.BITESHIP_ORIGIN_PHONE || "",
          address: process.env.BITESHIP_ORIGIN_ADDRESS || "",
          city: process.env.BITESHIP_ORIGIN_CITY || "Jakarta Selatan",
        },
        items,
      });

      await db.query(
        `update orders
         set biteship_order_id=$1, waybill=$2, tracking_url=$3, shipment_status='BOOKED'
         where order_no=$4`,
        [shipment.biteshipOrderId, shipment.waybill, shipment.trackingUrl, order.order_no]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Return 200 to stop webhook retries while debugging
    return NextResponse.json({ ok: true, error: e?.message }, { status: 200 });
  }
}
