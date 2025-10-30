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
      <body className="antialiased">
        {children}
        <footer className="mt-16 border-t">
          <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-gray-600">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>© {new Date().getFullYear()} Unte</div>
              <div className="space-x-4">
                <a href="tel:+79125812470" className="hover:text-primary">Тел: +7 912 581 24 70</a>
                <a href="mailto:buylovda@gmail.com" className="hover:text-primary">Email: buylovda@gmail.com</a>
                <a href="https://t.me/meetieru" target="_blank" rel="noopener noreferrer" className="hover:text-primary">Telegram: @meetieru</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

