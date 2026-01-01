import { NextResponse } from "next/server";

function flagsFromEtd(etdRaw: string) {
  const etd = (etdRaw || "").toLowerCase();
  const isSameDay =
    etd.includes("same") ||
    etd.includes("sameday") ||
    etd.includes("instant") ||
    etd.includes("hari ini");
  const isNextDay =
    etd.includes("next") ||
    etd.includes("1 day") ||
    etd.includes("1 hari") ||
    etd.includes("besok") ||
    etd.includes("h+1");
  return { isSameDay, isNextDay };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    


if (!process.env.BITESHIP_API_KEY) {
  return NextResponse.json({ error: "Missing BITESHIP_API_KEY on Vercel" }, { status: 500 });
}
if (!process.env.BITESHIP_ORIGIN_PHONE) {
  return NextResponse.json({ error: "Missing BITESHIP_ORIGIN_PHONE on Vercel" }, { status: 500 });
}
if (!process.env.BITESHIP_ORIGIN_ADDRESS) {
  return NextResponse.json({ error: "Missing BITESHIP_ORIGIN_ADDRESS on Vercel" }, { status: 500 });
}
if (!body.postalCode || String(body.postalCode).trim().length < 4) {
  return NextResponse.json({ error: "Fill Postal Code to get shipping options" }, { status: 400 });
}



    const addressLine = String(body.addressLine || "").trim();
    const district = String(body.district || "").trim();
    const city = String(body.city || "").trim();
    const province = String(body.province || "").trim();
    const postalCode = String(body.postalCode || "").trim();

    const weightGrams = Number(body.weightGrams || 1600);
    const length = Number(body.length || 22);
    const width = Number(body.width || 10);
    const height = Number(body.height || 10);

if (!process.env.BITESHIP_API_KEY) {
  return NextResponse.json({ error: "Missing BITESHIP_API_KEY on Vercel env vars" }, { status: 500 });
}
if (!process.env.BITESHIP_ORIGIN_PHONE) {
  return NextResponse.json({ error: "Missing BITESHIP_ORIGIN_PHONE on Vercel env vars" }, { status: 500 });
}
if (!process.env.BITESHIP_ORIGIN_ADDRESS) {
  return NextResponse.json({ error: "Missing BITESHIP_ORIGIN_ADDRESS on Vercel env vars" }, { status: 500 });
}
if (!body.postalCode || String(body.postalCode).trim().length < 4) {
  return NextResponse.json({ error: "Fill Postal Code to get shipping options" }, { status: 400 });
}


    // Hard validation (so we catch missing fields BEFORE calling Biteship)
    if (!addressLine) {
      return NextResponse.json({ error: "Missing: addressLine (fill Address on checkout)" }, { status: 400 });
    }
    if (!city) {
      return NextResponse.json({ error: "Missing: city (fill City on checkout)" }, { status: 400 });
    }
    if (!process.env.BITESHIP_API_KEY) {
      return NextResponse.json({ error: "Missing: BITESHIP_API_KEY in .env.local" }, { status: 500 });
    }
    if (!process.env.BITESHIP_ORIGIN_PHONE) {
      return NextResponse.json({ error: "Missing: BITESHIP_ORIGIN_PHONE in .env.local" }, { status: 500 });
    }
    if (!process.env.BITESHIP_ORIGIN_ADDRESS) {
      return NextResponse.json({ error: "Missing: BITESHIP_ORIGIN_ADDRESS in .env.local" }, { status: 500 });
    }

    const payload = {
        // ✅ required location method (postal codes)
          origin_postal_code: Number(process.env.BITESHIP_ORIGIN_POSTAL_CODE),
          destination_postal_code: Number(postalCode),

        // ✅ required
  couriers: "paxel,gojek,grab,jne,jnt,sicepat,anteraja,pos",

        // ✅ required for parcel quote
            items: [
            {
                name: "Cookie Doh",
                description: "Fresh cookies (max next-day)",
                value: 0,
                quantity: 1,
                weight: weightGrams,
                length,
                width,
                height,
            },
  ],
};


    // DEBUG (shows in Terminal logs)
    console.log("BITESHIP rates payload:", JSON.stringify(payload, null, 2));

    const res = await fetch("https://api.biteship.com/v1/rates/couriers", {
      method: "POST",
      headers: {
        Authorization: process.env.BITESHIP_API_KEY as string,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await res.text();
    console.log("BITESHIP raw response:", res.status, text);

    if (!res.ok) {
      return NextResponse.json({ error: `Biteship error ${res.status}: ${text}` }, { status: 500 });
    }

    const data = JSON.parse(text);
    const list: any[] = data?.pricing ?? data?.data ?? [];

    const options = list.map((x: any) => {
      const courierCode = x.courier_code ?? x.courier?.code ?? x.code ?? "";
      const courierName = x.courier_name ?? x.courier?.name ?? x.name ?? courierCode;

      const serviceCode = x.courier_service_code ?? x.service_code ?? x.service ?? "";
      const serviceName = x.courier_service_name ?? x.service_name ?? x.service ?? serviceCode;

      const price = Number(x.price ?? x.final_price ?? x.amount ?? 0);
      const etd = String(x.etd ?? x.duration ?? x.estimation ?? "");

      const flags = flagsFromEtd(etd);
      return { courierCode, courierName, serviceCode, serviceName, price, etd, ...flags };
    });

    // Freshness rule: ONLY same-day or next-day
    const allowed = options.filter((o: any) => o.isSameDay || o.isNextDay);
    const sameday = allowed.filter((o: any) => o.isSameDay).sort((a: any, b: any) => a.price - b.price);
    const nextday = allowed.filter((o: any) => o.isNextDay && !o.isSameDay).sort((a: any, b: any) => a.price - b.price);

    return NextResponse.json({ sameday, nextday });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
