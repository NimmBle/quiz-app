import type { Metadata } from "next";
import { Sofia_Sans } from "next/font/google";
import "./globals.css";

// Force all pages to be rendered dynamically (real-time platform, no build-time DB queries)
export const dynamic = "force-dynamic";

const sofiaSans = Sofia_Sans({
  variable: "--font-sofia-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Аз мога — тук и сега",
  description: 'Квиз платформа на „Аз мога — тук и сега"',
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <body className={`${sofiaSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
