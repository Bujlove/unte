import { createClient } from "@/lib/supabase/server";
import { SUBSCRIPTION_PLANS } from "@/types/billing";
import Link from "next/link";
import { daysUntil } from "@/lib/utils";

export default async function BillingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  const currentPlan = SUBSCRIPTION_PLANS.find((p) => p.id === profile.subscription_type);
  const trialDaysLeft = 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Управление подпиской</h1>

      {/* Current Subscription */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Текущий тариф</h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-primary">{currentPlan?.name}</h3>
            <p className="text-gray-600 mt-1">
              {`${profile.searches_count} / ${profile.searches_limit} поисков использовано`}
            </p>
          </div>
          <div>
            {currentPlan && currentPlan.price > 0 && (
              <p className="text-3xl font-bold">
                ₽{currentPlan.price.toLocaleString()}
                <span className="text-lg text-gray-600">/мес</span>
              </p>
            )}
          </div>
        </div>

        {/* Нет пробного периода в текущей тарифной модели */}
      </div>

      {/* Available Plans */}
      {profile.subscription_type !== "start" && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Доступные тарифы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SUBSCRIPTION_PLANS.filter((p) => p.id !== profile.subscription_type).map(
              (plan) => (
                <div key={plan.id} className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-3xl font-bold text-primary mb-4">
                    ₽{plan.price.toLocaleString()}
                    <span className="text-lg text-gray-600">/мес</span>
                  </p>
                  <ul className="space-y-2 mb-6">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm">
                        <span className="text-primary mr-2">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-600 transition">
                    Выбрать тариф
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Интеграция с ЮKassa в разработке
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Статистика использования</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-600 text-sm mb-1">Поиски в этом месяце</p>
            <p className="text-3xl font-bold text-gray-900">{profile.searches_count}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1">Лимит поисков</p>
            <p className="text-3xl font-bold text-gray-900">
              {profile.searches_limit}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1">Остаток</p>
            <p className="text-3xl font-bold text-primary">
              {profile.searches_limit - profile.searches_count}
            </p>
          </div>
        </div>

        {profile.subscription_type !== "start" && (
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    (profile.searches_count / profile.searches_limit) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">История платежей</h2>
        <p className="text-gray-600 text-center py-8">
          У вас пока нет платежей. Интеграция с платежной системой ЮKassa будет добавлена в
          ближайшее время.
        </p>
      </div>

      <div className="mt-8 text-center">
        <Link href="/pricing" className="text-primary hover:underline">
          Посмотреть все тарифы →
        </Link>
      </div>
    </div>
  );
}

