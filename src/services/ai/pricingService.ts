import { aiProvider } from './aiProvider';
import { 
  PricingInsight, 
  PricingQuery,
  GeneratedQuote,
  QuoteRequest 
} from '../../types/ai';
import { ServiceOffering } from '../../types/user';
import { getPriceAnalytics, getServicePriceHistory } from '../firestore';
import { formatPrice } from '../../utils/formatters';

class PricingService {
  async getMarketInsights(query: PricingQuery): Promise<PricingInsight> {
    try {
      // Fetch market data
      const marketData = await this.fetchMarketData(query);
      
      // Prepare AI prompt
      const systemPrompt = this.buildPricingSystemPrompt();
      const userPrompt = this.buildPricingUserPrompt(query, marketData);
      
      // Get AI analysis
      const response = await aiProvider.processQuery(
        userPrompt,
        { 
          type: 'pricing_analysis',
          query,
          dataPoints: marketData.length 
        },
        {
          systemPrompt,
          temperature: 0.3, // Lower temperature for more consistent pricing
          maxTokens: 1500,
        }
      );

      // Parse and enhance response
      const insight = this.parsePricingInsight(response.content, query, marketData);
      
      return insight;
    } catch (error) {
      console.error('Error getting pricing insights:', error);
      return this.generateFallbackInsight(query);
    }
  }

  async generateQuote(
    request: QuoteRequest,
    priestId: string,
    service: ServiceOffering
  ): Promise<GeneratedQuote> {
    try {
      const systemPrompt = `You are helping a Hindu priest create professional, culturally appropriate quotes for ceremony services.
      
Generate quotes that:
1. Are respectful and formal
2. Include clear pricing breakdown
3. Explain what's included
4. Set appropriate terms
5. Add a personal touch while maintaining professionalism`;

      const userPrompt = `Create a quote for:
Service: ${service.serviceName}
Base Price: ${service.pricing.type === 'fixed' ? `$${service.pricing.fixed}` : `$${service.pricing.rangeMin} - $${service.pricing.rangeMax}`}
Requirements: ${request.requirements}
Location: ${request.location.city}, ${request.location.state}
Date: ${request.proposedDate || 'To be determined'}
Special Instructions: ${request.specialInstructions || 'None'}

Additional context:
- Service duration: ${service.duration} hours
- Languages offered: ${service.languages.join(', ')}
- Travel may be required: ${request.location.city !== service.location}`;

      const response = await aiProvider.processQuery(
        userPrompt,
        { type: 'quote_generation', serviceId: service.id },
        { systemPrompt, temperature: 0.7, maxTokens: 1000 }
      );

      return this.parseGeneratedQuote(response.content, service, request);
    } catch (error) {
      console.error('Error generating quote:', error);
      return this.createBasicQuote(service, request);
    }
  }

  private buildPricingSystemPrompt(): string {
    return `You are a pricing expert for Hindu religious ceremony services in the US market.

Analyze market data and provide pricing recommendations considering:
1. Service complexity and duration
2. Geographic location and cost of living
3. Priest experience and qualifications
4. Market demand and competition
5. Seasonal factors
6. Travel requirements
7. Special ceremony requirements

Provide insights that help priests price competitively while maintaining fair compensation.
Format your response as structured JSON.`;
  }

  private buildPricingUserPrompt(
    query: PricingQuery,
    marketData: any[]
  ): string {
    return `Analyze pricing for:
Service Type: ${query.serviceType}
Location: ${query.location.city}, ${query.location.state}
Priest Experience: ${query.priestExperience} years
Duration: ${query.duration || 'Standard'} hours
Travel Included: ${query.includeTravel ? 'Yes' : 'No'}
Special Requirements: ${query.specialRequirements?.join(', ') || 'None'}

Market Data (${marketData.length} data points):
${JSON.stringify(marketData.slice(0, 10), null, 2)}

Provide a comprehensive pricing analysis as JSON with:
{
  "marketAnalysis": {
    "averagePrice": number,
    "priceRange": { "min": number, "max": number, "median": number },
    "demandLevel": "low" | "moderate" | "high",
    "competitorCount": number
  },
  "recommendations": {
    "suggestedPrice": number,
    "reasoning": "string",
    "pricingStrategy": "competitive" | "premium" | "value",
    "adjustmentFactors": ["factor1", "factor2"]
  },
  "trends": {
    "direction": "increasing" | "stable" | "decreasing",
    "seasonalFactors": ["factor1", "factor2"],
    "peakDates": ["date1", "date2"]
  }
}`;
  }

  private async fetchMarketData(query: PricingQuery): Promise<any[]> {
    try {
      const analytics = await getPriceAnalytics({
        serviceType: query.serviceType,
        location: query.location,
        radius: 50, // 50 mile radius
        timeframe: 90, // Last 90 days
      });
      
      return analytics;
    } catch (error) {
      console.error('Error fetching market data:', error);
      return [];
    }
  }

  private parsePricingInsight(
    aiResponse: string,
    query: PricingQuery,
    marketData: any[]
  ): PricingInsight {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        serviceId: query.serviceType,
        serviceName: query.serviceType,
        marketAnalysis: {
          averagePrice: parsed.marketAnalysis?.averagePrice || this.calculateAverage(marketData),
          priceRange: parsed.marketAnalysis?.priceRange || this.calculateRange(marketData),
          demandLevel: parsed.marketAnalysis?.demandLevel || 'moderate',
          competitorCount: parsed.marketAnalysis?.competitorCount || marketData.length,
        },
        recommendations: {
          suggestedPrice: parsed.recommendations?.suggestedPrice || this.calculateSuggestedPrice(query, marketData),
          reasoning: parsed.recommendations?.reasoning || 'Based on market averages and your experience',
          pricingStrategy: parsed.recommendations?.pricingStrategy || 'competitive',
          adjustmentFactors: parsed.recommendations?.adjustmentFactors || [],
        },
        trends: {
          direction: parsed.trends?.direction || 'stable',
          seasonalFactors: parsed.trends?.seasonalFactors || [],
          peakDates: parsed.trends?.peakDates || [],
        },
      };
    } catch (error) {
      console.error('Error parsing pricing insight:', error);
      return this.generateFallbackInsight(query);
    }
  }

  private parseGeneratedQuote(
    aiResponse: string,
    service: ServiceOffering,
    request: QuoteRequest
  ): GeneratedQuote {
    // Extract pricing information
    const basePrice = service.pricing.type === 'fixed' 
      ? service.pricing.fixed! 
      : (service.pricing.rangeMin! + service.pricing.rangeMax!) / 2;
    
    const travelFee = this.calculateTravelFee(request.location, service.location);
    
    return {
      quoteText: aiResponse,
      priceBreakdown: {
        basePrice,
        travelFee: travelFee > 0 ? travelFee : undefined,
        total: basePrice + travelFee,
      },
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      terms: [
        'Price valid for 7 days',
        '50% deposit required to confirm booking',
        'Cancellation policy applies',
        'Additional services may incur extra charges',
      ],
      personalizedMessage: this.extractPersonalMessage(aiResponse),
    };
  }

  private calculateAverage(data: any[]): number {
    if (data.length === 0) return 200; // Default
    const sum = data.reduce((acc, item) => acc + (item.price || 0), 0);
    return Math.round(sum / data.length);
  }

  private calculateRange(data: any[]): { min: number; max: number; median: number } {
    if (data.length === 0) {
      return { min: 100, max: 500, median: 250 };
    }
    
    const prices = data.map(item => item.price || 0).sort((a, b) => a - b);
    return {
      min: prices[0],
      max: prices[prices.length - 1],
      median: prices[Math.floor(prices.length / 2)],
    };
  }

  private calculateSuggestedPrice(query: PricingQuery, marketData: any[]): number {
    let basePrice = this.calculateAverage(marketData);
    
    // Adjust for experience
    if (query.priestExperience > 10) {
      basePrice *= 1.2; // 20% premium for experienced priests
    } else if (query.priestExperience < 3) {
      basePrice *= 0.9; // 10% discount for newer priests
    }
    
    // Adjust for duration
    if (query.duration && query.duration > 2) {
      basePrice *= (query.duration / 2); // Scale with duration
    }
    
    return Math.round(basePrice);
  }

  private calculateTravelFee(customerLocation: any, priestLocation: any): number {
    // Simple travel fee calculation
    // In production, would use actual distance calculation
    return 50; // Flat fee for now
  }

  private extractPersonalMessage(aiResponse: string): string {
    // Extract a personal message from the AI response
    const lines = aiResponse.split('\n');
    return lines.find(line => line.length > 50) || 'Thank you for considering our services.';
  }

  private generateFallbackInsight(query: PricingQuery): PricingInsight {
    return {
      serviceId: query.serviceType,
      serviceName: query.serviceType,
      marketAnalysis: {
        averagePrice: 250,
        priceRange: { min: 100, max: 500, median: 250 },
        demandLevel: 'moderate',
        competitorCount: 10,
      },
      recommendations: {
        suggestedPrice: 275,
        reasoning: 'Based on standard market rates for your area and experience level',
        pricingStrategy: 'competitive',
        adjustmentFactors: ['Location', 'Experience', 'Service complexity'],
      },
      trends: {
        direction: 'stable',
        seasonalFactors: ['Festival seasons see 20-30% increase', 'Summer months are busiest'],
        peakDates: ['Diwali season', 'Summer wedding season'],
      },
    };
  }

  private createBasicQuote(
    service: ServiceOffering,
    request: QuoteRequest
  ): GeneratedQuote {
    const basePrice = service.pricing.type === 'fixed' 
      ? service.pricing.fixed! 
      : (service.pricing.rangeMin! + service.pricing.rangeMax!) / 2;
    
    return {
      quoteText: `Thank you for your interest in ${service.serviceName}. Based on your requirements, I'm pleased to provide this quote for your ceremony.`,
      priceBreakdown: {
        basePrice,
        total: basePrice,
      },
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      terms: [
        'Price valid for 7 days',
        '50% deposit required',
        'Standard cancellation policy applies',
      ],
      personalizedMessage: 'I look forward to serving you and making your ceremony special.',
    };
  }
}

export const pricingService = new PricingService();