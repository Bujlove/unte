import { NextRequest, NextResponse } from "next/server";
import { parseResumeTextWithRetry, calculateQualityScore, extractSkills, createResumeSummary } from "@/lib/deepseek/parser";
import { extractTextFromFile } from "@/lib/storage/file-parser";

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing resume parsing...');
    
    // Read test resume
    const testResumeText = `Иван Петров
Frontend Developer
ivan.petrov@email.com
+7 (999) 123-45-67
Москва, Россия

ОПЫТ РАБОТЫ:
2020-2023 - Senior Frontend Developer в ООО "Технологии"
- Разработка React приложений
- Работа с TypeScript и Redux
- Управление командой из 3 разработчиков

2018-2020 - Frontend Developer в ИП "Веб-студия"
- Создание адаптивных сайтов
- Работа с HTML, CSS, JavaScript

ОБРАЗОВАНИЕ:
2014-2018 - МГУ, Факультет ВМК, Специальность "Прикладная математика и информатика"

НАВЫКИ:
- React, TypeScript, JavaScript
- HTML, CSS, SCSS
- Node.js, Express
- Git, Webpack
- Английский язык (B2)`;

    console.log('📄 Test resume content loaded');
    
    // Test text extraction
    console.log('🔍 Testing text extraction...');
    const buffer = Buffer.from(testResumeText, 'utf8');
    const extractedText = await extractTextFromFile(buffer, 'text/plain', 'test_resume.txt');
    console.log('✅ Text extraction successful, length:', extractedText.length);
    
    // Test parsing
    console.log('🤖 Testing AI parsing...');
    const parsedData = await parseResumeTextWithRetry(extractedText);
    console.log('✅ Parsing successful');
    
    // Test quality score
    const qualityScore = calculateQualityScore(parsedData);
    console.log('📊 Quality score:', qualityScore);
    
    // Test skills extraction
    const skills = extractSkills(parsedData);
    console.log('🛠️ Skills:', skills);
    
    // Test summary creation
    const summary = createResumeSummary(parsedData);
    console.log('📝 Summary created');
    
    return NextResponse.json({
      success: true,
      message: 'All parsing tests passed!',
      data: {
        qualityScore,
        skills,
        summary: {
          fullName: summary.full_name,
          position: summary.current_position,
          company: summary.current_company,
          experience: summary.experience_years,
          skills: summary.skills?.slice(0, 5) || [],
          location: summary.location
        },
        parsedData: {
          personal: parsedData.personal,
          professional: parsedData.professional
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
