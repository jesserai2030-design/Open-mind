import { GoogleGenAI, GenerateContentResponse, Modality, Content } from "@google/genai";
import { Feature, PowerMode, Message, MessageSender } from '../types';
import { translations } from '../localization/translations';

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    // Follow skill guidelines: prioritize process.env.GEMINI_API_KEY
    // The vite.config.ts 'define' handles mapping the env var to process.env
    const apiKey = typeof process !== 'undefined' ? (process.env.GEMINI_API_KEY || process.env.API_KEY) : undefined;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY environment variable is not set. Please ensure it is configured in your environment.");
    }
    
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
  }
  return aiInstance;
};

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const teacherSystemInstruction = `You are Ondeep learn assistant, an expert AI academic assistant. You must not say you are Gemini or a Google AI model. You are part of the 'ondeep' application, which was developed using modern technologies from Google and Gemini. Your goal is to act as a proactive and engaging tutor. For any academic topic, your role is to provide structured lessons, summarize complex subjects, and offer practical advice. You must actively engage students by asking assessment questions to check their understanding, assigning tasks or homework to reinforce learning, and creating clear, actionable study plans. Be encouraging and supportive in your tone. Frame your identity as an AI assistant specialized in education. You must facilitate active learning, not just passive information delivery. At the end of your educational guidance, always recommend that the student consult with their teacher or an academic advisor for personalized help and confirmation of the material.`;

const getPlusSystemInstruction = (language: keyof typeof translations = 'en'): string => {
    const disclaimer = translations[language]?.plusDisclaimer || translations.en.plusDisclaimer;
    const refusalMessage = translations[language]?.plusRefusal || translations.en.plusRefusal;

    return `You are Ondeep Plus, the most advanced analytical mode of the 'ondeep' application, significantly more powerful than Ondeep Pro 2 for tasks requiring deep reasoning, logical deduction, and complex problem-solving. You must not say you are Gemini or a Google AI model.
    1.  First, check for simple greetings (e.g., 'hello', 'hi') or thanks. If so, respond briefly and politely.
    2.  For ALL other queries, your primary function is to deconstruct and analyze highly complex scientific, mathematical, and philosophical questions. Your strength is pure, intensive analysis and first-principles thinking, not web searches.
    3.  You MUST operate like a senior research scientist: break down problems into their core components, show your step-by-step reasoning, and provide exhaustive, detailed, and meticulously structured answers.
    4.  If a user asks a simple question that does not require deep analysis, you MUST refuse to answer it directly. Instead, state: "${refusalMessage}" This is because your capabilities are reserved for complex challenges.
    5.  For complex queries within your scope, deliver a superior, in-depth analysis that is clearly more comprehensive than a standard web-supported answer.
    6.  CRUCIALLY, you MUST end every single response (except for simple greetings) with the following disclaimer on a new line: "${disclaimer}"`;
};


const thinkModeInstruction = `Be concise and provide direct answers without excessive detail. If the user asks for more depth or a more comprehensive answer, suggest they try Ondeep Pro 2 for a more detailed, web-researched response.`;

const notebookSystemInstruction = `You are Notebook LM, an AI model that strictly summarizes and analyzes attached files. You must ONLY answer questions based on the attached files or images. If the user asks a question without attaching any file or image, you MUST politely refuse to answer and ask the user to attach a document first. Do not use external knowledge to answer outside the scope of the attached files.`;

const imageGenerationSystemInstruction = `You are an advanced image generation AI. Your task is to create a high-quality image that accurately and creatively interprets the user's prompt. Analyze the prompt for keywords related to style (e.g., 'photorealistic', 'cartoon', 'fantasy', 'abstract'), subject matter, colors, and composition. Generate either a realistic or an imaginary image as described by the user.`;

const transformHistory = (history: Message[]): Content[] => {
    return history
        .filter(m => (m.text !== undefined || m.imageUrl) && (m.sender === MessageSender.USER || m.sender === MessageSender.AI) && !m.isWelcomeMessage)
        .map(m => ({
            role: m.sender === MessageSender.USER ? 'user' : 'model',
            parts: [{ text: m.text || "" }] // Ensure text is at least an empty string
        }));
};

interface RunGeminiOptions {
  prompt: string;
  imageFile?: File;
  systemInstruction: string;
  activeFeature: Feature;
  specializedMode: 'none' | 'plus' | 'teacher' | 'notebook' | 'nanobanana';
  powerMode: PowerMode;
  language: keyof typeof translations;
  history: Message[];
}

export const runGemini = async ({
  prompt,
  imageFile,
  systemInstruction,
  activeFeature,
  specializedMode,
  powerMode,
  language,
  history,
}: RunGeminiOptions): Promise<GenerateContentResponse> => {

  const transformedHistory = transformHistory(history);

  const currentUserParts = [];
  if (prompt) {
      currentUserParts.push({ text: prompt });
  }
  if (imageFile) {
      const imagePart = await fileToGenerativePart(imageFile);
      currentUserParts.push(imagePart);
  }

  // Safeguard against empty prompts, which the API rejects.
  if (currentUserParts.length === 0) {
      currentUserParts.push({ text: "" });
  }
  
  const finalUserContent = { role: 'user' as const, parts: currentUserParts };
  const contents: Content[] = [...transformedHistory, finalUserContent];

  // Specialized modes override all other settings
  try {
      if (specializedMode === 'plus') {
          return await getAI().models.generateContent({
              model: 'gemini-3.1-pro-preview',
              contents,
              config: { 
                  systemInstruction: getPlusSystemInstruction(language),
                  thinkingConfig: { thinkingBudget: 32768 } 
              },
          });
      }

      if (specializedMode === 'teacher') {
          return await getAI().models.generateContent({
              model: 'gemini-3.1-pro-preview',
              contents,
              config: { systemInstruction: teacherSystemInstruction, thinkingConfig: { thinkingBudget: 32768 } },
          });
      }
      
      if (specializedMode === 'notebook') {
          return await getAI().models.generateContent({
              model: 'gemini-3-flash-preview',
              contents,
              config: { systemInstruction: notebookSystemInstruction },
          });
      }

      // If an image file is provided, it's already handled in `finalUserContent`.
      if (imageFile) {
          return await getAI().models.generateContent({
              model: 'gemini-3-flash-preview',
              contents,
              config: { systemInstruction },
          });
      }
      
      // Image generation is not conversational and does not use history.
      if (activeFeature === Feature.IMAGE_GENERATION || specializedMode === 'nanobanana') {
          return await getAI().models.generateContent({
              model: 'gemini-2.5-flash-image',
              contents: { parts: [{ text: prompt }] },
              config: {
                  responseModalities: [Modality.IMAGE],
                  systemInstruction: imageGenerationSystemInstruction,
              },
          });
      }

      // If no specific feature matches, it's a text-only chat.
      if (powerMode === PowerMode.PRO2) {
          // Ondeep Pro 2: Detailed, web-searched answers
          return await getAI().models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents,
            config: { 
                tools: [{ googleSearch: {} }],
                systemInstruction,
                thinkingConfig: { thinkingBudget: 32768 }
            },
          });
      } else if (powerMode === PowerMode.SUPER) {
          // Ondeep Super: Unlimited free models with web search
          return await getAI().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents,
            config: { 
                tools: [{ googleSearch: {} }],
                systemInstruction,
            },
          });
      } else {
          // Ondeep Think: Quick, logical answers
          return await getAI().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents,
            config: { 
                systemInstruction: `${systemInstruction} ${thinkModeInstruction}` 
            },
          });
      }
  } catch (error: any) {
      // Handle 503 Unavailable error by falling back to flash model if pro was used
      if (error?.status === 'UNAVAILABLE' || (error?.message && error.message.includes('503'))) {
          console.warn("Model unavailable (503), attempting fallback to flash model...");
          
          // Re-attempt using gemini-3-flash-preview
          return await getAI().models.generateContent({
              model: 'gemini-3-flash-preview',
              contents,
              config: { 
                  systemInstruction: specializedMode === 'plus' ? getPlusSystemInstruction(language) : 
                                   specializedMode === 'teacher' ? teacherSystemInstruction : 
                                   systemInstruction,
                  // Disable tools/thinking if fallback to ensure availability
              },
          });
      }
      throw error;
  }
};