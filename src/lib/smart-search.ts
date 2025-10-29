import { createAdminClient } from '@/lib/supabase/server';

export interface SmartSearchQuery {
  query: string;
  context?: {
    industry?: string;
    experienceLevel?: 'junior' | 'middle' | 'senior' | 'lead';
    location?: string;
    salaryRange?: { min: number; max: number };
    mustHaveSkills?: string[];
    niceToHaveSkills?: string[];
  };
}

export interface SmartSearchResult {
  candidates: Array<{
    quickId: string;
    fullName: string;
    currentPosition: string;
    currentCompany: string;
    experienceYears: number;
    location: string;
    primarySkills: string[];
    aiSummary: string;
    matchScore: number;
    matchReasons: string[];
    marketValue: number;
    rarityScore: number;
  }>;
  searchInsights: {
    totalCandidates: number;
    averageMatchScore: number;
    skillGaps: string[];
    marketInsights: Record<string, any>;
    recommendations: string[];
  };
  aiAssistant: {
    response: string;
    suggestions: string[];
    followUpQuestions: string[];
  };
}

export class SmartSearchEngine {
  private supabase: any;

  constructor() {
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    this.supabase = await createAdminClient();
  }

  /**
   * Perform smart search with AI assistance
   */
  async search(query: SmartSearchQuery): Promise<SmartSearchResult> {
    try {
      // Step 1: Parse and understand the search query
      const parsedQuery = await this.parseSearchQuery(query);
      
      // Step 2: Search for candidates
      const candidates = await this.findCandidates(parsedQuery);
      
      // Step 3: Calculate match scores
      const scoredCandidates = await this.calculateMatchScores(candidates, parsedQuery);
      
      // Step 4: Generate search insights
      const searchInsights = await this.generateSearchInsights(scoredCandidates, parsedQuery);
      
      // Step 5: Generate AI assistant response
      const aiAssistant = await this.generateAIAssistantResponse(query, scoredCandidates, searchInsights);
      
      // Step 6: Log search intelligence
      await this.logSearchIntelligence(query, scoredCandidates.length, searchInsights.averageMatchScore);

      return {
        candidates: scoredCandidates.slice(0, 20), // Top 20 results
        searchInsights,
        aiAssistant
      };

    } catch (error) {
      console.error('Smart search error:', error);
      throw error;
    }
  }

  /**
   * Parse search query using AI
   */
  private async parseSearchQuery(query: SmartSearchQuery) {
    const prompt = `
Parse this recruitment search query and extract structured information. Return JSON with:
- requiredSkills: Array of required technical skills
- niceToHaveSkills: Array of nice-to-have skills
- experienceLevel: junior, middle, senior, or lead
- industry: Industry context if mentioned
- location: Location preference if mentioned
- jobType: Type of position (full-time, part-time, contract, etc.)

Query: "${query.query}"
Context: ${JSON.stringify(query.context || {})}
`;

    try {
      const response = await this.callDeepSeek(prompt);
      const parsed = JSON.parse(response);
      
      return {
        originalQuery: query.query,
        requiredSkills: parsed.requiredSkills || [],
        niceToHaveSkills: parsed.niceToHaveSkills || [],
        experienceLevel: parsed.experienceLevel || 'middle',
        industry: parsed.industry || query.context?.industry,
        location: parsed.location || query.context?.location,
        jobType: parsed.jobType || 'full-time',
        salaryRange: query.context?.salaryRange
      };
    } catch (error) {
      console.error('Error parsing search query:', error);
      return {
        originalQuery: query.query,
        requiredSkills: [],
        niceToHaveSkills: [],
        experienceLevel: 'middle',
        industry: query.context?.industry,
        location: query.context?.location,
        jobType: 'full-time',
        salaryRange: query.context?.salaryRange
      };
    }
  }

  /**
   * Find candidates based on parsed query
   */
  private async findCandidates(parsedQuery: any) {
    let query = this.supabase
      .from('resume_summaries')
      .select(`
        quick_id,
        full_name,
        current_position,
        current_company,
        experience_years,
        location,
        primary_skills,
        secondary_skills,
        ai_summary,
        market_value,
        rarity_score,
        skill_categories,
        skill_levels
      `)
      .eq('resume_id', this.supabase.from('resumes').select('id').eq('status', 'active'));

    // Filter by experience level
    if (parsedQuery.experienceLevel) {
      const experienceYears = this.getExperienceYearsForLevel(parsedQuery.experienceLevel);
      query = query.gte('experience_years', experienceYears.min);
    }

    // Filter by location if specified
    if (parsedQuery.location) {
      query = query.ilike('location', `%${parsedQuery.location}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching candidates:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Calculate match scores for candidates
   */
  private async calculateMatchScores(candidates: any[], parsedQuery: any) {
    return candidates.map(candidate => {
      const matchScore = this.calculateMatchScore(candidate, parsedQuery);
      const matchReasons = this.generateMatchReasons(candidate, parsedQuery);
      
      return {
        ...candidate,
        matchScore,
        matchReasons
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Calculate individual match score
   */
  private calculateMatchScore(candidate: any, parsedQuery: any): number {
    let score = 0;
    let totalWeight = 0;

    // Skills matching (60% weight)
    const skillsWeight = 0.6;
    const skillsScore = this.calculateSkillsScore(candidate, parsedQuery);
    score += skillsScore * skillsWeight;
    totalWeight += skillsWeight;

    // Experience level matching (20% weight)
    const experienceWeight = 0.2;
    const experienceScore = this.calculateExperienceScore(candidate, parsedQuery);
    score += experienceScore * experienceWeight;
    totalWeight += experienceWeight;

    // Location matching (10% weight)
    const locationWeight = 0.1;
    const locationScore = this.calculateLocationScore(candidate, parsedQuery);
    score += locationScore * locationWeight;
    totalWeight += locationWeight;

    // Market value (10% weight)
    const marketWeight = 0.1;
    const marketScore = candidate.market_value || 0.5;
    score += marketScore * marketWeight;
    totalWeight += marketWeight;

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Calculate skills matching score
   */
  private calculateSkillsScore(candidate: any, parsedQuery: any): number {
    const candidateSkills = [
      ...(candidate.primary_skills || []),
      ...(candidate.secondary_skills || [])
    ].map(skill => skill.toLowerCase());

    const requiredSkills = parsedQuery.requiredSkills.map((skill: string) => skill.toLowerCase());
    const niceToHaveSkills = parsedQuery.niceToHaveSkills.map((skill: string) => skill.toLowerCase());

    let score = 0;

    // Required skills (70% of skills score)
    const requiredMatches = requiredSkills.filter((skill: string) => 
      candidateSkills.some((candidateSkill: string) => 
        candidateSkill.includes(skill) || skill.includes(candidateSkill)
      )
    ).length;
    
    if (requiredSkills.length > 0) {
      score += (requiredMatches / requiredSkills.length) * 0.7;
    }

    // Nice-to-have skills (30% of skills score)
    const niceToHaveMatches = niceToHaveSkills.filter((skill: string) => 
      candidateSkills.some((candidateSkill: string) => 
        candidateSkill.includes(skill) || skill.includes(candidateSkill)
      )
    ).length;
    
    if (niceToHaveSkills.length > 0) {
      score += (niceToHaveMatches / niceToHaveSkills.length) * 0.3;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate experience level score
   */
  private calculateExperienceScore(candidate: any, parsedQuery: any): number {
    const candidateYears = candidate.experience_years || 0;
    const requiredYears = this.getExperienceYearsForLevel(parsedQuery.experienceLevel);
    
    if (candidateYears >= requiredYears.min && candidateYears <= requiredYears.max) {
      return 1.0;
    } else if (candidateYears < requiredYears.min) {
      return candidateYears / requiredYears.min;
    } else {
      return Math.max(0.5, 1.0 - (candidateYears - requiredYears.max) / 10);
    }
  }

  /**
   * Calculate location score
   */
  private calculateLocationScore(candidate: any, parsedQuery: any): number {
    if (!parsedQuery.location) return 1.0;
    
    const candidateLocation = (candidate.location || '').toLowerCase();
    const queryLocation = parsedQuery.location.toLowerCase();
    
    if (candidateLocation.includes(queryLocation)) {
      return 1.0;
    } else if (candidateLocation.includes('remote') || queryLocation.includes('remote')) {
      return 0.8;
    } else {
      return 0.3;
    }
  }

  /**
   * Generate match reasons
   */
  private generateMatchReasons(candidate: any, parsedQuery: any): string[] {
    const reasons: string[] = [];
    
    // Skills reasons
    const candidateSkills = [
      ...(candidate.primary_skills || []),
      ...(candidate.secondary_skills || [])
    ].map(skill => skill.toLowerCase());

    const matchingSkills = parsedQuery.requiredSkills.filter((skill: string) => 
      candidateSkills.some((candidateSkill: string) => 
        candidateSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(candidateSkill)
      )
    );

    if (matchingSkills.length > 0) {
      reasons.push(`Matches ${matchingSkills.length} required skills: ${matchingSkills.join(', ')}`);
    }

    // Experience reasons
    const candidateYears = candidate.experience_years || 0;
    if (candidateYears >= 5) {
      reasons.push(`${candidateYears} years of experience`);
    }

    // Market value reasons
    if (candidate.market_value > 0.8) {
      reasons.push('High market value');
    }

    return reasons;
  }

  /**
   * Generate search insights
   */
  private async generateSearchInsights(candidates: any[], parsedQuery: any) {
    const totalCandidates = candidates.length;
    const averageMatchScore = totalCandidates > 0 
      ? candidates.reduce((sum, c) => sum + c.matchScore, 0) / totalCandidates 
      : 0;

    // Find skill gaps
    const allSkills = candidates.flatMap(c => [...(c.primary_skills || []), ...(c.secondary_skills || [])]);
    const skillCounts = allSkills.reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const skillGaps = parsedQuery.requiredSkills.filter((skill: string) => 
      !Object.keys(skillCounts).some(candidateSkill => 
        candidateSkill.toLowerCase().includes(skill.toLowerCase())
      )
    );

    return {
      totalCandidates,
      averageMatchScore,
      skillGaps,
      marketInsights: {
        topSkills: Object.entries(skillCounts)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 10)
          .map(([skill, count]) => ({ skill, count })),
        averageExperience: candidates.reduce((sum, c) => sum + (c.experience_years || 0), 0) / totalCandidates
      },
      recommendations: this.generateRecommendations(candidates, skillGaps)
    };
  }

  /**
   * Generate AI assistant response
   */
  private async generateAIAssistantResponse(query: SmartSearchQuery, candidates: any[], insights: any) {
    const prompt = `
You are an AI recruitment assistant. Based on this search query and results, provide a helpful response.

Search Query: "${query.query}"
Number of candidates found: ${candidates.length}
Average match score: ${insights.averageMatchScore.toFixed(2)}
Skill gaps: ${insights.skillGaps.join(', ')}

Provide:
1. A brief summary of the search results
2. Suggestions for refining the search if needed
3. 2-3 follow-up questions to better understand requirements

Return JSON with: response, suggestions, followUpQuestions
`;

    try {
      const response = await this.callDeepSeek(prompt);
      const data = JSON.parse(response);
      
      return {
        response: data.response || 'Found candidates matching your criteria.',
        suggestions: data.suggestions || [],
        followUpQuestions: data.followUpQuestions || []
      };
    } catch (error) {
      console.error('Error generating AI assistant response:', error);
      return {
        response: `Found ${candidates.length} candidates matching your criteria.`,
        suggestions: ['Try adding more specific skills', 'Consider different experience levels'],
        followUpQuestions: ['What specific technologies are most important?', 'Are you open to remote candidates?']
      };
    }
  }

  /**
   * Get experience years for level
   */
  private getExperienceYearsForLevel(level: string) {
    switch (level) {
      case 'junior': return { min: 0, max: 3 };
      case 'middle': return { min: 3, max: 7 };
      case 'senior': return { min: 7, max: 12 };
      case 'lead': return { min: 10, max: 20 };
      default: return { min: 0, max: 10 };
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(candidates: any[], skillGaps: string[]): string[] {
    const recommendations: string[] = [];
    
    if (candidates.length === 0) {
      recommendations.push('No candidates found. Try broadening your search criteria.');
    } else if (candidates.length < 5) {
      recommendations.push('Consider expanding your search to include more skills or locations.');
    }
    
    if (skillGaps.length > 0) {
      recommendations.push(`Consider candidates with these skills: ${skillGaps.join(', ')}`);
    }
    
    if (candidates.length > 20) {
      recommendations.push('Many candidates found. Consider adding more specific requirements.');
    }
    
    return recommendations;
  }

  /**
   * Log search intelligence
   */
  private async logSearchIntelligence(query: SmartSearchQuery, resultsCount: number, successScore: number) {
    try {
      await this.supabase
        .from('search_intelligence')
        .insert({
          search_query: query.query,
          search_context: query.context,
          results_returned: resultsCount,
          search_success_score: successScore,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging search intelligence:', error);
    }
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
            content: 'You are an expert recruitment assistant. Provide helpful, accurate responses about candidate search and matching.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }
}
