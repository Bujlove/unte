/**
 * Simple resume parser - extracts key data without complex AI
 */

export interface SimpleResumeData {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  company: string | null;
  experience: number;
  skills: string[];
  location: string | null;
  education: string | null;
}

/**
 * Detect file type based on extension and MIME type
 */
export function detectFileType(fileName: string, mimeType: string): string {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  
  // Check by extension first
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'doc') return 'doc';
  if (ext === 'txt') return 'txt';
  if (ext === 'rtf') return 'rtf';
  
  // Check by MIME type
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('wordprocessingml')) return 'docx';
  if (mimeType.includes('msword')) return 'doc';
  if (mimeType.includes('text')) return 'txt';
  if (mimeType.includes('rtf')) return 'rtf';
  
  return 'unknown';
}

/**
 * Extract key data from resume text using simple regex patterns
 */
export function extractSimpleData(text: string): SimpleResumeData {
  const data: SimpleResumeData = {
    fullName: null,
    email: null,
    phone: null,
    position: null,
    company: null,
    experience: 0,
    skills: [],
    location: null,
    education: null
  };

  // Extract email
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    data.email = emailMatch[0];
  }

  // Extract phone (various formats)
  const phonePatterns = [
    /\+7\s?\(?\d{3}\)?\s?\d{3}[- ]?\d{2}[- ]?\d{2}/g,
    /8\s?\(?\d{3}\)?\s?\d{3}[- ]?\d{2}[- ]?\d{2}/g,
    /\+?\d{1,3}[- ]?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{2}[- ]?\d{2}/g
  ];
  
  for (const pattern of phonePatterns) {
    const phoneMatch = text.match(pattern);
    if (phoneMatch) {
      data.phone = phoneMatch[0].replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // Extract name (look for common patterns)
  const namePatterns = [
    /(?:Имя|Name|ФИО)[\s:]+([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)?)/i,
    /^([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)?)/m,
    /([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)?)\s*$/m
  ];
  
  for (const pattern of namePatterns) {
    const nameMatch = text.match(pattern);
    if (nameMatch && nameMatch[1]) {
      data.fullName = nameMatch[1].trim();
      break;
    }
  }

  // Extract position/title
  const positionPatterns = [
    /(?:Должность|Position|Специальность)[\s:]+([А-Яа-яё\s]+)/i,
    /(?:Frontend|Backend|Fullstack|Developer|Разработчик|Программист|Менеджер|Аналитик|Дизайнер)/i
  ];
  
  for (const pattern of positionPatterns) {
    const positionMatch = text.match(pattern);
    if (positionMatch) {
      data.position = positionMatch[1] || positionMatch[0];
      break;
    }
  }

  // Extract company
  const companyPatterns = [
    /(?:Компания|Company|Организация)[\s:]+([А-Яа-яё\s]+)/i,
    /(?:ООО|ЗАО|ИП|LLC|Inc|Corp)/i
  ];
  
  for (const pattern of companyPatterns) {
    const companyMatch = text.match(pattern);
    if (companyMatch) {
      data.company = companyMatch[1] || companyMatch[0];
      break;
    }
  }

  // Extract experience (look for years)
  const experiencePatterns = [
    /(\d+)\s*(?:лет|года|год|years?|yrs?)/i,
    /(?:Опыт|Experience)[\s:]+(\d+)/i
  ];
  
  for (const pattern of experiencePatterns) {
    const expMatch = text.match(pattern);
    if (expMatch) {
      data.experience = parseInt(expMatch[1]) || 0;
      break;
    }
  }

  // Extract skills (common tech skills)
  const skillKeywords = [
    'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'C#', 'C++',
    'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Dart', 'HTML', 'CSS', 'SCSS', 'SASS',
    'Webpack', 'Vite', 'Babel', 'ESLint', 'Prettier', 'Git', 'Docker', 'Kubernetes', 'AWS',
    'Azure', 'GCP', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch', 'GraphQL',
    'REST', 'API', 'Microservices', 'Agile', 'Scrum', 'Jira', 'Confluence', 'Figma', 'Sketch'
  ];
  
  const foundSkills: string[] = [];
  for (const skill of skillKeywords) {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }
  data.skills = foundSkills;

  // Extract location
  const locationPatterns = [
    /(?:Город|City|Локация|Location)[\s:]+([А-Яа-яё\s]+)/i,
    /(?:Москва|Санкт-Петербург|Екатеринбург|Новосибирск|Казань|Нижний Новгород|Челябинск|Самара|Омск|Ростов-на-Дону)/i
  ];
  
  for (const pattern of locationPatterns) {
    const locationMatch = text.match(pattern);
    if (locationMatch) {
      data.location = locationMatch[1] || locationMatch[0];
      break;
    }
  }

  // Extract education
  const educationPatterns = [
    /(?:Образование|Education|Университет|University)[\s:]+([А-Яа-яё\s]+)/i,
    /(?:Бакалавр|Магистр|Специалист|Bachelor|Master|PhD)/i
  ];
  
  for (const pattern of educationPatterns) {
    const eduMatch = text.match(pattern);
    if (eduMatch) {
      data.education = eduMatch[1] || eduMatch[0];
      break;
    }
  }

  return data;
}

/**
 * Generate a simple quality score based on extracted data
 */
export function calculateSimpleQualityScore(data: SimpleResumeData): number {
  let score = 0;
  
  if (data.fullName) score += 20;
  if (data.email) score += 20;
  if (data.phone) score += 20;
  if (data.position) score += 15;
  if (data.skills.length > 0) score += 15;
  if (data.experience > 0) score += 10;
  
  return Math.min(score, 100);
}
