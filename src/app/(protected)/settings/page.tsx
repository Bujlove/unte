import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Настройки</h1>

      {/* Profile Settings */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Профиль</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
            <input
              type="text"
              defaultValue={profile?.full_name || ""}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ваше имя"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={user.email || ""}
              disabled
              className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название компании
            </label>
            <input
              type="text"
              defaultValue={profile?.company_name || ""}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="ООО 'Рога и копыта'"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
            <input
              type="tel"
              defaultValue={profile?.phone || ""}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="+7 (999) 123-45-67"
            />
          </div>
          <button className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600">
            Сохранить изменения
          </button>
        </div>
      </div>

      {/* Email Notifications */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Email уведомления</h2>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-gray-700">Уведомления о новых подходящих кандидатах</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-gray-700">Еженедельный дайджест</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-gray-700">Маркетинговые рассылки</span>
          </label>
        </div>
      </div>

      {/* API Keys (Future) */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">API ключи</h2>
        <p className="text-gray-600 mb-4">
          API для интеграции с вашими системами будет доступен в будущих версиях.
        </p>
        <button
          disabled
          className="bg-gray-300 text-gray-500 px-6 py-2 rounded-lg font-semibold cursor-not-allowed"
        >
          Генерировать ключ
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <h2 className="text-xl font-semibold text-red-600 mb-4">Опасная зона</h2>
        <p className="text-gray-600 mb-4">
          Удаление аккаунта приведет к безвозвратному удалению всех ваших данных.
        </p>
        <button className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700">
          Удалить аккаунт
        </button>
      </div>
    </div>
  );
}

