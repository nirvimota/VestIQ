import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: process.env.PORT || 5000,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  
  // Market Data API Keys
  twelveDataApiKey: process.env.TWELVE_DATA_API_KEY,
  alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,
  iexCloudApiKey: process.env.IEX_CLOUD_API_KEY,
  
  // AI/LLM API Keys (for future features)
  groqApiKey: process.env.GROQ_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
};
