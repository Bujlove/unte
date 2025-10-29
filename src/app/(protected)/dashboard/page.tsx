"use client";

import { useState } from "react";
import { ResumeSearchResult } from "@/types/resume";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function DashboardPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ResumeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/search/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          extractRequirements: messages.length >= 2, // Extract after a few messages
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
          },
        ]);

        // If requirements were extracted, perform search
        if (data.requirements) {
          await performSearch(data.requirements);
        }
      } else {
        alert(data.error || "Ошибка при обработке сообщения");
      }
    } catch (error) {
      console.error("Chat error:", error);
      alert("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (requirements: any) => {
    setSearching(true);

    try {
      const response = await fetch("/api/search/semantic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirements }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results);
      } else {
        alert(data.error || "Ошибка при поиске");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Ошибка сети");
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Поиск кандидатов</h1>
        <p className="text-gray-600">
          Опишите требования к кандидату, AI поможет вам сформулировать запрос и найдет подходящих
          специалистов
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chat Panel */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">AI Ассистент</h2>

          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">
                Привет! Я помогу вам найти идеального кандидата.
              </p>
              <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-500">
                <p>Начните с описания, например:</p>
                <p className="bg-gray-50 p-2 rounded">
                  &quot;Ищу Senior Python разработчика с опытом в Django и PostgreSQL&quot;
                </p>
                <p className="bg-gray-50 p-2 rounded">
                  &quot;Нужен маркетолог с опытом работы в B2B сегменте&quot;
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-4 h-96 overflow-y-auto">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                  />
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Опишите требования к кандидату..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "..." : "Отправить"}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Результаты поиска</h2>

          {searching ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Ищем подходящих кандидатов...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-600">
                Результаты поиска появятся здесь после того, как AI сформирует запрос
              </p>
            </div>
          ) : (
            <div className="space-y-4 h-[500px] overflow-y-auto">
              {searchResults.map((candidate) => (
                <div
                  key={candidate.id}
                  className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{candidate.fullName}</h3>
                    <span className="bg-primary text-white px-3 py-1 rounded-full text-sm">
                      {candidate.relevanceScore}%
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    {candidate.lastPosition} в {candidate.lastCompany}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    Опыт: {candidate.experienceYears} лет | {candidate.location}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 5 && (
                      <span className="text-gray-500 text-xs">
                        +{candidate.skills.length - 5}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button className="text-sm text-primary hover:underline">
                      Посмотреть профиль
                    </button>
                    <button className="text-sm text-primary hover:underline">
                      В избранное
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

