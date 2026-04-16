import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Ligare — Cuidado Conectado para Igrejas",
  description:
    "Plataforma de cuidado, acompanhamento pastoral e comunicação estruturada para igrejas. Kids Check-in, Follow-up, WhatsApp centralizado.",
  keywords: [
    "igreja",
    "gestão de igreja",
    "kids check-in",
    "follow-up pastoral",
    "células",
    "membros",
    "SaaS para igrejas",
  ],
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Ligare — Cuidado Conectado para Igrejas",
    description:
      "Sistema operacional de relacionamento e cuidado para a sua igreja.",
    type: "website",
    images: ["/brand/ligare-horizontal.png"],
  },
  other: {
    "theme-color": "#0F172A",
    "msapplication-TileColor": "#0F172A",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
