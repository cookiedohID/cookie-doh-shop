import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    const pool = db();
    await pool.query(
      `update orders
       set payment_status=$1, midtrans_transaction_status=$2
       where order_no=$3`,
      [paymentStatus, transactionStatus, orderNo]
    );

    // (Auto-book shipping via Biteship will be added next after this webhook is confirmed working)
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Return 200 to avoid repeated retries during dev
    return NextResponse.json({ ok: true, error: e?.message }, { status: 200 });
  }
}
