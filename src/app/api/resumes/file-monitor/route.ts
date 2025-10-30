import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createAdminClient();

    // Строим запрос с фильтрами
    let query = supabase
      .from("file_processing_monitor")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Добавляем фильтр по статусу если указан
    if (status && status !== 'all') {
      query = query.eq("processing_status", status);
    }

    const { data: files, error: filesError } = await query;

    if (filesError) {
      console.error("❌ Ошибка получения файлов:", filesError);
      return NextResponse.json({
        success: false,
        error: "Не удалось получить список файлов",
        details: filesError.message
      });
    }

    // Получаем общее количество для пагинации
    let countQuery = supabase
      .from("file_processing_monitor")
      .select("*", { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq("processing_status", status);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error("❌ Ошибка получения количества файлов:", countError);
    }

    // Обрабатываем данные для фронтенда
    const processedFiles = (files || []).map(file => ({
      id: file.id,
      fileName: file.file_name,
      fileSize: file.file_size,
      mimeType: file.mime_type,
      status: file.processing_status,
      statusColor: getStatusColor(file.processing_status),
      startedAt: file.processing_started_at,
      completedAt: file.processing_completed_at,
      duration: file.processing_duration_seconds,
      error: file.processing_error,
      fileHash: file.file_hash,
      fileUrl: file.file_url,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      candidate: {
        fullName: file.full_name,
        position: file.current_position,
        experience: file.experience_years
      }
    }));

    // Группируем по статусам для статистики
    const statusGroups = processedFiles.reduce((acc: any, file: any) => {
      const status = file.status || 'unknown';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(file);
      return acc;
    }, {});

    const result = {
      success: true,
      files: processedFiles,
      pagination: {
        total: totalCount || 0,
        limit: limit,
        offset: offset,
        hasMore: (offset + limit) < (totalCount || 0)
      },
      summary: {
        total: totalCount || 0,
        byStatus: Object.keys(statusGroups).reduce((acc: any, status: string) => {
          acc[status] = statusGroups[status].length;
          return acc;
        }, {}),
        recent: processedFiles.filter(f => {
          const createdAt = new Date(f.createdAt);
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          return createdAt > oneDayAgo;
        }).length
      },
      filters: {
        availableStatuses: [
          { value: 'all', label: 'Все', count: totalCount || 0 },
          { value: 'pending', label: 'Ожидает', count: statusGroups.pending?.length || 0 },
          { value: 'processing', label: 'Обрабатывается', count: statusGroups.processing?.length || 0 },
          { value: 'completed', label: 'Завершено', count: statusGroups.completed?.length || 0 },
          { value: 'failed', label: 'Ошибка', count: statusGroups.failed?.length || 0 }
        ]
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ Ошибка получения мониторинга файлов:", error);
    return NextResponse.json({
      success: false,
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Вспомогательная функция для определения цвета статуса
function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#f59e0b'; // yellow
    case 'processing':
      return '#3b82f6'; // blue
    case 'completed':
      return '#10b981'; // green
    case 'failed':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}
