import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Get basic stats
  const { count: usersCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: resumesCount } = await supabase
    .from("resumes")
    .select("*", { count: "exact", head: true });

  const { count: searchesCount } = await supabase
    .from("searches")
    .select("*", { count: "exact", head: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-primary">Админ-панель</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
              >
                К поиску →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Обзор системы</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-gray-600 text-sm mb-1">Всего пользователей</p>
            <p className="text-4xl font-bold text-primary">{usersCount || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-gray-600 text-sm mb-1">Всего резюме</p>
            <p className="text-4xl font-bold text-primary">{resumesCount || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-gray-600 text-sm mb-1">Всего поисков</p>
            <p className="text-4xl font-bold text-primary">{searchesCount || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <h3 className="font-semibold mb-2">📊 Supabase Dashboard</h3>
              <p className="text-sm text-gray-600">
                Управление базой данных, пользователями и настройками
              </p>
            </a>
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-not-allowed opacity-50">
              <h3 className="font-semibold mb-2">👥 Управление пользователями</h3>
              <p className="text-sm text-gray-600">В разработке</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-not-allowed opacity-50">
              <h3 className="font-semibold mb-2">📄 Модерация резюме</h3>
              <p className="text-sm text-gray-600">В разработке</p>
            </div>
            <div className="border rounded-lg p-4 hover:bg-gray-50 transition cursor-not-allowed opacity-50">
              <h3 className="font-semibold mb-2">📈 Подробная аналитика</h3>
              <p className="text-sm text-gray-600">В разработке</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Информация</h3>
          <p className="text-blue-800">
            Полноценная админ-панель с графиками, управлением пользователями и модерацией будет
            добавлена в следующих версиях. Пока используйте Supabase Dashboard для расширенного
            управления.
          </p>
        </div>
      </main>
    </div>
  );
}

