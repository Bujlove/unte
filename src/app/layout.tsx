import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unte - AI Рекрутинг Платформа",
  description: "Умный поиск кандидатов с помощью искусственного интеллекта",
  keywords: ["рекрутинг", "AI", "поиск кандидатов", "HR", "подбор персонала", "Unte"],
  authors: [{ name: "Unte" }],
  openGraph: {
    title: "Unte - AI Рекрутинг Платформа",
    description: "Умный поиск кандидатов с помощью искусственного интеллекта",
    type: "website",
    locale: "ru_RU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}

