import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "NEURAL SCANNER — Brain Age Test",
  description:
    "Teste ton âge cérébral avec le Neural Scanner. Un test de mémoire futuriste basé sur la neuroscience.",
  keywords: ["brain age", "test cérébral", "mémoire", "neural scanner", "jeu de mémoire"],
  openGraph: {
    title: "NEURAL SCANNER — Brain Age Test",
    description: "Mon cerveau a 22 ans ! Et toi ? 🧠⚡ Teste ton âge cérébral maintenant.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEURAL SCANNER — Brain Age Test",
    description: "Mon cerveau a 22 ans ! Et toi ? 🧠⚡",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4982670575791963"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen flex flex-col relative">
        {/* ── Top AdSense Banner (728x90) ── */}
        <div className="w-full flex justify-center py-2 relative z-10">
          <div className="glass rounded-lg flex items-center justify-center text-violet-400/40 font-mono text-xs"
            style={{ width: '728px', maxWidth: '100%', height: '90px' }}>
            [ AD SPACE — 728×90 ]
          </div>
        </div>
        {/* ── Main Content ── */}
        <main className="flex-1 flex items-start justify-center relative z-10 px-4 py-8 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
