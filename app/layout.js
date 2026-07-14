import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "تجارتي",
  description: "منصة إدارة تجارة الجملة",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
