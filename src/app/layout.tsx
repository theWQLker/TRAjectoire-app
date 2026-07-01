import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Body / UI sans. Variable font → no explicit weight list needed.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Editorial serif — hero + page titles only (applied via .font-serif).
const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trajectoire — un miroir de réalité pour votre direction professionnelle",
  description:
    "Pas un test de personnalité. Trajectoire croise vos preuves et vos contraintes avec le marché de l'emploi français pour révéler des directions réalistes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${sourceSerif.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
