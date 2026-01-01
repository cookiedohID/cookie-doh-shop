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


export async function GET(req: Request) {
  const url = new URL(req.url);

  if (url.searchParams.get("debug") === "1") {
    return NextResponse.json(
      {
        debug: {
          hasKey: !!process.env.BITESHIP_API_KEY,
          originPostal: process.env.BITESHIP_ORIGIN_POSTAL_CODE || null,
          originCity: process.env.BITESHIP_ORIGIN_CITY || null,
          originAddress: process.env.BITESHIP_ORIGIN_ADDRESS ? "set" : null,
          originPhone: process.env.BITESHIP_ORIGIN_PHONE ? "set" : null,
        },
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { error: "Use POST for shipping rates" },
    { status: 405 }
  );
}


export async function POST(req: Request) {
  try {
    const body = await req.json();


    const url = new URL(req.url);
if (url.searchParams.get("debug") === "1") {
  return NextResponse.json(
    {
      received: {
        addressLine: body.addressLine || null,
        city: body.city || null,
        postalCode: body.postalCode || null,
        weightGrams: body.weightGrams || null,
      },
      env: {
        originPostal: process.env.BITESHIP_ORIGIN_POSTAL_CODE || null,
      },
    },
    { status: 200 }
  );
}


    // ✅ SAFE DEBUG (no key exposed)
    const url = new URL(req.url);
    if (url.searchParams.get("debug") === "1") {
      return NextResponse.json(
        {
          debug: {
            hasKey: !!process.env.BITESHIP_API_KEY,
            originPostal: process.env.BITESHIP_ORIGIN_POSTAL_CODE || null,
            originCity: process.env.BITESHIP_ORIGIN_CITY || null,
            originAddress: process.env.BITESHIP_ORIGIN_ADDRESS ? "set" : null,
            originPhone: process.env.BITESHIP_ORIGIN_PHONE ? "set" : null,
            destPostal: body.postalCode || null,
          },
        },
        { status: 200 }
      );
    }

    // ✅ Required env vars for postal-code mode
    if (!process.env.BITESHIP_API_KEY) {
      return NextResponse.json({ error: "Missing BITESHIP_API_KEY on Vercel" }, { status: 500 });
    }
    if (!process.env.BITESHIP_ORIGIN_POSTAL_CODE) {
      return NextResponse.json({ error: "Missing BITESHIP_ORIGIN_POSTAL_CODE on Vercel" }, { status: 500 });
    }

    const postalCode = String(body.postalCode || "").trim();
    if (postalCode.length < 4) {
      return NextResponse.json({ error: "Fill Postal Code to get shipping options" }, { status: 400 });
    }

    const weightGrams = Number(body.weightGrams || 1600);
    const length = Number(body.length || 22);
    const width = Number(body.width || 10);
    const height = Number(body.height || 10);

    const payload = {
      origin_postal_code: Number(process.env.BITESHIP_ORIGIN_POSTAL_CODE),
      destination_postal_code: Number(postalCode),

      // ✅ correct key name
      couriers: "paxel,gosend,grabexpress,jne,jnt,sicepat,anteraja,pos",

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
      return { courierCode, courierName, serviceCode, serviceName, price, etd, ...flagsFromEtd(etd) };
    });

    // Freshness rule: only same-day or next-day
    const allowed = options.filter((o: any) => o.isSameDay || o.isNextDay);
    const sameday = allowed.filter((o: any) => o.isSameDay).sort((a: any, b: any) => a.price - b.price);
    const nextday = allowed.filter((o: any) => o.isNextDay && !o.isSameDay).sort((a: any, b: any) => a.price - b.price);

    return NextResponse.json({ sameday, nextday });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
