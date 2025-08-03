import AsyncStorage from '@react-native-async-storage/async-storage';
import aiConfig, { getProviderConfig, AIProvider as AIProviderConfig } from '../../config/ai';
import { AIResponse, AIQueryOptions, AIError, ChatMessage } from '../../types/ai';
import { aiCache } from './aiCache';

class AIProvider {
  private primaryProvider: AIProviderConfig;
  private fallbackProvider: AIProviderConfig;
  
  constructor() {
    this.primaryProvider = getProviderConfig(aiConfig.primaryProvider);
    this.fallbackProvider = getProviderConfig(aiConfig.fallbackProvider);
  }

  async processQuery(
    prompt: string,
    context?: any,
    options: AIQueryOptions = {}
  ): Promise<AIResponse> {
    try {
      // Check cache first if not explicitly skipped
      if (!options.skipCache && aiConfig.caching.enabled) {
        const cacheKey = this.generateCacheKey(prompt, context);
        const cached = await aiCache.get(cacheKey);
        if (cached) {
          return {
            ...cached,
            cached: true,
          };
        }
      }

      // Try primary provider first
      try {
        const response = await this.callProvider(
          prompt,
          this.primaryProvider,
          options
        );
        
        // Cache successful response
        if (aiConfig.caching.enabled && !options.skipCache) {
          const cacheKey = this.generateCacheKey(prompt, context);
          await aiCache.set(cacheKey, response, {
            ttl: aiConfig.caching.ttl,
            tags: context?.tags,
          });
        }
        
        return response;
      } catch (primaryError) {
        console.warn('Primary AI provider failed:', primaryError);
        
        // Fallback to secondary provider
        if (this.fallbackProvider.name !== this.primaryProvider.name) {
          const response = await this.callProvider(
            prompt,
            this.fallbackProvider,
            options
          );
          return response;
        }
        
        throw primaryError;
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async callProvider(
    prompt: string,
    provider: AIProviderConfig,
    options: AIQueryOptions
  ): Promise<AIResponse> {
    const timeout = options.timeout || aiConfig.timeout;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      let response;
      
      if (provider.name === 'anthropic') {
        response = await this.callAnthropic(prompt, provider, options, controller.signal);
      } else if (provider.name === 'gemini') {
        response = await this.callGemini(prompt, provider, options, controller.signal);
      } else {
        throw new Error(`Unknown provider: ${provider.name}`);
      }
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw { code: 'TIMEOUT', message: 'AI request timed out' };
      }
      throw error;
    }
  }

  private async callAnthropic(
    prompt: string,
    provider: AIProviderConfig,
    options: AIQueryOptions,
    signal: AbortSignal
  ): Promise<AIResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: options.maxTokens || provider.maxTokens,
        temperature: options.temperature || provider.temperature,
        messages: [
          {
            role: 'user',
            content: options.systemPrompt 
              ? `${options.systemPrompt}\n\n${prompt}`
              : prompt,
          },
        ],
      }),
      signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw this.mapProviderError(error, 'anthropic');
    }

    const data = await response.json();
    
    return {
      content: data.content[0].text,
      provider: 'anthropic',
      model: provider.model,
      tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
      cached: false,
      timestamp: new Date().toISOString(),
      metadata: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
      },
    };
  }

  private async callGemini(
    prompt: string,
    provider: AIProviderConfig,
    options: AIQueryOptions,
    signal: AbortSignal
  ): Promise<AIResponse> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: options.systemPrompt 
                    ? `${options.systemPrompt}\n\n${prompt}`
                    : prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: options.temperature || provider.temperature,
            maxOutputTokens: options.maxTokens || provider.maxTokens,
          },
        }),
        signal,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw this.mapProviderError(error, 'gemini');
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    const tokensUsed = data.usageMetadata
      ? data.usageMetadata.promptTokenCount + data.usageMetadata.candidatesTokenCount
      : 0;

    return {
      content,
      provider: 'gemini',
      model: provider.model,
      tokensUsed,
      cached: false,
      timestamp: new Date().toISOString(),
      metadata: {
        promptTokens: data.usageMetadata?.promptTokenCount,
        candidatesTokens: data.usageMetadata?.candidatesTokenCount,
      },
    };
  }

  async processChat(
    messages: ChatMessage[],
    options: AIQueryOptions = {}
  ): Promise<AIResponse> {
    // Convert chat messages to a single prompt
    const prompt = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n\n');
    
    return this.processQuery(prompt, { type: 'chat', messages }, options);
  }

  private generateCacheKey(prompt: string, context?: any): string {
    const contextString = context ? JSON.stringify(context) : '';
    return `ai_${this.hashString(prompt + contextString)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private mapProviderError(error: any, provider: string): AIError {
    // Map provider-specific errors to our error types
    if (provider === 'anthropic') {
      if (error.error?.type === 'rate_limit_error') {
        return {
          code: 'RATE_LIMIT',
          message: 'Rate limit exceeded',
          provider: 'anthropic',
          retryAfter: 60,
        };
      }
    } else if (provider === 'gemini') {
      if (error.error?.status === 'RESOURCE_EXHAUSTED') {
        return {
          code: 'RATE_LIMIT',
          message: 'Rate limit exceeded',
          provider: 'gemini',
          retryAfter: 60,
        };
      }
    }

    return {
      code: 'PROVIDER_ERROR',
      message: error.message || 'AI provider error',
      provider: provider as 'anthropic' | 'gemini',
    };
  }

  private handleError(error: any): AIError {
    if (error.code) {
      return error; // Already formatted
    }
    
    return {
      code: 'PROVIDER_ERROR',
      message: error.message || 'Unknown error occurred',
    };
  }

  // Utility method to validate provider availability
  async validateProviders(): Promise<{
    primary: boolean;
    fallback: boolean;
  }> {
    const testPrompt = 'Hello, please respond with "OK" if you receive this.';
    
    let primaryOk = false;
    let fallbackOk = false;
    
    try {
      await this.callProvider(testPrompt, this.primaryProvider, {
        maxTokens: 10,
        skipCache: true,
      });
      primaryOk = true;
    } catch (error) {
      console.warn('Primary provider validation failed:', error);
    }
    
    if (this.fallbackProvider.name !== this.primaryProvider.name) {
      try {
        await this.callProvider(testPrompt, this.fallbackProvider, {
          maxTokens: 10,
          skipCache: true,
        });
        fallbackOk = true;
      } catch (error) {
        console.warn('Fallback provider validation failed:', error);
      }
    }
    
    return { primary: primaryOk, fallback: fallbackOk };
  }
}

export const aiProvider = new AIProvider();