import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

// DM Sans es la tipografia real de Wayground. next/font la auto-aloja, asi
// que se sirve desde el mismo dominio y cumple la CSP (font-src 'self').
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuizColegio — Sistema de Quizzes",
  description: "Plataforma de gestión y aplicación de quizzes escolares",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-plum">
        {children}
      </body>
    </html>
  );
}
