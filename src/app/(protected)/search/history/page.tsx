"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";

interface SearchHistoryItem {
  id: string;
  query: string;
  filters: any;
  results_count: number;
  created_at: string;
  is_template: boolean;
  template_name?: string;
}

export default function SearchHistoryPage() {
  const [searches, setSearches] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchSearchHistory();
  }, [fetchSearchHistory]);

  const fetchSearchHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Пользователь не авторизован");
        return;
      }

      const { data, error } = await supabase
        .from("searches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setError("Ошибка загрузки истории поиска");
        return;
      }

      setSearches(data || []);
    } catch (err) {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFilters = (filters: any) => {
    if (!filters) return "Нет фильтров";
    
    const parts = [];
    if (filters.position) parts.push(`Должность: ${filters.position}`);
    if (filters.skills && filters.skills.length > 0) {
      parts.push(`Навыки: ${filters.skills.join(", ")}`);
    }
    if (filters.experienceYears) {
      const { min, max } = filters.experienceYears;
      parts.push(`Опыт: ${min || 0}-${max || "∞"} лет`);
    }
    if (filters.location) parts.push(`Локация: ${filters.location}`);
    
    return parts.length > 0 ? parts.join(" • ") : "Нет фильтров";
  };

  const continueSearch = (search: SearchHistoryItem) => {
    // Переходим на дашборд с предзаполненными требованиями
    const searchParams = new URLSearchParams({
      query: search.query,
      filters: JSON.stringify(search.filters),
    });
    window.location.href = `/dashboard?${searchParams.toString()}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем историю поиска...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ошибка загрузки</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSearchHistory}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">История поиска</h1>
            <p className="text-gray-600">
              Просматривайте и продолжайте ваши предыдущие поиски кандидатов
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Новый поиск</span>
          </Link>
        </div>
      </div>

      {searches.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">История поиска пуста</h3>
          <p className="text-gray-600 mb-4">
            Вы еще не выполняли поиск кандидатов. Начните с создания первого запроса.
          </p>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600"
          >
            Начать поиск
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searches.map((search) => (
            <div
              key={search.id}
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
                    {search.query}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {formatDate(search.created_at)}
                  </p>
                  {search.is_template && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Шаблон: {search.template_name || "Без названия"}
                    </span>
                  )}
                </div>
                <div className="ml-4 text-right">
                  <div className="text-2xl font-bold text-primary">
                    {search.results_count}
                  </div>
                  <div className="text-sm text-gray-500">найдено</div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {formatFilters(search.filters)}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => continueSearch(search)}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 text-sm font-medium"
                >
                  Продолжить поиск
                </button>
                <button
                  onClick={() => {
                    // TODO: Реализовать просмотр результатов
                    alert("Функция просмотра результатов будет добавлена");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Результаты
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
