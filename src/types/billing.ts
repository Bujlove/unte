/**
 * Billing and subscription types
 */

export type SubscriptionType = "free" | "start";
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
    id: "free",
    name: "Бесплатный",
    price: 0,
    currency: "RUB",
    interval: "month",
    searchesLimit: 10,
    features: [
      "10 поисков в месяц",
      "AI-ассистент",
      "Базовые фильтры",
    ],
  },
  {
    id: "start",
    name: "Старт",
    price: 729,
    currency: "RUB",
    interval: "month",
    searchesLimit: 100,
    popular: true,
    features: [
      "100 поисков в месяц",
      "AI-ассистент",
      "Расширенные фильтры",
      "Сохранение кандидатов",
      "Экспорт в Excel",
      "История поисков",
    ],
  }
];

