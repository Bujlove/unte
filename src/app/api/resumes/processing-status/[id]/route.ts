import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resumeId } = await params;
    
    if (!resumeId) {
      return NextResponse.json({
        success: false,
        error: "ID резюме не предоставлен"
      }, { status: 400 });
    }

    const supabase = await createAdminClient();

    // Получаем детальную информацию о резюме
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select(`
        id,
        file_name,
        file_size,
        mime_type,
        processing_status,
        processing_started_at,
        processing_completed_at,
        processing_error,
        processing_steps,
        file_metadata,
        file_hash,
        file_url,
        created_at,
        updated_at,
        full_name,
        email,
        phone,
        last_position,
        experience_years,
        quality_score
      `)
      .eq('id', resumeId)
      .single();

    if (resumeError) {
      console.error("❌ Ошибка получения резюме:", resumeError);
      return NextResponse.json({
        success: false,
        error: "Резюме не найдено",
        details: resumeError.message
      }, { status: 404 });
    }

    // Получаем сводку резюме
    const { data: summary } = await supabase
      .from("resume_summaries")
      .select("*")
      .eq("resume_id", resumeId)
      .single();

    // Вычисляем статистику обработки
    const processingDuration = resume.processing_completed_at && resume.processing_started_at
      ? Math.round((new Date(resume.processing_completed_at).getTime() - new Date(resume.processing_started_at).getTime()) / 1000)
      : null;

    // Анализируем шаги обработки
    const steps = resume.processing_steps || [];
    const completedSteps = steps.filter((step: any) => step.status === 'completed').length;
    const totalSteps = steps.length;

    // Определяем прогресс
    let progress = 0;
    if (resume.processing_status === 'completed') {
      progress = 100;
    } else if (resume.processing_status === 'failed') {
      progress = Math.round((completedSteps / Math.max(totalSteps, 1)) * 100);
    } else if (resume.processing_status === 'processing') {
      progress = Math.round((completedSteps / Math.max(totalSteps, 1)) * 90); // 90% максимум для processing
    }

    const result = {
      success: true,
      resume: {
        id: resume.id,
        fileName: resume.file_name,
        fileSize: resume.file_size,
        mimeType: resume.mime_type,
        fileHash: resume.file_hash,
        fileUrl: resume.file_url,
        createdAt: resume.created_at,
        updatedAt: resume.updated_at
      },
      processing: {
        status: resume.processing_status,
        progress: progress,
        startedAt: resume.processing_started_at,
        completedAt: resume.processing_completed_at,
        duration: processingDuration,
        error: resume.processing_error,
        steps: steps.map((step: any) => ({
          name: step.step,
          status: step.status,
          timestamp: step.timestamp,
          duration: step.duration
        }))
      },
      data: {
        fullName: resume.full_name,
        email: resume.email,
        phone: resume.phone,
        position: resume.last_position,
        experience: resume.experience_years,
        qualityScore: resume.quality_score
      },
      summary: summary ? {
        id: summary.id,
        quickId: summary.quick_id,
        fullName: summary.full_name,
        position: summary.current_position,
        company: summary.current_company,
        experience: summary.experience_years,
        skills: summary.skills || [],
        languages: summary.languages || [],
        location: summary.location
      } : null,
      metadata: resume.file_metadata || {}
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ Ошибка получения статуса обработки:", error);
    return NextResponse.json({
      success: false,
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
