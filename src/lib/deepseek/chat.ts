import { createChatCompletion } from "@/lib/chat/client";
import OpenAI from "openai";

/**
 * AI Chat assistant for recruiters
 * Helps formulate requirements and converts them to search queries
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SearchRequirements {
  position?: string;
  skills: string[];
  experienceYears?: {
    min?: number;
    max?: number;
  };
  location?: string;
  educationLevel?: string;
  searchQuery: string;
}

/**
 * Process chat message and extract search requirements
 */
export async function processChatMessage(
  messages: ChatMessage[],
  extractRequirements: boolean = false
): Promise<{ response: string; requirements?: SearchRequirements }> {
  // Анализируем текущие требования из истории
  const currentRequirements = analyzeCurrentRequirements(messages);
  
  const systemPrompt = `Ты - AI ассистент для рекрутера. Твоя задача - помочь сформулировать требования к кандидату.

ВАЖНО: Задавай ТОЛЬКО ОДИН вопрос за раз, основываясь на том, что уже известно из диалога.

Текущие требования из диалога:
- Должность: ${currentRequirements.position || 'не указана'}
- Навыки: ${currentRequirements.skills && currentRequirements.skills.length > 0 ? currentRequirements.skills.join(', ') : 'не указаны'}
- Опыт: ${currentRequirements.experienceYears ? `${currentRequirements.experienceYears.min || 0}-${currentRequirements.experienceYears.max || '∞'} лет` : 'не указан'}
- Локация: ${currentRequirements.location || 'не указана'}
- Образование: ${currentRequirements.educationLevel || 'не указано'}

Правила:
1. Внимательно изучи ВСЮ историю диалога выше
2. Задавай ТОЛЬКО ОДИН вопрос за раз
3. Выбирай самый важный недостающий параметр
4. Учитывай контекст - не спрашивай то, что уже известно
5. Будь дружелюбным и профессиональным
6. Когда все ключевые параметры собраны, предложи начать поиск
7. Отвечай простым текстом, без HTML и без Markdown-разметки

Примеры вопросов:
- "На какую должность вы ищете кандидата?"
- "Какие ключевые навыки должен иметь кандидат?"
- "Сколько лет опыта требуется? (например: 2-5 лет)"
- "Важна ли локация? Если да, то какой город?"
- "Какое образование требуется? (высшее, среднее, не важно)"

Помни: ты видишь всю историю диалога, используй эту информацию!`;

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  const response = await createChatCompletion(chatMessages, {
    temperature: 0.7,
    maxTokens: 800,
  });

  const assistantResponse = response.choices[0]?.message?.content || "";

  // If we need to extract requirements, do it in a second call
  if (extractRequirements) {
    const requirements = await extractSearchRequirements(messages);
    return { response: assistantResponse, requirements };
  }

  return { response: assistantResponse };
}

/**
 * Analyze current requirements from conversation history
 */
function analyzeCurrentRequirements(messages: ChatMessage[]): Partial<SearchRequirements> {
  const requirements: Partial<SearchRequirements> = {
    skills: [],
    experienceYears: {},
  };

  // Анализируем ВСЕ сообщения пользователя
  const userMessages = messages.filter(m => m.role === "user");
  
  for (const message of userMessages) {
    const content = message.content.toLowerCase();
    
    // Поиск должности (более гибкий)
    if (content.includes("должность") || content.includes("позиция") || content.includes("ищу") || 
        content.includes("разработчик") || content.includes("менеджер") || content.includes("дизайнер") ||
        content.includes("аналитик") || content.includes("маркетолог") || content.includes("продажник")) {
      
      // Ищем конкретные должности
      const positionMatch = content.match(/(?:должность|позиция|ищу|нужен|ищем)\s*[:\-]?\s*([^.!?]+)/);
      if (positionMatch) {
        requirements.position = positionMatch[1].trim();
      } else {
        // Ищем должности в тексте
        const positions = ['разработчик', 'программист', 'менеджер', 'дизайнер', 'аналитик', 'маркетолог', 'продажник', 'тестировщик', 'devops', 'архитектор'];
        for (const pos of positions) {
          if (content.includes(pos)) {
            requirements.position = pos;
            break;
          }
        }
      }
    }
    
    // Поиск навыков (более гибкий)
    if (content.includes("навык") || content.includes("знание") || content.includes("умеет") ||
        content.includes("python") || content.includes("javascript") || content.includes("react") ||
        content.includes("django") || content.includes("postgresql") || content.includes("mysql") ||
        content.includes("docker") || content.includes("kubernetes") || content.includes("aws")) {
      
      // Список популярных навыков
      const skills = ['python', 'javascript', 'typescript', 'react', 'vue', 'angular', 'node.js', 'django', 'flask', 
                     'fastapi', 'postgresql', 'mysql', 'mongodb', 'redis', 'docker', 'kubernetes', 'aws', 'gcp', 
                     'azure', 'git', 'ci/cd', 'linux', 'nginx', 'apache', 'figma', 'photoshop', 'sketch', 'adobe',
                     'seo', 'sem', 'google analytics', 'facebook ads', 'yandex direct', 'excel', 'power bi', 'tableau'];
      
      for (const skill of skills) {
        if (content.includes(skill) && !requirements.skills!.includes(skill)) {
          requirements.skills!.push(skill);
        }
      }
    }
    
    // Поиск опыта (более гибкий)
    if (content.includes("опыт") || content.includes("лет") || content.includes("года")) {
      const expMatch = content.match(/(\d+)[\s\-]*(?:до|до\s*)?(\d+)?\s*(?:лет|года|год)/);
      if (expMatch) {
        requirements.experienceYears = {
          min: parseInt(expMatch[1]),
          max: expMatch[2] ? parseInt(expMatch[2]) : undefined
        };
      }
    }
    
    // Поиск локации (более гибкий)
    if (content.includes("город") || content.includes("локация") || content.includes("в ") ||
        content.includes("москва") || content.includes("спб") || content.includes("питер") ||
        content.includes("екатеринбург") || content.includes("новосибирск") || content.includes("удаленно")) {
      
      const locationMatch = content.match(/(?:город|локация|в|из)\s*[:\-]?\s*([^.!?]+)/);
      if (locationMatch) {
        requirements.location = locationMatch[1].trim();
      } else {
        // Ищем города в тексте
        const cities = ['москва', 'спб', 'питер', 'санкт-петербург', 'екатеринбург', 'новосибирск', 'казань', 'нижний новгород', 'удаленно', 'remote'];
        for (const city of cities) {
          if (content.includes(city)) {
            requirements.location = city;
            break;
          }
        }
      }
    }
    
    // Поиск образования
    if (content.includes("образование") || content.includes("университет") || content.includes("институт") ||
        content.includes("высшее") || content.includes("среднее") || content.includes("не важно")) {
      const eduMatch = content.match(/(?:образование|университет|институт)\s*[:\-]?\s*([^.!?]+)/);
      if (eduMatch) {
        requirements.educationLevel = eduMatch[1].trim();
      } else {
        if (content.includes("высшее")) requirements.educationLevel = "высшее";
        else if (content.includes("среднее")) requirements.educationLevel = "среднее";
        else if (content.includes("не важно")) requirements.educationLevel = "не важно";
      }
    }
  }

  return requirements;
}

/**
 * Extract search requirements from conversation history
 */
export async function extractSearchRequirements(
  messages: ChatMessage[]
): Promise<SearchRequirements> {
  const conversationText = messages
    .map((m) => `${m.role === "user" ? "Рекрутер" : "Ассистент"}: ${m.content}`)
    .join("\n");

  const extractionPrompt = `На основе следующего диалога извлеки требования к кандидату.

Диалог:
${conversationText}

Верни ТОЛЬКО валидный JSON в формате:
{
  "position": "string или null",
  "skills": ["массив навыков"],
  "experienceYears": {
    "min": number или null,
    "max": number или null
  },
  "location": "string или null",
  "educationLevel": "string или null",
  "searchQuery": "краткое описание для семантического поиска"
}`;

  const response = await createChatCompletion(
    [
      {
        role: "system",
        content:
          "Ты эксперт по извлечению структурированных данных. Отвечай только валидным JSON.",
      },
      {
        role: "user",
        content: extractionPrompt,
      },
    ],
    {
      temperature: 0.2,
      jsonMode: true,
    }
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Failed to extract requirements");
  }

  try {
    const requirements = JSON.parse(content) as SearchRequirements;
    return requirements;
  } catch (error) {
    console.error("Failed to parse requirements:", content);
    throw new Error("Failed to parse requirements");
  }
}

/**
 * Format chat response with proper markdown
 */
export function formatChatResponse(text: string): string {
  // Возвращаем простой текст: убираем HTML/Markdown, нормализуем пробелы
  const noTags = text.replace(/<[^>]+>/g, '');
  const noMd = noTags.replace(/\*\*?|__|`/g, '');
  return noMd.replace(/[\t ]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
}

/**
 * Generate a search query from requirements
 */
export function generateSearchQuery(requirements: SearchRequirements): string {
  const parts: string[] = [];

  if (requirements.position) {
    parts.push(requirements.position);
  }

  if (requirements.skills.length > 0) {
    parts.push(`со знанием ${requirements.skills.join(", ")}`);
  }

  if (requirements.experienceYears?.min) {
    parts.push(`с опытом от ${requirements.experienceYears.min} лет`);
  }

  if (requirements.location) {
    parts.push(`в городе ${requirements.location}`);
  }

  if (requirements.educationLevel) {
    parts.push(`с образованием ${requirements.educationLevel}`);
  }

  return parts.join(" ") || requirements.searchQuery;
}

/**
 * Stream chat response for real-time UI
 */
export async function streamChatResponse(messages: ChatMessage[]) {
  const systemPrompt = `Ты - AI ассистент для рекрутера. Помогай формулировать требования к кандидату четко и профессионально.`;

  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  return createStreamingChatCompletion(chatMessages, {
    temperature: 0.7,
    maxTokens: 500,
  });
}

/**
 * Suggest clarifying questions based on current requirements
 */
export async function suggestClarifyingQuestions(
  requirements: Partial<SearchRequirements>
): Promise<string[]> {
  const questions: string[] = [];

  if (!requirements.position) {
    questions.push("На какую должность вы ищете кандидата?");
  }

  if (!requirements.skills || requirements.skills.length === 0) {
    questions.push("Какие ключевые навыки должен иметь кандидат?");
  }

  if (!requirements.experienceYears) {
    questions.push("Сколько лет опыта требуется?");
  }

  if (!requirements.location) {
    questions.push("Важна ли локация кандидата?");
  }

  return questions.slice(0, 2); // Return max 2 questions
}

