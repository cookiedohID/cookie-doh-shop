import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Cookie Doh — Where the cookie magic happens",
  description: "Build your own cookie box (1, 3, or 6) with same-day or next-day delivery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="topbar">
          <div className="topbar-inner">
            <Link href="/" style={{ fontWeight: 900 }}>
              Cookie Doh
            </Link>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="pill">Where the cookie magic happens</span>
              <Link className="pill" href="/cart">
                Cart
              </Link>
              <Link className="pill" href="/admin/orders">
                Admin
              </Link>
            </div>
          </div>
        </div>

        <div className="container">{children}</div>
      </body>
    </html>
  );
}
