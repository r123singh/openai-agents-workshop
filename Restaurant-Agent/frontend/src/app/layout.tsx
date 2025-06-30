import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Restaurant Ordering Processing | Restaurant Agent",
  description: "Professional restaurant ordering agent. Process orders, track analytics, and manage documentation efficiently.",
  keywords: "restaurant ordering, restaurant agent, restaurant processing, restaurant documentation",
  authors: [{ name: "Restaurant Agent Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#4f8cff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
