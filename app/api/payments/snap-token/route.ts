import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.MIDTRANS_CLIENT_KEY;
    if (!serverKey || !clientKey) {
      return NextResponse.json(
        { error: "Midtrans keys not set in .env.local" },
        { status: 500 }
      );
    }

    const orderId = body.orderId as string;
    const grossAmount = body.grossAmount as number;
    const customerName = body.customerName as string;
    const customerPhone = body.customerPhone as string;
    const customerEmail = body.customerEmail as string | undefined;

    const auth = Buffer.from(serverKey + ":").toString("base64");

    const res = await fetch(
      "https://app.sandbox.midtrans.com/snap/v1/transactions",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          transaction_details: { order_id: orderId, gross_amount: grossAmount },
          customer_details: {
            first_name: customerName,
            phone: customerPhone,
            email: customerEmail || undefined,
          },
          credit_card: { secure: true },
        }),
        cache: "no-store",
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: 500 });
    }

    return NextResponse.json({
      snapToken: data.token,
      snapJsUrl: "https://app.sandbox.midtrans.com/snap/snap.js",
      clientKey,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
