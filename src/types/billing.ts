/**
 * Billing and subscription types
 */

export type SubscriptionType = "trial" | "start" | "pro";
export type SubscriptionStatus = "active" | "cancelled" | "expired";

export interface SubscriptionPlan {
  id: SubscriptionType;
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  searchesLimit: number;
  features: string[];
  popular?: boolean;
}

export interface UserSubscription {
  type: SubscriptionType;
  status: SubscriptionStatus;
  searchesCount: number;
  searchesLimit: number;
  subscriptionEnd: string | null;
  trialEndsAt: string | null;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  externalId: string | null;
  createdAt: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "trial",
    name: "Пробный",
    price: 0,
    currency: "RUB",
    interval: "month",
    searchesLimit: 10,
    features: [
      "10 поисков кандидатов",
      "AI-ассистент",
      "Базовые фильтры",
      "7 дней доступа",
    ],
  },
  {
    id: "start",
    name: "Старт",
    price: 5900,
    currency: "RUB",
    interval: "month",
    searchesLimit: 100,
    features: [
      "100 поисков в месяц",
      "AI-ассистент",
      "Расширенные фильтры",
      "Сохранение кандидатов",
      "Экспорт в Excel",
      "История поисков",
    ],
  },
  {
    id: "pro",
    name: "Про",
    price: 14900,
    currency: "RUB",
    interval: "month",
    searchesLimit: -1, // unlimited
    popular: true,
    features: [
      "Неограниченные поиски",
      "AI-ассистент",
      "Все фильтры",
      "Сохранение кандидатов",
      "Экспорт в Excel/CSV",
      "История поисков",
      "Шаблоны запросов",
      "Email-уведомления",
      "Приоритетная поддержка",
    ],
  },
];

