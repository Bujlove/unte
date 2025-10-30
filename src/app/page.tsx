import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Image src="/logo.svg" alt="Unte Logo" width={40} height={40} />
              <span className="text-2xl font-bold text-gray-900">Unte</span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/pricing"
                className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
              >
                Тарифы
              </Link>
              <Link
                href="/login"
                className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                title="Вход для рекрутеров и нанимающих менеджеров"
              >
                Войти (для рекрутеров)
              </Link>
              <Link
                href="/register"
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-600"
              >
                Начать бесплатно
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Найдите идеального кандидата
            <br />
            <span className="text-primary">с помощью AI</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Умная платформа для рекрутинга, которая использует искусственный интеллект для
            семантического поиска кандидатов и анализа резюме
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 transition text-lg"
            >
              Попробовать бесплатно
            </Link>
            <Link
              href="/upload"
              className="px-8 py-4 bg-white text-primary border-2 border-primary rounded-lg font-semibold hover:bg-primary-50 transition text-lg"
            >
              Загрузить резюме
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            10 поисков бесплатно
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">AI Ассистент</h3>
            <p className="text-gray-600">
              Опишите требования в чате, AI поможет сформулировать точный запрос и найдет
              подходящих кандидатов
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Семантический поиск</h3>
            <p className="text-gray-600">
              Не просто ключевые слова - умный поиск понимает контекст и находит релевантных
              специалистов
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Быстрый результат</h3>
            <p className="text-gray-600">
              Мгновенный анализ резюме и поиск кандидатов среди тысяч профилей за секунды
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Как это работает</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6 text-primary">Для соискателей</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Загрузите резюме</h4>
                    <p className="text-gray-600">
                      PDF, DOCX или DOC - система примет любой формат
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">AI проанализирует ваш опыт</h4>
                    <p className="text-gray-600">
                      Автоматическое извлечение навыков, опыта и квалификации
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Рекрутеры найдут вас</h4>
                    <p className="text-gray-600">
                      Ваше резюме появится в результатах релевантных поисков
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6 text-primary">Для рекрутеров</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Опишите требования</h4>
                    <p className="text-gray-600">
                      В чате с AI расскажите о вакансии и нужных навыках
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Получите подборку</h4>
                    <p className="text-gray-600">
                      Система найдет подходящих кандидатов с оценкой соответствия
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Свяжитесь с кандидатами</h4>
                    <p className="text-gray-600">Контакты и детали - все в одном месте</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Готовы начать?</h2>
          <p className="text-xl mb-8 opacity-90">
            Попробуйте бесплатно.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition text-lg"
          >
            Начать бесплатно
          </Link>
        </div>
      </section>

      {/* Footer removed: global footer in RootLayout */}
    </div>
  );
}

