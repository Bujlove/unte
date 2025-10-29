import { createChatCompletion } from "./client";
import { ParsedResume } from "@/types/resume";

/**
 * Parse resume text into structured data using DeepSeek
 */
export async function parseResumeText(text: string): Promise<ParsedResume> {
  const prompt = `Ты - эксперт по анализу резюме. Проанализируй следующий текст резюме и извлеки из него максимально подробную структурированную информацию.

ВАЖНО: 
- Будь очень внимательным к деталям
- Извлекай ВСЕ возможные данные, даже если они написаны в разных форматах
- Если информация не найдена, используй null
- Если имя не найдено, попробуй найти в email или других местах
- Если должность не указана, попробуй определить по опыту работы
- Будь гибким в интерпретации данных

Верни ТОЛЬКО валидный JSON в следующем формате:
{
  "personal": {
    "fullName": "string (полное имя)",
    "email": "string | null (email адрес)",
    "phone": "string | null (номер телефона)",
    "location": "string | null (город, страна)",
    "birthDate": "string | null (дата рождения)",
    "photo": "string | null (ссылка на фото)"
  },
  "professional": {
    "title": "string (желаемая должность или текущая позиция)",
    "summary": "string (краткое описание профессионального опыта 2-3 предложения)",
    "totalExperience": number (общий опыт работы в годах),
    "skills": {
      "hard": ["string"] (технические навыки: языки программирования, фреймворки, технологии),
      "soft": ["string"] (мягкие навыки: лидерство, коммуникация, управление),
      "tools": ["string"] (инструменты: IDE, системы, платформы)
    }
  },
  "experience": [
    {
      "company": "string (название компании)",
      "position": "string (должность)",
      "startDate": "string (YYYY-MM)",
      "endDate": "string | null (YYYY-MM или null если текущая работа)",
      "description": "string (описание обязанностей)",
      "achievements": ["string"] (ключевые достижения и результаты)
    }
  ],
  "education": [
    {
      "institution": "string (учебное заведение)",
      "degree": "string (степень: бакалавр, магистр, PhD)",
      "field": "string (специальность)",
      "startDate": "string (YYYY)",
      "endDate": "string (YYYY)"
    }
  ],
  "languages": [
    {
      "language": "string (язык)",
      "level": "string (уровень: A1, A2, B1, B2, C1, C2, native)"
    }
  ],
  "additional": {
    "certifications": ["string"] (сертификаты и курсы),
    "publications": ["string"] (публикации и статьи),
    "projects": ["string"] (личные проекты)
  }
}

ПРАВИЛА ИЗВЛЕЧЕНИЯ:
1. Если информация не найдена, используй null
2. Для дат используй формат YYYY-MM или YYYY
3. Извлекай ВСЕ навыки, даже если они упомянуты в разных местах
4. Для опыта работы считай только релевантный опыт (не стажировки, если не указано иное)
5. Если есть несколько email или телефонов, используй основной
6. Для локации используй формат "Город, Страна"

Резюме:
${text}`;

  const response = await createChatCompletion(
    [
      {
        role: "system",
        content:
          "Ты эксперт по парсингу резюме. Всегда отвечай только валидным JSON без дополнительного текста.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    {
      temperature: 0.3,
      jsonMode: true,
    }
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Failed to parse resume: empty response");
  }

  try {
    const parsed = JSON.parse(content) as ParsedResume;
    return parsed;
  } catch (error) {
    console.error("Failed to parse JSON response:", content);
    throw new Error("Failed to parse resume: invalid JSON response");
  }
}

/**
 * Generate a professional summary from parsed resume data
 */
export async function generateResumeSummary(parsedData: ParsedResume): Promise<string> {
  const prompt = `На основе следующих данных резюме, создай краткое профессиональное описание кандидата (2-3 предложения):

Должность: ${parsedData.professional.title}
Опыт: ${parsedData.professional.totalExperience} лет
Навыки: ${parsedData.professional.skills.hard.join(", ")}
Последняя позиция: ${parsedData.experience?.[0]?.position || "N/A"} в ${parsedData.experience?.[0]?.company || "N/A"}

Описание должно быть кратким, профессиональным и подчеркивать ключевые компетенции.`;

  const response = await createChatCompletion([
    {
      role: "system",
      content: "Ты профессиональный HR-консультант. Создавай краткие и точные описания.",
    },
    {
      role: "user",
      content: prompt,
    },
  ]);

  return response.choices[0]?.message?.content || "";
}

/**
 * Calculate resume quality score (0-100)
 */
export function calculateQualityScore(parsedData: ParsedResume): number {
  let score = 0;

  // Contact information (20 points)
  if (parsedData.personal.fullName) score += 5;
  if (parsedData.personal.email) score += 5;
  if (parsedData.personal.phone) score += 5;
  if (parsedData.personal.location) score += 5;

  // Professional info (30 points)
  if (parsedData.professional.title) score += 10;
  if (parsedData.professional.summary) score += 10;
  if (parsedData.professional.skills.hard.length > 0) score += 10;

  // Experience (30 points)
  if (parsedData.experience && parsedData.experience.length > 0) score += 10;
  if (parsedData.experience && parsedData.experience.length >= 2) score += 10;
  const hasDetailedExperience = parsedData.experience?.some(
    (exp) => exp.achievements && exp.achievements.length > 0
  );
  if (hasDetailedExperience) score += 10;

  // Education (10 points)
  if (parsedData.education && parsedData.education.length > 0) score += 10;

  // Additional (10 points)
  if (parsedData.languages && parsedData.languages.length > 0) score += 5;
  if (
    (parsedData.additional.certifications && parsedData.additional.certifications.length > 0) ||
    (parsedData.additional.projects && parsedData.additional.projects.length > 0)
  )
    score += 5;

  return Math.min(score, 100);
}

/**
 * Extract all skills from parsed resume
 */
export function extractSkills(parsedData: ParsedResume): string[] | null {
  const skills = [
    ...parsedData.professional.skills.hard,
    ...(parsedData.professional.skills.soft || []),
    ...(parsedData.professional.skills.tools || []),
  ];

  // Remove duplicates and normalize
  const uniqueSkills = [...new Set(skills.map((s) => s.trim().toLowerCase()))];
  
  return uniqueSkills.length > 0 ? uniqueSkills : null;
}

/**
 * Create summary data for quick access
 */
export function createResumeSummary(parsedData: ParsedResume) {
  // Extract current position from experience
  const currentExperience = parsedData.experience?.find(exp => !exp.endDate) || parsedData.experience?.[0];
  
  // Extract languages
  const languages = parsedData.languages?.map(lang => `${lang.language} (${lang.level})`) || [];
  
  // Extract key achievements
  const keyAchievements = parsedData.experience
    ?.flatMap(exp => exp.achievements || [])
    .slice(0, 5) || []; // Top 5 achievements
  
  // Determine work type preferences (basic logic)
  const workType = [];
  if (parsedData.personal.location?.toLowerCase().includes('remote') || 
      parsedData.professional.summary?.toLowerCase().includes('remote')) {
    workType.push('remote');
  }
  if (parsedData.professional.summary?.toLowerCase().includes('office') ||
      parsedData.professional.summary?.toLowerCase().includes('офис')) {
    workType.push('office');
  }
  if (workType.length === 0) {
    workType.push('hybrid'); // Default
  }

  const extractedSkills = extractSkills(parsedData);
  
  return {
    full_name: parsedData.personal.fullName || '',
    email: parsedData.personal.email || '',
    phone: parsedData.personal.phone || '',
    location: parsedData.personal.location || '',
    current_position: currentExperience?.position || parsedData.professional.title || '',
    current_company: currentExperience?.company || '',
    experience_years: parsedData.professional.totalExperience || 0,
    education_level: parsedData.education?.[0]?.degree || '',
    skills: extractedSkills && extractedSkills.length > 0 ? extractedSkills : null,
    languages: languages.length > 0 ? languages : null,
    salary_expectation: '', // Will be extracted by AI if mentioned
    availability: 'immediately', // Default
    work_type: workType.length > 0 ? workType : null,
    summary: parsedData.professional.summary || '',
    key_achievements: keyAchievements.length > 0 ? keyAchievements : null
  };
}

/**
 * Fallback parsing with basic text extraction
 */
export function createFallbackResume(text: string): ParsedResume {
  console.log("Creating fallback resume from text");
  
  // Basic text extraction
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  const phoneMatch = text.match(/(\+?[1-9]\d{1,14})/);
  
  // Try to extract name from first line or email
  let fullName = '';
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length < 50 && !firstLine.includes('@')) {
      fullName = firstLine;
    }
  }
  
  // If no name found, try to extract from email
  if (!fullName && emailMatch) {
    fullName = emailMatch[1].split('@')[0].replace(/[._]/g, ' ');
  }
  
  // Extract basic skills using common keywords
  const skillKeywords = [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'node', 'python', 'java', 'c++', 'c#',
    'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'html', 'css', 'sass', 'less',
    'webpack', 'babel', 'eslint', 'git', 'docker', 'kubernetes', 'aws', 'azure', 'gcp',
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'graphql', 'rest',
    'agile', 'scrum', 'kanban', 'ci/cd', 'devops', 'microservices', 'api'
  ];
  
  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
  
  // Extract experience years (look for patterns like "5 years", "3 года", etc.)
  const experienceMatch = text.match(/(\d+)\s*(лет|года|years?|yrs?)/i);
  const experienceYears = experienceMatch ? parseInt(experienceMatch[1]) : 0;
  
  // Extract location (look for city names)
  const locationMatch = text.match(/(москва|санкт-петербург|спб|екатеринбург|новосибирск|казань|нижний новгород|челябинск|самара|омск|ростов-на-дону|уфа|красноярск|пермь|волгоград|воронеж|саратов|краснодар|тольятти|барнаул|ижевск|ульяновск|владивосток|ярославль|хабаровск|махачкала|томск|оренбург|кемерово|рязань|астрахань|пенза|липецк|тула|киров|чебоксары|калининград|брянск|курск|иваново|магнитогорск|тверь|ставрополь|нижний тагил|белгород|архангельск|владимир|сочи|курган|смоленск|калуга|чита|орёл|волжский|череповец|мурманск|сургут|вологда|тамбов|стерлитамак|грозный|якутск|кострома|комсомольск-на-амуре|петрозаводск|таганрог|нижневартовск|йошкар-ола|братск|новороссийск|шахты|нальчик|сыктывкар|нижнекамск|ангарск|благовещенск|прокопьевск|химки|псков|бийск|энгельс|рыбинск|балаково|северодвинск|подольск|королёв|сызрань|норильск|златоуст|каменск-уральский|электросталь|новокузнецк|магнитогорск|альметьевск|петропавловск-камчатский|ленинск-кузнецкий|киселёвск|новочеркасск|муром|железнодорожный|серпухов|армавир|обнинск|первоуральск|рубцовск|абакан|пятигорск|коломна|майкоп|хасавюрт|керчь|новый уренгой|ессентуки|нефтеюганск|димитровград|камышин|невинномысск|кирово-чепецк|новошахтинск|елец|железногорск|чайковский|ачинск|мичуринск|сергиев посад|новокуйбышевск|зеленодольск|соликамск|раменское|домодедово|магадан|глазов|каспийск|котлас|минеральные воды|тихорецк|кропоткин|ессентуки|геленджик|анапа|новороссийск|сочи|адлер|лазаревское|хости|дагомыс|аше|мацеста|кудепста|весёлое|абрау-дюрсо|гайдук|новомихайловский|небуг|джубга|агой|олгинка|бетта|криница|бархатные сезоны|приморско-ахтарск|ея|калинино|ачуево|камышеватская|должанская|азов|таганрог|матвеев курган|куйбышево|сальск|пролетарск|орловский|зимовники|весёлый|заветное|покровское|егорлыкская|белая глина|кущёвская|староминская|ленинградская|каневская|старощербиновская|новопокровская|павловская|выселковская|тимашёвск|кореновск|динская|калининская|краснодар|тихорецк|кавказская|усть-лабинск|лабинск|курганинск|новокубанск|армавир|новокубанск|отрадненская|белореченск|апшеронск|хадыженск|нефтегорск|майкоп|адыгейск|гиагинская|кошехабль|теучежхабль|красногвардейское|тахтамукай|теучежхабль|кошехабль|гиагинская|майкоп|адыгейск|нефтегорск|хадыженск|апшеронск|белореченск|отрадненская|новокубанск|армавир|новокубанск|курганинск|лабинск|усть-лабинск|кавказская|тихорецк|краснодар|калининская|динская|кореновск|тимашёвск|выселковская|павловская|новопокровская|старощербиновская|каневская|ленинградская|староминская|кущёвская|белая глина|егорлыкская|заветное|весёлый|зимовники|орловский|пролетарск|сальск|куйбышево|матвеев курган|таганрог|азов|должанская|камышеватская|ачуево|калинино|ея|приморско-ахтарск|бархатные сезоны|криница|бетта|олгинка|агой|джубга|небуг|новомихайловский|гайдук|абрау-дюрсо|весёлое|мацеста|хости|лазаревское|адлер|сочи|новороссийск|ессентуки|геленджик|анапа|тихорецк|кропоткин|ессентуки|минеральные воды|котлас|каспийск|глазов|магадан|домодедово|раменское|соликамск|зеленодольск|новокуйбышевск|сергиев посад|мичуринск|ачинск|чайковский|железногорск|елец|новошахтинск|кирово-чепецк|невинномысск|камышин|димитровград|нефтеюганск|ессентуки|новый уренгой|керчь|хасавюрт|майкоп|коломна|пятигорск|абакан|рубцовск|первоуральск|обнинск|армавир|серпухов|железнодорожный|муром|новочеркасск|киселёвск|ленинск-кузнецкий|петропавловск-камчатский|альметьевск|магнитогорск|новокузнецк|электросталь|каменск-уральский|златоуст|норильск|сызрань|королёв|подольск|северодвинск|рыбинск|энгельс|бийск|псков|химки|ангарск|нижнекамск|сыктывкар|нальчик|шахты|новороссийск|братск|йошкар-ола|нижневартовск|таганрог|петрозаводск|комсомольск-на-амуре|кострома|якутск|грозный|стерлитамак|тамбов|вологда|сургут|мурманск|череповец|волжский|орёл|чита|калуга|смоленск|курган|сочи|владимир|архангельск|белгород|ставрополь|тверь|магнитогорск|иваново|курск|брянск|калининград|чебоксары|киров|липецк|пенза|астрахань|рязань|кемерово|оренбург|томск|махачкала|хабаровск|ярославль|владивосток|ульяновск|ижевск|барнаул|тольятти|краснодар|саратов|воронеж|волгоград|пермь|красноярск|уфа|ростов-на-дону|омск|самара|челябинск|нижний новгород|казань|новосибирск|екатеринбург|спб|санкт-петербург|москва)/i);
  const location = locationMatch ? locationMatch[1] : undefined;
  
  return {
    personal: {
      fullName: fullName || 'Не указано',
      email: emailMatch ? emailMatch[1] : undefined,
      phone: phoneMatch ? phoneMatch[1] : undefined,
      location: location,
      birthDate: undefined,
      photo: undefined
    },
    professional: {
      title: 'Соискатель',
      summary: 'Резюме загружено, требуется ручная обработка',
      totalExperience: experienceYears,
      skills: {
        hard: foundSkills.length > 0 ? foundSkills : [],
        soft: null,
        tools: null
      }
    },
    experience: null,
    education: null,
    languages: null,
    additional: {
      certifications: null,
      publications: null,
      projects: null
    }
  };
}

/**
 * Enhanced parsing with better error handling and retry logic
 */
export async function parseResumeTextWithRetry(text: string, maxRetries: number = 3): Promise<ParsedResume> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Parsing attempt ${attempt}/${maxRetries}`);
      const result = await parseResumeText(text);
      
      // Validate that we got some meaningful data (more flexible)
      const hasPersonalInfo = result.personal.fullName || result.personal.email || result.personal.phone;
      const hasProfessionalInfo = result.professional.title || (result.professional.skills.hard && result.professional.skills.hard.length > 0) || (result.experience && result.experience.length > 0);
      const hasAnyData = hasPersonalInfo || hasProfessionalInfo || (result.education && result.education.length > 0);
      
      console.log(`Validation: hasPersonalInfo=${hasPersonalInfo}, hasProfessionalInfo=${hasProfessionalInfo}, hasAnyData=${hasAnyData}`);
      console.log(`Personal: name=${result.personal.fullName}, email=${result.personal.email}, phone=${result.personal.phone}`);
      console.log(`Professional: title=${result.professional.title}, skills=${result.professional.skills.hard?.length || 0}, experience=${result.experience?.length || 0}`);
      
      if (!hasAnyData) {
        throw new Error('No meaningful data extracted');
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`Parsing attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  // If all attempts failed, create a fallback resume
  console.log("All parsing attempts failed, creating fallback resume");
  return createFallbackResume(text);
}

