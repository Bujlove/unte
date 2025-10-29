import Link from "next/link";
import { SUBSCRIPTION_PLANS } from "@/types/billing";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Выберите свой тариф</h1>
          <p className="text-xl text-gray-600">
            Найдите идеальных кандидатов с помощью AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-xl p-8 relative ${
                plan.popular ? "ring-2 ring-primary" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-8 transform -translate-y-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Популярный
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-primary">
                    {plan.price === 0 ? "Бесплатно" : `₽${plan.price.toLocaleString()}`}
                  </span>
                  {plan.price > 0 && <span className="text-gray-600 ml-2">/мес</span>}
                </div>
              </div>

              <div className="mb-8">
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.searchesLimit === -1
                      ? "∞"
                      : plan.searchesLimit}
                  </span>
                  <span className="text-gray-600 ml-2">
                    {plan.searchesLimit === -1 ? "поисков" : "поисков"}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-primary mr-2 text-xl">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.id === "trial" ? "/register" : "/billing"}
                className={`block w-full text-center py-3 rounded-lg font-semibold transition ${
                  plan.popular
                    ? "bg-primary text-white hover:bg-primary-600"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                {plan.id === "trial" ? "Попробовать бесплатно" : "Выбрать тариф"}
              </Link>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Сравнение тарифов
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4">Функция</th>
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <th key={plan.id} className="text-center py-4 px-4">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-4">Поиски в месяц</td>
                  <td className="text-center py-4 px-4">10</td>
                  <td className="text-center py-4 px-4">100</td>
                  <td className="text-center py-4 px-4">Неограниченно</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">AI-ассистент</td>
                  <td className="text-center py-4 px-4">✓</td>
                  <td className="text-center py-4 px-4">✓</td>
                  <td className="text-center py-4 px-4">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">Сохранение кандидатов</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4">✓</td>
                  <td className="text-center py-4 px-4">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">Экспорт в Excel</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4">✓</td>
                  <td className="text-center py-4 px-4">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">Шаблоны запросов</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">Email-уведомления</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4">✓</td>
                </tr>
                <tr>
                  <td className="py-4 px-4">Поддержка</td>
                  <td className="text-center py-4 px-4">Email</td>
                  <td className="text-center py-4 px-4">Email</td>
                  <td className="text-center py-4 px-4">Приоритетная</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="text-gray-600 hover:text-primary transition">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}

