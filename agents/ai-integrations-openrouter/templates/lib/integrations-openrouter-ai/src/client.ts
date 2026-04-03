import OpenAI from "openai";

if (!process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL) {
  throw new Error(
    "AI_INTEGRATIONS_OPENROUTER_BASE_URL must be set. Did you forget to provision the OpenRouter AI integration?",
  );
}

if (!process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY) {
  throw new Error(
    "AI_INTEGRATIONS_OPENROUTER_API_KEY must be set. Did you forget to provision the OpenRouter AI integration?",
  );
}

export const openrouter = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
});
