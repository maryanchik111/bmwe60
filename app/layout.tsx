import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";

const onest = Onest({ subsets: ["latin", "cyrillic"], variable: "--font-onest" });

export const metadata: Metadata = {
  title: "Збір на BMW E60 530d — допоможи з мрією",
  description:
    "Збираю на BMW E60 3.0 дизель. Ціль — $8000. Підтримай і отримай рекламу свого повідомлення на сайті.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={onest.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
