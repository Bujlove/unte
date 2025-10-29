import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Проверяем новые поля в Supabase...");
    
    const supabase = await createAdminClient();

    // Проверяем, есть ли новые поля в таблице resumes
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select(`
        id,
        file_name,
        file_hash,
        processing_status,
        processing_started_at,
        processing_completed_at,
        processing_error,
        processing_steps,
        file_metadata,
        created_at
      `)
      .limit(1);

    if (resumeError) {
      console.error("❌ Ошибка проверки новых полей:", resumeError);
      return NextResponse.json({
        success: false,
        error: "Не удалось проверить новые поля",
        details: resumeError.message
      });
    }

    // Проверяем функцию get_processing_stats
    const { data: stats, error: statsError } = await supabase
      .rpc('get_processing_stats');

    if (statsError) {
      console.error("❌ Ошибка функции статистики:", statsError);
    }

    // Проверяем представление file_processing_monitor
    const { data: monitor, error: monitorError } = await supabase
      .from("file_processing_monitor")
      .select("*")
      .limit(3);

    if (monitorError) {
      console.error("❌ Ошибка представления мониторинга:", monitorError);
    }

    // Создаем тестовую запись с новыми полями
    const testData = {
      file_name: 'test-new-fields.pdf',
      file_size: 1024,
      mime_type: 'application/pdf',
      file_hash: 'test-hash-' + Date.now(),
      processing_status: 'pending',
      processing_steps: [],
      file_metadata: {
        test: true,
        timestamp: new Date().toISOString()
      },
      status: 'processing'
    };

    const { data: testResume, error: testError } = await supabase
      .from("resumes")
      .insert(testData)
      .select()
      .single();

    if (testError) {
      console.error("❌ Ошибка создания тестовой записи:", testError);
    }

    // Тестируем функцию update_processing_status
    let updateTestResult = null;
    if (testResume) {
      const { error: updateError } = await supabase.rpc('update_processing_status', {
        resume_id: testResume.id,
        status: 'processing',
        step_name: 'test_step',
        error_message: null
      });

      updateTestResult = {
        success: !updateError,
        error: updateError?.message
      };

      // Очищаем тестовую запись
      await supabase
        .from("resumes")
        .delete()
        .eq('id', testResume.id);
    }

    const result = {
      success: true,
      message: "Проверка новых полей завершена",
      newFields: {
        available: resume && resume.length > 0,
        sampleData: resume?.[0] || null
      },
      functions: {
        get_processing_stats: {
          available: !statsError,
          data: stats,
          error: statsError?.message
        },
        update_processing_status: updateTestResult
      },
      views: {
        file_processing_monitor: {
          available: !monitorError,
          recordCount: monitor?.length || 0,
          sampleData: monitor?.[0] || null,
          error: monitorError?.message
        }
      },
      testRecord: {
        created: !!testResume,
        id: testResume?.id,
        error: testError?.message
      }
    };

    console.log("✅ Проверка новых полей завершена");
    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ Критическая ошибка при проверке новых полей:", error);
    return NextResponse.json({
      success: false,
      error: "Внутренняя ошибка сервера",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
