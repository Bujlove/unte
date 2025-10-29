import { createAdminClient } from '@/lib/supabase/server';

export interface SmartParsingResult {
  success: boolean;
  quickId: string;
  basicInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
  };
  professionalInfo: {
    currentPosition: string;
    currentCompany: string;
    experienceYears: number;
    educationLevel: string;
  };
  skillsAnalysis: {
    primarySkills: string[];
    secondarySkills: string[];
    skillCategories: Record<string, string[]>;
    skillLevels: Record<string, 'junior' | 'middle' | 'senior' | 'lead'>;
  };
  marketIntelligence: {
    marketValue: number;
    rarityScore: number;
    demandScore: number;
  };
  aiInsights: {
    summary: string;
    insights: Record<string, any>;
    confidenceScore: number;
  };
  processingLog: {
    stage: string;
    details: Record<string, any>;
    processingTimeMs: number;
    aiConfidence: number;
  };
}

export interface SkillKnowledge {
  skillName: string;
  category: string;
  subcategory?: string;
  aliases: string[];
  relatedSkills: string[];
  industryUsage: Record<string, number>;
  experienceLevels: string[];
}

/**
 * Smart resume parser with AI intelligence
 */
export class SmartResumeParser {
  private supabase: any;
  private skillsKnowledge: Map<string, SkillKnowledge> = new Map();

  constructor() {
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    this.supabase = await createAdminClient();
    await this.loadSkillsKnowledge();
  }

  /**
   * Load skills knowledge base from database
   */
  private async loadSkillsKnowledge() {
    try {
      const { data, error } = await this.supabase
        .from('skills_knowledge')
        .select('*');

      if (error) {
        console.error('Error loading skills knowledge:', error);
        return;
      }

      data?.forEach((skill: any) => {
        this.skillsKnowledge.set(skill.skill_name.toLowerCase(), {
          skillName: skill.skill_name,
          category: skill.category,
          subcategory: skill.subcategory,
          aliases: skill.aliases || [],
          relatedSkills: skill.related_skills || [],
          industryUsage: skill.industry_usage || {},
          experienceLevels: skill.experience_levels || []
        });
      });

      console.log(`Loaded ${this.skillsKnowledge.size} skills from knowledge base`);
    } catch (error) {
      console.error('Error initializing skills knowledge:', error);
    }
  }

  /**
   * Main parsing function
   */
  async parseResume(resumeId: string, rawText: string): Promise<SmartParsingResult> {
    const startTime = Date.now();
    
    try {
      // Log processing start
      await this.logProcessingStage(resumeId, 'parsing', {
        textLength: rawText.length,
        timestamp: new Date().toISOString()
      });

      // Step 1: Basic information extraction
      const basicInfo = await this.extractBasicInfo(rawText);
      
      // Step 2: Professional information extraction
      const professionalInfo = await this.extractProfessionalInfo(rawText);
      
      // Step 3: Skills analysis with AI
      const skillsAnalysis = await this.analyzeSkills(rawText);
      
      // Step 4: Market intelligence analysis
      const marketIntelligence = await this.analyzeMarketIntelligence(skillsAnalysis);
      
      // Step 5: AI insights generation
      const aiInsights = await this.generateAIInsights(rawText, skillsAnalysis, marketIntelligence);
      
      // Step 6: Generate quick ID
      const quickId = await this.generateQuickId();
      
      // Step 7: Calculate processing metrics
      const processingTimeMs = Date.now() - startTime;
      const aiConfidence = this.calculateOverallConfidence(aiInsights.confidenceScore, skillsAnalysis);
      
      // Step 8: Log completion
      await this.logProcessingStage(resumeId, 'completed', {
        quickId,
        processingTimeMs,
        aiConfidence,
        skillsCount: skillsAnalysis.primarySkills.length + skillsAnalysis.secondarySkills.length
      });

      return {
        success: true,
        quickId,
        basicInfo,
        professionalInfo,
        skillsAnalysis,
        marketIntelligence,
        aiInsights,
        processingLog: {
          stage: 'completed',
          details: { quickId, processingTimeMs, aiConfidence },
          processingTimeMs,
          aiConfidence
        }
      };

    } catch (error) {
      console.error('Smart parsing failed:', error);
      
      await this.logProcessingStage(resumeId, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Extract basic information using DeepSeek AI
   */
  private async extractBasicInfo(text: string) {
    const prompt = `
Extract basic personal information from this resume text. Return JSON with:
- fullName: Full name of the person
- email: Email address
- phone: Phone number
- location: Current location/city

Text: ${text.substring(0, 2000)}
`;

    try {
      const response = await this.callDeepSeek(prompt);
      const data = JSON.parse(response);
      
      return {
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || ''
      };
    } catch (error) {
      console.error('Error extracting basic info:', error);
      return { fullName: '', email: '', phone: '', location: '' };
    }
  }

  /**
   * Extract professional information using DeepSeek AI
   */
  private async extractProfessionalInfo(text: string) {
    const prompt = `
Extract professional information from this resume text. Return JSON with:
- currentPosition: Current job title
- currentCompany: Current company name
- experienceYears: Total years of experience (number)
- educationLevel: Highest education level (high_school, bachelor, master, phd)

Text: ${text.substring(0, 2000)}
`;

    try {
      const response = await this.callDeepSeek(prompt);
      const data = JSON.parse(response);
      
      return {
        currentPosition: data.currentPosition || '',
        currentCompany: data.currentCompany || '',
        experienceYears: parseInt(data.experienceYears) || 0,
        educationLevel: data.educationLevel || 'high_school'
      };
    } catch (error) {
      console.error('Error extracting professional info:', error);
      return { currentPosition: '', currentCompany: '', experienceYears: 0, educationLevel: 'high_school' };
    }
  }

  /**
   * Analyze skills using both DeepSeek and Jina AI
   */
  private async analyzeSkills(text: string) {
    // First, get skills using DeepSeek
    const deepSeekSkills = await this.extractSkillsWithDeepSeek(text);
    
    // Then, use Jina for semantic analysis
    const jinaAnalysis = await this.analyzeSkillsWithJina(text, deepSeekSkills);
    
    // Combine and categorize skills
    const categorizedSkills = this.categorizeSkills(deepSeekSkills, jinaAnalysis);
    
    return {
      primarySkills: categorizedSkills.primary,
      secondarySkills: categorizedSkills.secondary,
      skillCategories: categorizedSkills.categories,
      skillLevels: categorizedSkills.levels
    };
  }

  /**
   * Extract skills using DeepSeek AI
   */
  private async extractSkillsWithDeepSeek(text: string) {
    const prompt = `
Extract all technical and professional skills from this resume text. Return JSON array of skill names.
Focus on: programming languages, frameworks, tools, methodologies, soft skills, languages.

Text: ${text.substring(0, 3000)}
`;

    try {
      const response = await this.callDeepSeek(prompt);
      const skills = JSON.parse(response);
      return Array.isArray(skills) ? skills : [];
    } catch (error) {
      console.error('Error extracting skills with DeepSeek:', error);
      return [];
    }
  }

  /**
   * Analyze skills using Jina AI for semantic understanding
   */
  private async analyzeSkillsWithJina(text: string, skills: string[]) {
    try {
      // Use Jina for semantic analysis of skills
      const jinaResponse = await this.callJina(text);
      
      return {
        semanticSkills: jinaResponse.skills || [],
        skillContext: jinaResponse.context || {},
        confidence: jinaResponse.confidence || 0.5
      };
    } catch (error) {
      console.error('Error analyzing skills with Jina:', error);
      return { semanticSkills: [], skillContext: {}, confidence: 0.5 };
    }
  }

  /**
   * Categorize and analyze skills
   */
  private categorizeSkills(deepSeekSkills: string[], jinaAnalysis: any) {
    const primarySkills: string[] = [];
    const secondarySkills: string[] = [];
    const categories: Record<string, string[]> = {};
    const levels: Record<string, 'junior' | 'middle' | 'senior' | 'lead'> = {};

    const allSkills = [...deepSeekSkills, ...jinaAnalysis.semanticSkills];
    const uniqueSkills = [...new Set(allSkills)];

    uniqueSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      const knowledge = this.findSkillKnowledge(skillLower);
      
      if (knowledge) {
        // Categorize skill
        if (!categories[knowledge.category]) {
          categories[knowledge.category] = [];
        }
        categories[knowledge.category].push(skill);
        
        // Determine if primary or secondary
        if (knowledge.industryUsage && Object.values(knowledge.industryUsage).some(usage => usage > 0.7)) {
          primarySkills.push(skill);
        } else {
          secondarySkills.push(skill);
        }
        
        // Estimate skill level based on context
        levels[skill] = this.estimateSkillLevel(skill, knowledge);
      } else {
        // Unknown skill - add as secondary
        secondarySkills.push(skill);
        categories['other'] = categories['other'] || [];
        categories['other'].push(skill);
        levels[skill] = 'middle';
      }
    });

    return {
      primary: primarySkills.slice(0, 10), // Top 10 primary skills
      secondary: secondarySkills.slice(0, 20), // Top 20 secondary skills
      categories,
      levels
    };
  }

  /**
   * Find skill in knowledge base
   */
  private findSkillKnowledge(skillName: string): SkillKnowledge | null {
    // Direct match
    if (this.skillsKnowledge.has(skillName)) {
      return this.skillsKnowledge.get(skillName)!;
    }
    
    // Check aliases
    for (const [key, knowledge] of this.skillsKnowledge) {
      if (knowledge.aliases.some(alias => alias.toLowerCase() === skillName)) {
        return knowledge;
      }
    }
    
    return null;
  }

  /**
   * Estimate skill level based on context
   */
  private estimateSkillLevel(skill: string, knowledge: SkillKnowledge): 'junior' | 'middle' | 'senior' | 'lead' {
    // This is a simplified estimation - in real implementation,
    // you'd analyze the context around the skill in the resume
    const experienceLevels = knowledge.experienceLevels;
    
    if (experienceLevels.includes('lead')) return 'lead';
    if (experienceLevels.includes('senior')) return 'senior';
    if (experienceLevels.includes('middle')) return 'middle';
    return 'junior';
  }

  /**
   * Analyze market intelligence
   */
  private async analyzeMarketIntelligence(skillsAnalysis: any) {
    // This would analyze current market demand for the skills
    // For now, return mock data
    return {
      marketValue: 0.75, // 0.0 to 1.0
      rarityScore: 0.6, // 0.0 to 1.0
      demandScore: 0.8 // 0.0 to 1.0
    };
  }

  /**
   * Generate AI insights
   */
  private async generateAIInsights(text: string, skillsAnalysis: any, marketIntelligence: any) {
    const prompt = `
Generate professional insights about this candidate based on their resume. Return JSON with:
- summary: 2-3 sentence professional summary
- insights: object with key insights about the candidate
- confidenceScore: confidence in the analysis (0.0 to 1.0)

Skills: ${skillsAnalysis.primarySkills.join(', ')}
Market Value: ${marketIntelligence.marketValue}
Text: ${text.substring(0, 1000)}
`;

    try {
      const response = await this.callDeepSeek(prompt);
      const data = JSON.parse(response);
      
      return {
        summary: data.summary || 'Professional with diverse skills and experience.',
        insights: data.insights || {},
        confidenceScore: parseFloat(data.confidenceScore) || 0.7
      };
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return {
        summary: 'Professional with diverse skills and experience.',
        insights: {},
        confidenceScore: 0.5
      };
    }
  }

  /**
   * Generate quick ID
   */
  private async generateQuickId(): Promise<string> {
    const { data, error } = await this.supabase.rpc('generate_quick_id');
    if (error) {
      console.error('Error generating quick ID:', error);
      return `RES-${Date.now()}`;
    }
    return data;
  }

  /**
   * Call DeepSeek AI
   */
  private async callDeepSeek(prompt: string): Promise<string> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume parser. Extract structured data from resume text and return valid JSON only.'
          },
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
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Call Jina AI
   */
  private async callJina(text: string): Promise<any> {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.JINA_API_KEY}`
      },
      body: JSON.stringify({
        input: text,
        model: 'jina-embeddings-v2-base-en'
      })
    });

    if (!response.ok) {
      throw new Error(`Jina API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      skills: [], // Jina returns embeddings, not skills directly
      context: {},
      confidence: 0.8
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(aiConfidence: number, skillsAnalysis: any): number {
    const skillsConfidence = Math.min(skillsAnalysis.primarySkills.length / 10, 1.0);
    return (aiConfidence + skillsConfidence) / 2;
  }

  /**
   * Log processing stage
   */
  private async logProcessingStage(resumeId: string, stage: string, details: any) {
    try {
      await this.supabase
        .from('resume_processing_log')
        .insert({
          resume_id: resumeId,
          processing_stage: stage,
          stage_details: details,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging processing stage:', error);
    }
  }
}
