/**
 * Enhanced resume parser using DeepSeek AI for complete data extraction
 */

export interface EnhancedResumeData {
  // Personal information
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  
  // Professional information
  lastPosition: string | null;
  lastCompany: string | null;
  experienceYears: number | null;
  educationLevel: string | null;
  
  // Skills and languages
  skills: string[] | null;
  languages: Array<{language: string, level: string}> | null;
  
  // Additional data
  summary: string | null;
  achievements: string[] | null;
  certifications: string[] | null;
  projects: Array<{name: string, description: string}> | null;
  
  // Quality metrics
  qualityScore: number;
}

/**
 * Parse resume text using DeepSeek AI for complete data extraction
 */
export async function parseResumeWithDeepSeek(text: string): Promise<EnhancedResumeData> {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
  
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  const prompt = `Проанализируй это резюме и извлеки всю возможную информацию. Верни результат в формате JSON.

Резюме:
${text}

Извлеки следующую информацию:
1. Личная информация: имя, email, телефон, локация
2. Профессиональная информация: последняя должность, последняя компания, общий опыт работы в годах, уровень образования
3. Навыки: список всех технических навыков и технологий
4. Языки: список языков с уровнем владения
5. Дополнительно: краткое резюме, достижения, сертификаты, проекты

Верни результат в формате JSON:
{
  "personal": {
    "fullName": "string or null",
    "email": "string or null", 
    "phone": "string or null",
    "location": "string or null"
  },
  "professional": {
    "lastPosition": "string or null",
    "lastCompany": "string or null", 
    "experienceYears": number or null,
    "educationLevel": "string or null"
  },
  "skills": ["string"] or null,
  "languages": [{"language": "string", "level": "string"}] or null,
  "summary": "string or null",
  "achievements": ["string"] or null,
  "certifications": ["string"] or null,
  "projects": [{"name": "string", "description": "string"}] or null
}

Важно: верни только валидный JSON, без дополнительного текста.`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from DeepSeek API');
    }

    // Parse JSON response
    const parsedData = JSON.parse(content);
    
    // Calculate quality score
    const qualityScore = calculateQualityScore(parsedData);
    
    // Convert to our format
    return {
      fullName: parsedData.personal?.fullName || null,
      email: parsedData.personal?.email || null,
      phone: parsedData.personal?.phone || null,
      location: parsedData.personal?.location || null,
      lastPosition: parsedData.professional?.lastPosition || null,
      lastCompany: parsedData.professional?.lastCompany || null,
      experienceYears: parsedData.professional?.experienceYears || null,
      educationLevel: parsedData.professional?.educationLevel || null,
      skills: parsedData.skills || null,
      languages: parsedData.languages || null,
      summary: parsedData.summary || null,
      achievements: parsedData.achievements || null,
      certifications: parsedData.certifications || null,
      projects: parsedData.projects || null,
      qualityScore
    };

  } catch (error) {
    console.error('DeepSeek parsing error:', error);
    throw new Error(`Failed to parse resume with DeepSeek: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate quality score based on extracted data
 */
function calculateQualityScore(data: any): number {
  let score = 0;
  
  // Personal information (40 points)
  if (data.personal?.fullName) score += 10;
  if (data.personal?.email) score += 10;
  if (data.personal?.phone) score += 10;
  if (data.personal?.location) score += 10;
  
  // Professional information (30 points)
  if (data.professional?.lastPosition) score += 10;
  if (data.professional?.lastCompany) score += 10;
  if (data.professional?.experienceYears) score += 10;
  
  // Skills and additional data (30 points)
  if (data.skills && data.skills.length > 0) score += 15;
  if (data.languages && data.languages.length > 0) score += 5;
  if (data.summary) score += 5;
  if (data.achievements && data.achievements.length > 0) score += 5;
  
  return Math.min(score, 100);
}

/**
 * Fallback parser using simple regex if DeepSeek fails
 */
export function createFallbackResume(text: string): EnhancedResumeData {
  // Extract basic info using regex
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  const phoneMatch = text.match(/\+?[0-9\s\-\(\)]{10,}/);
  const nameMatch = text.match(/(?:Имя|Name|ФИО)[\s:]+([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)/i) || 
                   text.match(/^([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)/m);
  
  // Extract skills
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'C#', 'C++',
    'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Dart', 'HTML', 'CSS', 'SCSS', 'SASS',
    'Webpack', 'Vite', 'Babel', 'ESLint', 'Prettier', 'Git', 'Docker', 'Kubernetes', 'AWS',
    'Azure', 'GCP', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'GraphQL',
    'REST', 'API', 'Microservices', 'Agile', 'Scrum', 'Jira', 'Confluence', 'Figma', 'Sketch'
  ];
  
  const foundSkills = skillKeywords.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );

  return {
    fullName: nameMatch?.[1] || null,
    email: emailMatch?.[0] || null,
    phone: phoneMatch?.[0] || null,
    location: null,
    lastPosition: null,
    lastCompany: null,
    experienceYears: null,
    educationLevel: null,
    skills: foundSkills.length > 0 ? foundSkills : null,
    languages: null,
    summary: null,
    achievements: null,
    certifications: null,
    projects: null,
    qualityScore: foundSkills.length > 0 ? 50 : 20
  };
}
