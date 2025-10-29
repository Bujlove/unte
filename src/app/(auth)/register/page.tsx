"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    companyName: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
          },
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Проверьте свою почту! Мы отправили вам ссылку для завершения регистрации.",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Произошла ошибка. Попробуйте снова." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Image src="/logo.svg" alt="Unte Logo" width={48} height={48} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Регистрация в Unte</h1>
        <p className="text-gray-600">Создайте аккаунт и получите 7 дней бесплатно</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Ваше имя
          </label>
          <input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            placeholder="Иван Иванов"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            placeholder="your@email.com"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
            Название компании (опционально)
          </label>
          <input
            id="companyName"
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            placeholder="ООО 'Рога и копыта'"
            disabled={loading}
          />
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Регистрация..." : "Зарегистрироваться"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Войти
          </Link>
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← Вернуться на главную
        </Link>
      </div>
    </div>
  );
}

