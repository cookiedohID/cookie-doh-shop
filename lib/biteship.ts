import { Pool } from "pg";

export async function biteshipCreateShipment(args: {
  apiKey: string;
  referenceId: string;
  courierCompany: string; // e.g. "paxel", "jne"
  courierType: string;    // e.g. service code
  destination: {
    contactName: string;
    contactPhone: string;
    address: string;
    city: string;
    postal?: string | null;
  };
  origin: {
    contactName: string;
    contactPhone: string;
    address: string;
    city: string;
  };
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    weight: number;
    length: number;
    width: number;
    height: number;
  }>;
}) {
  const res = await fetch("https://api.biteship.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: args.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reference_id: args.referenceId,
      courier_company: args.courierCompany,
      courier_type: args.courierType,
      destination_contact_name: args.destination.contactName,
      destination_contact_phone: args.destination.contactPhone,
      destination_address: args.destination.address,
      destination_city: args.destination.city,
      destination_postal_code: args.destination.postal || "",

      origin_contact_name: args.origin.contactName,
      origin_contact_phone: args.origin.contactPhone,
      origin_address: args.origin.address,
      origin_city: args.origin.city,

      items: args.items,
    }),
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Biteship create order failed ${res.status}: ${text}`);

  const data = JSON.parse(text);
  return {
    biteshipOrderId: String(data?.id ?? data?.data?.id ?? ""),
    waybill: data?.courier?.waybill_id ?? data?.waybill_id ?? null,
    trackingUrl: data?.courier?.link ?? data?.tracking_url ?? null,
    raw: data,
  };
}
