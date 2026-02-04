import { Injectable, inject } from '@angular/core';
// Fix: Import GenerateContentResponse for proper typing.
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly ai: GoogleGenAI;
  private readonly translationService = inject(TranslationService);

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set.");
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async generateScript(storyIdea: string, tone: string, model: string): Promise<string> {
    const promptTemplate = this.translationService.translate('geminiPrompt');

    const prompt = promptTemplate
      .replace('{{tone}}', tone)
      .replace('{{storyIdea}}', storyIdea);

    try {
      // Fix: Add explicit type for the response from the Gemini API.
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: model,
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('The AI model failed to generate a response. Please try again later.');
    }
  }
}
