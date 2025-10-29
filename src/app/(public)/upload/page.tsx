"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    uploadToken?: string;
  } | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!consent) {
        alert("Пожалуйста, дайте согласие на обработку персональных данных");
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      setUploading(true);
      setProgress(10);
      setResult(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("consent", "true");

        setProgress(30);

        const response = await fetch("/api/resumes/upload", {
          method: "POST",
          body: formData,
        });

        setProgress(80);

        const data = await response.json();

        setProgress(100);

        if (data.success) {
          setResult({
            success: true,
            message: data.message,
            uploadToken: data.uploadToken,
          });
        } else {
          setResult({
            success: false,
            message: data.error || "Произошла ошибка при загрузке",
          });
        }
      } catch (error) {
        setResult({
          success: false,
          message: "Ошибка сети. Попробуйте снова.",
        });
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(0), 1000);
      }
    },
    [consent]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: uploading,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Загрузите ваше резюме</h1>
          <p className="text-lg text-gray-600">
            Мы используем AI для анализа вашего резюме и помогаем рекрутерам найти вас
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-primary bg-primary-50"
                : "border-gray-300 hover:border-primary hover:bg-gray-50"
            } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <div className="text-6xl">📄</div>
              {isDragActive ? (
                <p className="text-xl text-primary font-semibold">Отпустите файл здесь...</p>
              ) : (
                <>
                  <p className="text-xl font-semibold text-gray-700">
                    Перетащите резюме сюда или нажмите для выбора
                  </p>
                  <p className="text-sm text-gray-500">
                    Поддерживаемые форматы: PDF, DOCX, DOC, TXT (макс. 10MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {uploading && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Обработка резюме...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Анализируем ваш опыт и навыки с помощью AI
              </p>
            </div>
          )}

          {result && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p
                className={`font-semibold mb-2 ${
                  result.success ? "text-green-800" : "text-red-800"
                }`}
              >
                {result.success ? "✓ Успешно!" : "✗ Ошибка"}
              </p>
              <p className={result.success ? "text-green-700" : "text-red-700"}>
                {result.message}
              </p>
              {result.uploadToken && (
                <div className="mt-4 p-3 bg-white rounded border border-green-300">
                  <p className="text-sm text-gray-700 mb-2">
                    Сохраните эту ссылку для обновления резюме в будущем:
                  </p>
                  <p className="text-xs text-gray-600 break-all font-mono">
                    {window.location.origin}/upload?token={result.uploadToken}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">
                Я даю согласие на обработку моих персональных данных. Резюме будет храниться 180
                дней и автоматически удалено после этого срока. Вы можете удалить резюме в любой
                момент, связавшись с нами.
              </span>
            </label>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            Что происходит с вашим резюме?
          </h2>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="mr-2">🔒</span>
              <span>Ваши данные защищены и используются только для поиска вакансий</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🤖</span>
              <span>AI анализирует ваш опыт, навыки и квалификацию</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">🎯</span>
              <span>Рекрутеры находят вас по релевантным запросам</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⏰</span>
              <span>Автоматическое удаление через 180 дней (GDPR compliance)</span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <Link href="/" className="text-gray-600 hover:text-primary transition">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}

