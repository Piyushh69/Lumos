// // src/utils/gemini.ts
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(process.env.gemini_api_key!);

// interface GeminiResponse {
//   text: string;
//   safetyRatings: Array<{ category: string; probability: string }>;
// }

// export async function callGemini(
//   prompt: string,
//   options?: {
//     temperature?: number;
//     model?: 'gemini-2.0-flash' | 'gemini-2.0-pro';
//   }
// ): Promise<GeminiResponse> {
//   try {
//     const model = genAI.getGenerativeModel({
//       model: options?.model || 'gemini-2.5-flash-lite',
//       generationConfig: {
//         temperature: options?.temperature || 0.7,
//       }
//     });

//     const result = await model.generateContent(prompt);
//     const response = await result.response;

//     return {
//       text: response.text(),
//       safetyRatings: response.promptFeedback?.safetyRatings?.map(rating => ({
//         category: rating.category,
//         probability: rating.probability
//       })) || []
//     };
//   } catch (error) {
//     console.error('Gemini API Error:', error);
//     return {
//       text: 'Unable to generate response at this time',
//       safetyRatings: []
//     };
//   }
// }


// src/utils/gemini.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY!);

// interface GeminiResponse {
//   text: string;
//   safetyRatings: Array<{ category: string; probability: string }>;
// }

// export async function callGemini(
//   prompt: string,
//   options?: {
//     temperature?: number;
//     model?: 'gemini-2.0-flash-exp' | 'gemini-2.5-flash-lite' | 'gemini-1.5-pro';
//     maxOutputTokens?: number;
//     topK?: number;
//     topP?: number;
//   }
// ): Promise<GeminiResponse> {
//   try {
//     const model = genAI.getGenerativeModel({
//       model: options?.model || 'gemini-2.0-flash-exp',
//       generationConfig: {
//         temperature: options?.temperature || 0.7,
//         maxOutputTokens: options?.maxOutputTokens || 8192, // Increased for longer responses
//         topK: options?.topK || 40,
//         topP: options?.topP || 0.95,
//       },
//       safetySettings: [
//         {
//           category: HarmCategory.HARM_CATEGORY_HARASSMENT,
//           threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
//         },
//         {
//           category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
//           threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
//         },
//         {
//           category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
//           threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
//         },
//         {
//           category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
//           threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
//         }
//       ]

//     });

//     const result = await model.generateContent(prompt);
//     const response = await result.response;

//     // Check if response was blocked
//     if (response.promptFeedback?.blockReason) {
//       throw new Error(`Response blocked: ${response.promptFeedback.blockReason}`);
//     }

//     const text = response.text();

//     // Check if response seems truncated (ends mid-sentence)
//     if (text && !text.trim().endsWith('.') && !text.trim().endsWith('!') && !text.trim().endsWith('?') && !text.trim().endsWith('*')) {
//       console.warn('Response may be truncated');
//     }

//     return {
//       text: text || 'No response generated',
//       safetyRatings: response.promptFeedback?.safetyRatings?.map(rating => ({
//         category: rating.category,
//         probability: rating.probability
//       })) || []
//     };
//   } catch (error) {
//     console.error('Gemini API Error:', error);

//     // More specific error handling
//     if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
//       const message = (error as any).message as string;
//       if (message.includes('quota')) {
//         throw new Error('API quota exceeded. Please try again later.');
//       } else if (message.includes('safety')) {
//         throw new Error('Response blocked due to safety filters.');
//       } else {
//         throw new Error(`Failed to generate response: ${message}`);
//       }
//     } else {
//       throw new Error('Failed to generate response: Unknown error');
//     }
//   }
// }

// // Specialized function for job descriptions
// export async function generateJobDescription(
//   prompt: string,
//   options?: {
//     temperature?: number;
//     retryOnTruncation?: boolean;
//   }
// ): Promise<GeminiResponse> {
//   const enhancedPrompt = `${prompt}

// IMPORTANT INSTRUCTIONS:
// 1. Generate a COMPLETE job description from start to finish
// 2. End with a clear conclusion and application instructions
// 3. Ensure all sections are fully written
// 4. Do not truncate or cut off mid-sentence
// 5. Include a proper closing statement

// Please provide the complete response.`;

//   let attempt = 0;
//   const maxAttempts = options?.retryOnTruncation ? 3 : 1;

//   while (attempt < maxAttempts) {
//     try {
//       const response = await callGemini(enhancedPrompt, {
//         temperature: options?.temperature || 0.7,
//         maxOutputTokens: 8192,
//         model: 'gemini-2.0-flash-exp'
//       });

//       // Check if response seems complete
//       const text = response.text.trim();
//       const endsWithProperPunctuation = text.endsWith('.') || text.endsWith('!') || text.endsWith('?') || text.endsWith('*');
//       const hasMinimumLength = text.length > 1000; // Job descriptions should be substantial

//       if (endsWithProperPunctuation && hasMinimumLength) {
//         return response;
//       } else if (attempt < maxAttempts - 1) {
//         console.warn(`Response may be incomplete (attempt ${attempt + 1}), retrying...`);
//         attempt++;
//         continue;
//       } else {
//         // Last attempt, return what we have
//         console.warn('Final attempt - response may be incomplete');
//         return response;
//       }
//     } catch (error) {
//       if (attempt === maxAttempts - 1) {
//         throw error;
//       }
//       attempt++;
//       await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
//     }
//   }

//   throw new Error('Failed to generate complete response after all attempts');
// }

// import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY!);

interface GeminiResponse {
  text: string;
  safetyRatings: Array<{ category: string; probability: string }>;
}

 export async function generateJobDescription(
    prompt: string,
    options?: {
      temperature?: number;
      retryOnTruncation?: boolean;
    }
  ): Promise<GeminiResponse> {
    const enhancedPrompt = `${prompt}

IMPORTANT INSTRUCTIONS:
1. Generate a COMPLETE job description from start to finish
2. End with a clear conclusion and application instructions
3. Ensure all sections are fully written
4. Do not truncate or cut off mid-sentence
5. Include a proper closing statement

Please provide the complete response.`;

    let attempt = 0;
    const maxAttempts = options?.retryOnTruncation ? 3 : 1;

    while (attempt < maxAttempts) {
      try {
        const response = await callGemini(enhancedPrompt, {
          temperature: options?.temperature || 0.7,
          maxOutputTokens: 8192,
          model: 'gemini-2.0-flash-exp'
        });

        // Check if response seems complete
        const text = response.text.trim();
        const endsWithProperPunctuation = text.endsWith('.') || text.endsWith('!') || text.endsWith('?') || text.endsWith('*');
        const hasMinimumLength = text.length > 1000; // Job descriptions should be substantial

        if (endsWithProperPunctuation && hasMinimumLength) {
          return response;
        } else if (attempt < maxAttempts - 1) {
          console.warn(`Response may be incomplete (attempt ${attempt + 1}), retrying...`);
          attempt++;
          continue;
        } else {
          // Last attempt, return what we have
          console.warn('Final attempt - response may be incomplete');
          return response;
        }
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
      }
    }

    throw new Error('Failed to generate complete response after all attempts');
  }

export async function callGemini(
  prompt: string,
  options?: {
    temperature?: number;
    model?: 'gemini-2.0-flash-exp' | 'gemini-2.0-flash' | 'gemini-1.5-pro';
    maxOutputTokens?: number;
    topK?: number;
    topP?: number;
  }
): Promise<GeminiResponse> {
  try {
    const model = genAI.getGenerativeModel({
      model: options?.model || 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: options?.temperature || 0.7,
        maxOutputTokens: options?.maxOutputTokens || 8192,
        topK: options?.topK || 40,
        topP: options?.topP || 0.95,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }
      ]
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    if (response.promptFeedback?.blockReason) {
      throw new Error(`Response blocked: ${response.promptFeedback.blockReason}`);
    }

    const text = response.text();

    if (!text) {
      throw new Error('No response generated from AI');
    }

    return {
      text: text,
      safetyRatings: response.promptFeedback?.safetyRatings?.map(rating => ({
        category: rating.category,
        probability: rating.probability
      })) || []
    };
  } catch (error) {
    console.error('Gemini API Error:', error);

    if (typeof error === "object" && error !== null && "message" in error && typeof (error as any).message === "string") {
      const message = (error as any).message as string;
      if (message.includes('quota')) {
        throw new Error('API quota exceeded. Please try again later.');
      } else if (message.includes('safety')) {
        throw new Error('Response blocked due to safety filters.');
      } else {
        throw new Error(`AI processing failed: ${message}`);
      }
    } else {
      throw new Error('AI processing failed: Unknown error');
    }
  }
}
