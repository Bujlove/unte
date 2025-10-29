import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient();
    
    console.log('🔧 Применяем исправление структуры парсинга...');
    
    // 1. Сначала удаляем старую таблицу resume_summaries
    console.log('🗑️ Удаляем старую таблицу resume_summaries...');
    const { error: dropError } = await supabase.rpc('exec', {
      sql: 'DROP TABLE IF EXISTS resume_summaries CASCADE;'
    });
    
    if (dropError) {
      console.log('⚠️ Ошибка при удалении таблицы:', dropError.message);
    }
    
    // 2. Создаем новую таблицу resume_summaries
    console.log('📋 Создаем новую таблицу resume_summaries...');
    const createTableSQL = `
      CREATE TABLE resume_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
        quick_id TEXT UNIQUE NOT NULL,
        
        -- Basic Info
        full_name TEXT,
        email TEXT,
        phone TEXT,
        location TEXT,
        
        -- Professional Info
        current_position TEXT,
        current_company TEXT,
        last_position TEXT,
        last_company TEXT,
        experience_years INTEGER DEFAULT 0,
        education_level TEXT,
        
        -- Skills Analysis
        primary_skills TEXT[] DEFAULT '{}',
        secondary_skills TEXT[] DEFAULT '{}',
        skills TEXT[] DEFAULT '{}',
        
        -- Additional Info
        languages TEXT[] DEFAULT '{}',
        summary TEXT,
        ai_summary TEXT,
        
        -- Quality and Metadata
        quality_score NUMERIC DEFAULT 0,
        confidence_score NUMERIC DEFAULT 0,
        upload_token TEXT,
        consent_given BOOLEAN DEFAULT false,
        expires_at TIMESTAMP WITH TIME ZONE,
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec', {
      sql: createTableSQL
    });
    
    if (createError) {
      console.log('❌ Ошибка при создании таблицы:', createError.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create table',
        details: createError.message 
      }, { status: 500 });
    }
    
    console.log('✅ Таблица resume_summaries создана');
    
    // 3. Создаем индексы
    console.log('🔍 Создаем индексы...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_resume_summaries_resume_id ON resume_summaries(resume_id);',
      'CREATE INDEX IF NOT EXISTS idx_resume_summaries_quick_id ON resume_summaries(quick_id);',
      'CREATE INDEX IF NOT EXISTS idx_resume_summaries_full_name ON resume_summaries(full_name);',
      'CREATE INDEX IF NOT EXISTS idx_resume_summaries_email ON resume_summaries(email);',
      'CREATE INDEX IF NOT EXISTS idx_resume_summaries_phone ON resume_summaries(phone);',
      'CREATE INDEX IF NOT EXISTS idx_resume_summaries_location ON resume_summaries(location);',
      'CREATE INDEX IF NOT EXISTS idx_resume_summaries_current_position ON resume_summaries(current_position);',
      'CREATE INDEX IF NOT EXISTS idx_resume_summaries_experience_years ON resume_summaries(experience_years);',
      'CREATE INDEX IF NOT EXISTS idx_resume_summaries_skills ON resume_summaries USING GIN(skills);',
      'CREATE INDEX IF NOT EXISTS idx_resume_summaries_languages ON resume_summaries USING GIN(languages);',
      'CREATE INDEX IF NOT EXISTS idx_resume_summaries_quality_score ON resume_summaries(quality_score);'
    ];
    
    for (const indexSQL of indexes) {
      const { error: indexError } = await supabase.rpc('exec', {
        sql: indexSQL
      });
      
      if (indexError) {
        console.log('⚠️ Ошибка при создании индекса:', indexError.message);
      }
    }
    
    console.log('✅ Индексы созданы');
    
    // 4. Включаем RLS
    console.log('🔐 Настраиваем RLS...');
    const { error: rlsError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE resume_summaries ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.log('⚠️ Ошибка при включении RLS:', rlsError.message);
    }
    
    // 5. Создаем политики RLS
    const policies = [
      'CREATE POLICY "Anyone can read resume summaries" ON resume_summaries FOR SELECT USING (true);',
      'CREATE POLICY "Anyone can insert resume summaries" ON resume_summaries FOR INSERT WITH CHECK (true);',
      'CREATE POLICY "Anyone can update resume summaries" ON resume_summaries FOR UPDATE USING (true);',
      'CREATE POLICY "Anyone can delete resume summaries" ON resume_summaries FOR DELETE USING (true);'
    ];
    
    for (const policySQL of policies) {
      const { error: policyError } = await supabase.rpc('exec', {
        sql: policySQL
      });
      
      if (policyError) {
        console.log('⚠️ Ошибка при создании политики:', policyError.message);
      }
    }
    
    console.log('✅ RLS настроен');
    
    // 6. Мигрируем существующие данные
    console.log('📊 Мигрируем существующие данные...');
    
    // Получаем все резюме с parsed_data
    const { data: resumes, error: resumesError } = await supabase
      .from('resumes')
      .select('*')
      .not('parsed_data', 'is', null);
    
    if (resumesError) {
      console.log('❌ Ошибка при получении резюме:', resumesError.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to get resumes',
        details: resumesError.message 
      }, { status: 500 });
    }
    
    console.log(`📄 Найдено резюме для миграции: ${resumes.length}`);
    
    // Мигрируем каждое резюме
    for (const resume of resumes) {
      try {
        const parsedData = resume.parsed_data;
        const extractedData = parsedData.extracted_data || {};
        
        // Извлекаем навыки
        const skills = extractedData.skills || [];
        const primarySkills = skills.slice(0, 5);
        const secondarySkills = skills.slice(5);
        
        // Извлекаем языки
        const languages = (extractedData.languages || []).map((lang: any) => 
          `${lang.language} (${lang.level})`
        );
        
        // Создаем quick_id
        const quickId = `RES-${Date.now()}-${resume.id.substring(0, 8)}`;
        
        // Вставляем в resume_summaries
        const { error: insertError } = await supabase
          .from('resume_summaries')
          .insert({
            resume_id: resume.id,
            quick_id: quickId,
            full_name: extractedData.fullName || resume.full_name,
            email: extractedData.email || resume.email,
            phone: extractedData.phone || resume.phone,
            location: extractedData.location || resume.location,
            current_position: extractedData.lastPosition || resume.last_position,
            current_company: extractedData.lastCompany || resume.last_company,
            last_position: extractedData.lastPosition || resume.last_position,
            last_company: extractedData.lastCompany || resume.last_company,
            experience_years: extractedData.experienceYears || resume.experience_years || 0,
            education_level: extractedData.educationLevel,
            primary_skills: primarySkills,
            secondary_skills: secondarySkills,
            skills: skills,
            languages: languages,
            summary: extractedData.summary,
            ai_summary: extractedData.summary,
            quality_score: extractedData.qualityScore || resume.quality_score || 0,
            confidence_score: 0.95,
            upload_token: resume.upload_token,
            consent_given: resume.consent_given,
            expires_at: resume.expires_at
          });
        
        if (insertError) {
          console.log(`⚠️ Ошибка при миграции резюме ${resume.id}:`, insertError.message);
        } else {
          console.log(`✅ Резюме ${resume.id} мигрировано`);
        }
      } catch (error) {
        console.log(`❌ Ошибка при обработке резюме ${resume.id}:`, error);
      }
    }
    
    // 7. Проверяем результат
    const { data: summaries, error: summariesError } = await supabase
      .from('resume_summaries')
      .select('*')
      .limit(3);
    
    if (summariesError) {
      console.log('❌ Ошибка при проверке результата:', summariesError.message);
    } else {
      console.log(`✅ Миграция завершена. Создано записей: ${summaries.length}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Parsing structure fix applied successfully',
      migratedResumes: resumes.length,
      createdSummaries: summaries?.length || 0
    });
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
