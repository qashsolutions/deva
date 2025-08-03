import { aiProvider } from './aiProvider';
import { 
  CeremonyGuide, 
  CeremonyPreparation,
  RequiredItem,
  FAQ,
  ChatMessage,
  ParsedBookingIntent,
  NaturalLanguageBookingRequest
} from '../../types/ai';
import { CEREMONY_TYPES } from '../../config/constants';
import { aiCache } from './aiCache';

class CeremonyGuideService {
  async generateGuide(ceremonyType: string, context?: any): Promise<CeremonyGuide> {
    try {
      // Check cache first for common ceremonies
      const cacheKey = `ceremony_guide_${ceremonyType}`;
      const cached = await aiCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      const systemPrompt = this.buildCeremonySystemPrompt();
      const userPrompt = this.buildCeremonyUserPrompt(ceremonyType, context);
      
      const response = await aiProvider.processQuery(
        userPrompt,
        { 
          type: 'ceremony_guide',
          ceremonyType,
          context 
        },
        {
          systemPrompt,
          temperature: 0.5,
          maxTokens: 2500,
        }
      );

      const guide = this.parseCeremonyGuide(response.content, ceremonyType);
      
      // Cache for common ceremonies
      if (this.isCommonCeremony(ceremonyType)) {
        await aiCache.set(cacheKey, guide, { ttl: 86400 }); // 24 hours
      }
      
      return guide;
    } catch (error) {
      console.error('Error generating ceremony guide:', error);
      return this.getFallbackGuide(ceremonyType);
    }
  }

  async answerCeremonyQuestion(
    question: string,
    ceremonyType: string,
    conversationHistory?: ChatMessage[]
  ): Promise<string> {
    const systemPrompt = `You are an expert on Hindu religious ceremonies and traditions.
    
Answer questions accurately and respectfully about ${ceremonyType}.
Consider:
- Religious significance and traditions
- Practical preparation advice
- Cultural sensitivity
- Regional variations
- Modern adaptations

Keep answers concise but informative.`;

    const context = conversationHistory 
      ? conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      : '';

    const userPrompt = `${context}\n\nUser: ${question}`;
    
    const response = await aiProvider.processQuery(
      userPrompt,
      { type: 'ceremony_qa', ceremonyType },
      { systemPrompt, temperature: 0.7, maxTokens: 500 }
    );

    return response.content;
  }

  async parseBookingIntent(
    request: NaturalLanguageBookingRequest
  ): Promise<ParsedBookingIntent> {
    const systemPrompt = `Extract booking intent from natural language requests for Hindu ceremonies.
    
Parse:
1. Type of ceremony/service
2. Date preferences (specific, range, or flexible)
3. Location preferences
4. Budget expectations
5. Special requirements

Return structured JSON with confidence score (0-1).`;

    const userPrompt = `Parse this booking request:
"${request.query}"

User context: ${request.userId}
Previous context: ${JSON.stringify(request.context?.context || {})}`;

    const response = await aiProvider.processQuery(
      userPrompt,
      { type: 'booking_intent', request },
      { systemPrompt, temperature: 0.3, maxTokens: 800 }
    );

    return this.extractBookingIntent(response.content, request.query);
  }

  private buildCeremonySystemPrompt(): string {
    return `You are an expert on Hindu religious ceremonies and traditions, helping devotees prepare properly.

Create comprehensive guides that include:
1. Ceremony significance and cultural background
2. Step-by-step preparation instructions
3. Required items with alternatives
4. Important dos and don'ts
5. Frequently asked questions
6. Regional variations and modern adaptations

Be respectful, accurate, and practical. Consider both traditional requirements and modern constraints.
Format as structured JSON.`;
  }

  private buildCeremonyUserPrompt(ceremonyType: string, context?: any): string {
    return `Create a comprehensive guide for: ${ceremonyType}

Additional context:
${context ? JSON.stringify(context, null, 2) : 'Standard ceremony'}

Please provide a detailed JSON guide with this structure:
{
  "title": "string",
  "description": "string",
  "duration": "string",
  "significance": "string",
  "preparations": [
    {
      "category": "spiritual" | "physical" | "material" | "dietary",
      "title": "string",
      "description": "string",
      "timeline": "string",
      "required": boolean
    }
  ],
  "items": [
    {
      "name": "string",
      "quantity": "string",
      "description": "string",
      "alternatives": ["string"],
      "whereToGet": "string",
      "estimatedCost": "string"
    }
  ],
  "dosDonts": {
    "dos": ["string"],
    "donts": ["string"]
  },
  "faqs": [
    {
      "question": "string",
      "answer": "string",
      "category": "string"
    }
  ],
  "culturalNotes": ["string"]
}`;
  }

  private parseCeremonyGuide(aiResponse: string, ceremonyType: string): CeremonyGuide {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        id: `guide_${Date.now()}`,
        ceremonyType,
        title: parsed.title || ceremonyType,
        description: parsed.description || '',
        duration: parsed.duration || '1-2 hours',
        significance: parsed.significance || '',
        preparations: this.parsePreparations(parsed.preparations),
        items: this.parseItems(parsed.items),
        dosDonts: {
          dos: parsed.dosDonts?.dos || [],
          donts: parsed.dosDonts?.donts || [],
        },
        faqs: this.parseFAQs(parsed.faqs),
        culturalNotes: parsed.culturalNotes || [],
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error parsing ceremony guide:', error);
      return this.getFallbackGuide(ceremonyType);
    }
  }

  private parsePreparations(preparations: any[]): CeremonyPreparation[] {
    if (!Array.isArray(preparations)) return [];
    
    return preparations.map(prep => ({
      category: prep.category || 'spiritual',
      title: prep.title || '',
      description: prep.description || '',
      timeline: prep.timeline || 'Day of ceremony',
      required: prep.required !== false,
    }));
  }

  private parseItems(items: any[]): RequiredItem[] {
    if (!Array.isArray(items)) return [];
    
    return items.map(item => ({
      name: item.name || '',
      quantity: item.quantity || '1',
      description: item.description || '',
      alternatives: item.alternatives || [],
      whereToGet: item.whereToGet,
      estimatedCost: item.estimatedCost,
    }));
  }

  private parseFAQs(faqs: any[]): FAQ[] {
    if (!Array.isArray(faqs)) return [];
    
    return faqs.map(faq => ({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || 'General',
    }));
  }

  private extractBookingIntent(
    aiResponse: string,
    originalQuery: string
  ): ParsedBookingIntent {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        serviceType: parsed.serviceType || this.guessServiceType(originalQuery),
        datePreferences: this.parseDatePreferences(parsed.datePreferences),
        locationPreference: parsed.locationPreference,
        budgetRange: parsed.budgetRange,
        specialRequirements: parsed.specialRequirements || [],
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      console.error('Error extracting booking intent:', error);
      return {
        serviceType: this.guessServiceType(originalQuery),
        datePreferences: { flexibility: 'flexible' },
        specialRequirements: [],
        confidence: 0.3,
      };
    }
  }

  private parseDatePreferences(prefs: any): ParsedBookingIntent['datePreferences'] {
    if (!prefs) return { flexibility: 'flexible' };
    
    if (prefs.specific) {
      return {
        specific: new Date(prefs.specific),
        flexibility: 'exact',
      };
    }
    
    if (prefs.range) {
      return {
        range: {
          start: new Date(prefs.range.start),
          end: new Date(prefs.range.end),
        },
        flexibility: 'flexible',
      };
    }
    
    return { flexibility: prefs.flexibility || 'flexible' };
  }

  private guessServiceType(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    for (const [key, name] of Object.entries(CEREMONY_TYPES)) {
      if (lowerQuery.includes(name.toLowerCase())) {
        return key;
      }
    }
    
    // Check for common keywords
    if (lowerQuery.includes('wedding') || lowerQuery.includes('marriage')) {
      return 'wedding';
    }
    if (lowerQuery.includes('house') || lowerQuery.includes('home')) {
      return 'house_blessing';
    }
    if (lowerQuery.includes('naming') || lowerQuery.includes('baby')) {
      return 'naming_ceremony';
    }
    
    return 'general_puja';
  }

  private isCommonCeremony(ceremonyType: string): boolean {
    const common = ['general_puja', 'house_blessing', 'wedding', 'naming_ceremony'];
    return common.includes(ceremonyType);
  }

  private getFallbackGuide(ceremonyType: string): CeremonyGuide {
    return {
      id: `guide_fallback_${Date.now()}`,
      ceremonyType,
      title: ceremonyType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Traditional Hindu ${ceremonyType.replace(/_/g, ' ')} ceremony`,
      duration: '1-2 hours',
      significance: 'This ceremony holds deep spiritual significance in Hindu tradition.',
      preparations: [
        {
          category: 'spiritual',
          title: 'Mental Preparation',
          description: 'Maintain a peaceful and devotional mindset',
          timeline: 'Day before',
          required: true,
        },
        {
          category: 'physical',
          title: 'Cleanliness',
          description: 'Take a bath and wear clean clothes',
          timeline: 'Day of ceremony',
          required: true,
        },
      ],
      items: [
        {
          name: 'Flowers',
          quantity: '1 dozen',
          description: 'Fresh flowers for offering',
          alternatives: ['Any fresh flowers available locally'],
          whereToGet: 'Local florist or Indian grocery store',
          estimatedCost: '$10-15',
        },
        {
          name: 'Fruits',
          quantity: '5-7 pieces',
          description: 'Fresh fruits for prasad',
          alternatives: ['Any seasonal fruits'],
          whereToGet: 'Grocery store',
          estimatedCost: '$10-20',
        },
      ],
      dosDonts: {
        dos: [
          'Maintain cleanliness',
          'Follow priest instructions',
          'Participate with devotion',
        ],
        donts: [
          'Avoid non-vegetarian food on ceremony day',
          'Do not wear leather items',
          'Avoid alcohol before ceremony',
        ],
      },
      faqs: [
        {
          question: 'What should I wear?',
          answer: 'Traditional Indian attire is preferred, but clean, modest clothing is acceptable.',
          category: 'Preparation',
        },
        {
          question: 'Can children participate?',
          answer: 'Yes, children are welcome and encouraged to participate in the ceremony.',
          category: 'General',
        },
      ],
      culturalNotes: [
        'Regional variations may exist in ceremony procedures',
        'Consult with your priest for specific requirements',
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}

export const ceremonyGuideService = new CeremonyGuideService();