import { aiProvider } from './aiProvider';
import { 
  PriestRecommendation, 
  MatchingCriteria,
  AIQueryOptions 
} from '../../types/ai';
import { Priest } from '../../types/user';
import { calculateDistance } from '../../utils/locationUtils';
import { getPriestsByLocation, getPriestAvailability } from '../firestore';

class PriestMatchingService {
  async findBestMatches(
    criteria: MatchingCriteria,
    limit: number = 5
  ): Promise<PriestRecommendation[]> {
    try {
      // Get available priests in the area
      const availablePriests = await this.getAvailablePriests(criteria);
      
      if (availablePriests.length === 0) {
        return [];
      }

      // Prepare AI prompt
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(criteria, availablePriests);
      
      // Get AI recommendations
      const response = await aiProvider.processQuery(
        userPrompt,
        { 
          type: 'priest_matching',
          criteria,
          priestCount: availablePriests.length 
        },
        {
          systemPrompt,
          temperature: 0.7,
          maxTokens: 2000,
        }
      );

      // Parse AI response
      const recommendations = this.parseRecommendations(
        response.content,
        availablePriests,
        criteria
      );

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error in priest matching:', error);
      // Fallback to basic matching
      return this.fallbackMatching(criteria, limit);
    }
  }

  private buildSystemPrompt(): string {
    return `You are an expert at matching Hindu devotees with qualified priests for religious ceremonies.
    
Your task is to analyze priests and recommend the best matches based on:
1. Service expertise and experience
2. Location and travel distance
3. Language compatibility
4. Pricing and budget fit
5. Availability for requested dates
6. Reviews and ratings
7. Special requirements compatibility

For each recommendation, provide:
- A match score (0-100)
- Clear reasoning for the match
- Specific strengths that make them suitable
- Any considerations the devotee should know

Format your response as a JSON array of recommendations.`;
  }

  private buildUserPrompt(
    criteria: MatchingCriteria,
    priests: Priest[]
  ): string {
    const priestsData = priests.map(p => ({
      id: p.id,
      name: p.name,
      yearsOfExperience: p.priestProfile?.yearsOfExperience,
      languages: p.languages,
      specializations: p.priestProfile?.specializations,
      servicesOffered: p.priestProfile?.servicesOffered?.length,
      rating: p.priestProfile?.rating,
      reviewCount: p.priestProfile?.reviewCount,
      location: p.location,
      priestType: p.priestProfile?.priestType,
      templeName: p.priestProfile?.templeName,
    }));

    return `Devotee Request:
Query: "${criteria.query}"
Service Type: ${criteria.serviceType || 'Not specified'}
Location: ${criteria.location.city}, ${criteria.location.state} ${criteria.location.zipCode}
Date Range: ${criteria.dateRange ? `${criteria.dateRange.start.toDateString()} to ${criteria.dateRange.end.toDateString()}` : 'Flexible'}
Budget: ${criteria.budget ? `$${criteria.budget.min} - $${criteria.budget.max}` : 'Open to quotes'}
Languages: ${criteria.languages?.join(', ') || 'Any'}
Priest Type Preference: ${criteria.priestType || 'Any'}
Special Requirements: ${criteria.specialRequirements?.join(', ') || 'None'}

Available Priests:
${JSON.stringify(priestsData, null, 2)}

Please analyze these priests and provide the top matches as a JSON array with this structure:
[
  {
    "priestId": "priest_id",
    "matchScore": 85,
    "reasoning": "Detailed explanation of why this is a good match",
    "strengths": ["strength1", "strength2", "strength3"],
    "considerations": ["consideration1", "consideration2"]
  }
]`;
  }

  private parseRecommendations(
    aiResponse: string,
    priests: Priest[],
    criteria: MatchingCriteria
  ): PriestRecommendation[] {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return parsed.map((rec: any) => {
        const priest = priests.find(p => p.id === rec.priestId);
        if (!priest) return null;

        const distance = calculateDistance(
          { lat: criteria.location.coordinates.lat, lng: criteria.location.coordinates.lng },
          { lat: priest.location.coordinates.lat, lng: priest.location.coordinates.lng }
        );

        return {
          priest,
          matchScore: rec.matchScore || 0,
          reasoning: rec.reasoning || '',
          strengths: rec.strengths || [],
          considerations: rec.considerations || [],
          travelDistance: distance,
          availability: {
            nextAvailable: new Date().toISOString(), // Would fetch from calendar
            hasRequestedSlot: true, // Would check actual availability
          },
        };
      }).filter(Boolean);
    } catch (error) {
      console.error('Error parsing AI recommendations:', error);
      return this.createBasicRecommendations(priests, criteria);
    }
  }

  private async getAvailablePriests(criteria: MatchingCriteria): Promise<Priest[]> {
    const radiusMiles = 50; // Default search radius
    const priests = await getPriestsByLocation(
      criteria.location.coordinates,
      radiusMiles
    );

    // Filter by basic criteria
    return priests.filter(priest => {
      // Language filter
      if (criteria.languages && criteria.languages.length > 0) {
        const hasLanguage = criteria.languages.some(lang => 
          priest.languages.includes(lang)
        );
        if (!hasLanguage) return false;
      }

      // Priest type filter
      if (criteria.priestType && priest.priestProfile?.priestType !== criteria.priestType) {
        return false;
      }

      // Service type filter
      if (criteria.serviceType) {
        const offersService = priest.priestProfile?.servicesOffered?.some(
          service => service.serviceName.toLowerCase().includes(criteria.serviceType!.toLowerCase())
        );
        if (!offersService) return false;
      }

      return true;
    });
  }

  private createBasicRecommendations(
    priests: Priest[],
    criteria: MatchingCriteria
  ): PriestRecommendation[] {
    return priests
      .map(priest => {
        let score = 50; // Base score
        
        // Language match
        if (criteria.languages?.some(lang => priest.languages.includes(lang))) {
          score += 15;
        }
        
        // Rating bonus
        if (priest.priestProfile?.rating) {
          score += priest.priestProfile.rating * 5;
        }
        
        // Experience bonus
        if (priest.priestProfile?.yearsOfExperience) {
          score += Math.min(priest.priestProfile.yearsOfExperience * 2, 20);
        }

        const distance = calculateDistance(
          { lat: criteria.location.coordinates.lat, lng: criteria.location.coordinates.lng },
          { lat: priest.location.coordinates.lat, lng: priest.location.coordinates.lng }
        );

        return {
          priest,
          matchScore: Math.min(score, 100),
          reasoning: 'Matched based on location, languages, and experience',
          strengths: [
            `${priest.priestProfile?.yearsOfExperience || 0} years of experience`,
            `Speaks ${priest.languages.join(', ')}`,
            `Located ${distance.toFixed(1)} miles away`,
          ],
          considerations: [],
          travelDistance: distance,
          availability: {
            nextAvailable: new Date().toISOString(),
            hasRequestedSlot: true,
          },
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  private async fallbackMatching(
    criteria: MatchingCriteria,
    limit: number
  ): Promise<PriestRecommendation[]> {
    const priests = await this.getAvailablePriests(criteria);
    return this.createBasicRecommendations(priests, criteria).slice(0, limit);
  }

  // Natural language query parser
  async parseNaturalLanguageQuery(query: string): Promise<Partial<MatchingCriteria>> {
    const systemPrompt = `Extract ceremony details from natural language queries.
    
Return a JSON object with:
- serviceType: type of ceremony
- dateRange: if dates are mentioned
- budget: if price is mentioned
- languages: if languages are specified
- specialRequirements: any special needs`;

    const response = await aiProvider.processQuery(
      `Query: "${query}"`,
      { type: 'query_parsing' },
      { systemPrompt, temperature: 0.3, maxTokens: 500 }
    );

    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing natural language query:', error);
    }

    return {};
  }
}

export const priestMatchingService = new PriestMatchingService();