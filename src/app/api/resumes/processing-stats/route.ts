import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient();

    // Получаем общую статистику
    const { data: stats, error: statsError } = await supabase
      .rpc('get_processing_stats');

    if (statsError) {
      console.error("❌ Ошибка получения статистики:", statsError);
      return NextResponse.json({
        success: false,
        error: "Не удалось получить статистику обработки",
        details: statsError.message
      });
    }

    // Получаем детальную статистику по статусам
    const { data: statusStats, error: statusError } = await supabase
      .from("resumes")
      .select("processing_status, created_at")
      .not("processing_status", "is", null);

    if (statusError) {
      console.error("❌ Ошибка получения статистики по статусам:", statusError);
    }

    // Группируем по статусам
    const statusCounts = (statusStats || []).reduce((acc: any, resume: any) => {
      const status = resume.processing_status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Получаем статистику за последние 24 часа
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: recentStats, error: recentError } = await supabase
      .from("resumes")
      .select("processing_status, processing_started_at, processing_completed_at")
      .gte("created_at", yesterday.toISOString());

    if (recentError) {
      console.error("❌ Ошибка получения недавней статистики:", recentError);
    }

    // Анализируем недавние данные
    const recentCounts = (recentStats || []).reduce((acc: any, resume: any) => {
      const status = resume.processing_status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // Вычисляем среднее время обработки
    const completedResumes = (recentStats || []).filter((r: any) => 
      r.processing_status === 'completed' && 
      r.processing_started_at && 
      r.processing_completed_at
    );

    const avgProcessingTime = completedResumes.length > 0
      ? completedResumes.reduce((sum: number, resume: any) => {
          const start = new Date(resume.processing_started_at).getTime();
          const end = new Date(resume.processing_completed_at).getTime();
          return sum + (end - start);
        }, 0) / completedResumes.length / 1000 // в секундах
      : 0;

    // Получаем топ ошибок
    const { data: errorStats, error: errorStatsError } = await supabase
      .from("resumes")
      .select("processing_error")
      .eq("processing_status", "failed")
      .not("processing_error", "is", null);

    if (errorStatsError) {
      console.error("❌ Ошибка получения статистики ошибок:", errorStatsError);
    }

    const errorCounts = (errorStats || []).reduce((acc: any, resume: any) => {
      const error = resume.processing_error || 'Unknown error';
      // Группируем похожие ошибки
      const normalizedError = error.toLowerCase()
        .replace(/\d+/g, 'X') // Заменяем числа на X
        .replace(/['"]/g, '') // Убираем кавычки
        .substring(0, 100); // Ограничиваем длину
      
      acc[normalizedError] = (acc[normalizedError] || 0) + 1;
      return acc;
    }, {});

    // Сортируем ошибки по частоте
    const topErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));

    const result = {
      success: true,
      overview: {
        totalFiles: stats[0]?.total_files || 0,
        pendingFiles: stats[0]?.pending_files || 0,
        processingFiles: stats[0]?.processing_files || 0,
        completedFiles: stats[0]?.completed_files || 0,
        failedFiles: stats[0]?.failed_files || 0,
        avgProcessingTime: Math.round(avgProcessingTime)
      },
      statusBreakdown: {
        all: statusCounts,
        last24h: recentCounts
      },
      performance: {
        avgProcessingTimeSeconds: Math.round(avgProcessingTime),
        successRate: stats[0]?.total_files > 0 
          ? Math.round((stats[0]?.completed_files / stats[0]?.total_files) * 100)
          : 0,
        failureRate: stats[0]?.total_files > 0
          ? Math.round((stats[0]?.failed_files / stats[0]?.total_files) * 100)
          : 0
      },
      errors: {
        totalErrors: stats[0]?.failed_files || 0,
        topErrors: topErrors
      },
      recentActivity: {
        last24h: {
          total: Object.values(recentCounts).reduce((sum: number, count: any) => sum + count, 0),
          completed: recentCounts.completed || 0,
          failed: recentCounts.failed || 0,
          processing: recentCounts.processing || 0
        }
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ Ошибка получения статистики обработки:", error);
    return NextResponse.json({
      success: false,
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
