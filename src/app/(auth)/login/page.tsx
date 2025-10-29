"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useMagicLink, setUseMagicLink] = useState(false);
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
      if (useMagicLink) {
        // Magic Link (для production)
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          setMessage({
            type: "success",
            text: "Проверьте свою почту! Мы отправили вам ссылку для входа.",
          });
        }
      } else {
        // Password login (для разработки)
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          window.location.href = "/dashboard";
        }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Вход в Unte</h1>
        <p className="text-gray-600">Введите email для входа</p>
      </div>

      <div className="mb-4 flex justify-center space-x-4">
        <button
          type="button"
          onClick={() => setUseMagicLink(false)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            !useMagicLink
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          С паролем
        </button>
        <button
          type="button"
          onClick={() => setUseMagicLink(true)}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            useMagicLink
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Magic Link
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            placeholder="your@email.com"
            disabled={loading}
          />
        </div>

        {!useMagicLink && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
        )}

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
          {loading ? "Отправка..." : "Отправить ссылку"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Зарегистрироваться
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

