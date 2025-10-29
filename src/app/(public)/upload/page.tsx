"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Link from "next/link";

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    uploadToken?: string;
    resumeId?: string;
  } | null>(null);
  const [processingStatus, setProcessingStatus] = useState<{
    status: 'processing' | 'active' | 'failed';
    resume?: any;
  } | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setSelectedFile(file);
      setResult(null);
    },
    []
  );

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Пожалуйста, выберите файл");
      return;
    }

    setUploading(true);
    setResult(null);
    setProcessingStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("consent", "true");

      const response = await fetch("/api/resumes/upload-async", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.message,
          uploadToken: data.uploadToken,
          resumeId: data.resumeId,
        });
        setProcessingStatus({ status: 'processing' });
        setSelectedFile(null);
        
        // Start polling for status updates
        pollStatus(data.resumeId);
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
    }
  };

  const pollStatus = async (resumeId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/resumes/status/${resumeId}`);
        const data = await response.json();
        
        if (data.success) {
          setProcessingStatus({
            status: data.resume.status,
            resume: data.resume
          });
          
          // Stop polling if processing is complete
          if (data.resume.status === 'active' || data.resume.status === 'failed') {
            return;
          }
        }
        
        // Continue polling if still processing
        if (processingStatus?.status === 'processing') {
          setTimeout(poll, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    };
    
    poll();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      // PDF types
      "application/pdf": [".pdf"],
      "application/x-pdf": [".pdf"],
      "application/acrobat": [".pdf"],
      "text/pdf": [".pdf"],
      
      // DOCX types
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.template": [".docx"],
      "application/zip": [".docx"], // Sometimes DOCX is detected as ZIP
      
      // DOC types
      "application/msword": [".doc"],
      "application/vnd.ms-word": [".doc"],
      "application/x-msword": [".doc"],
      
      // Text types
      "text/plain": [".txt"],
      "text/txt": [".txt"],
      "text/rtf": [".rtf"],
      "application/rtf": [".rtf"],
      
      // Generic types (will be validated by file extension)
      "application/octet-stream": [".pdf", ".docx", ".doc", ".txt", ".rtf"],
      "application/binary": [".pdf", ".docx", ".doc", ".txt", ".rtf"],
      "application/x-binary": [".pdf", ".docx", ".doc", ".txt", ".rtf"],
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
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              {isDragActive ? (
                <p className="text-xl text-primary font-semibold">Отпустите файл здесь...</p>
              ) : (
                <>
                  <p className="text-xl font-semibold text-gray-700">
                    Перетащите резюме сюда или нажмите для выбора
                  </p>
                      <p className="text-sm text-gray-500">
                        Поддерживаемые форматы: PDF, DOCX, DOC, TXT, RTF (макс. 10MB)
                      </p>
                </>
              )}
            </div>
          </div>

          {selectedFile && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Загружаем...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Загрузить резюме</span>
                </>
              )}
            </button>
            {!selectedFile && (
              <p className="text-sm text-gray-500 text-center mt-2">
                Сначала выберите файл резюме
              </p>
            )}
            {selectedFile && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Нажимая кнопку &quot;Загрузить резюме&quot;, вы даете согласие на обработку персональных данных. 
                Резюме будет храниться 180 дней и автоматически удалено после этого срока.
              </p>
            )}
          </div>

          {processingStatus && (
            <div className="mt-6">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span className="text-sm text-gray-600">
                  {processingStatus.status === 'processing' && 'Обрабатываем резюме...'}
                  {processingStatus.status === 'active' && 'Резюме успешно обработано!'}
                  {processingStatus.status === 'failed' && 'Ошибка обработки резюме'}
                </span>
              </div>
              
              {processingStatus.status === 'processing' && (
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-full animate-pulse" style={{ width: '100%' }} />
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                {processingStatus.status === 'processing' && 'AI анализирует ваш опыт и навыки...'}
                {processingStatus.status === 'active' && 'Ваше резюме готово к поиску!'}
                {processingStatus.status === 'failed' && 'Попробуйте загрузить резюме снова'}
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
              
              {result.success && processingStatus?.status === 'active' && processingStatus.resume && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-3">Извлеченные данные:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Имя:</span>
                      <span className="ml-2 text-gray-900">{processingStatus.resume.fullName || "Не указано"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Должность:</span>
                      <span className="ml-2 text-gray-900">{processingStatus.resume.lastPosition || "Не указано"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Компания:</span>
                      <span className="ml-2 text-gray-900">{processingStatus.resume.lastCompany || "Не указано"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Опыт:</span>
                      <span className="ml-2 text-gray-900">{processingStatus.resume.experienceYears || 0} лет</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Локация:</span>
                      <span className="ml-2 text-gray-900">{processingStatus.resume.location || "Не указано"}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Качество:</span>
                      <span className="ml-2 text-gray-900">{processingStatus.resume.qualityScore || 0}%</span>
                    </div>
                  </div>
                </div>
              )}
              
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

