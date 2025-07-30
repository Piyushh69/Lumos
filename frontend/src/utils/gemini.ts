// src/utils/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = your_api_key;

interface GeminiResponse {
  text: string;
  safetyRatings: Array<{ category: string; probability: string }>;
}

export async function callGemini(
  prompt: string,
  options?: {
    temperature?: number;
    model?: 'gemini-2.0-flash' | 'gemini-2.0-pro';
  }
): Promise<GeminiResponse> {
  try {
    const model = genAI.getGenerativeModel({
      model: options?.model || 'gemini-2.0-flash',
      generationConfig: {
        temperature: options?.temperature || 0.7,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    return {
      text: response.text(),
      safetyRatings: response.promptFeedback?.safetyRatings?.map(rating => ({
        category: rating.category,
        probability: rating.probability
      })) || []
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      text: 'Unable to generate response at this time',
      safetyRatings: []
    };
  }
}
