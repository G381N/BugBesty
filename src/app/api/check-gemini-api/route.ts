import { NextResponse } from 'next/server';

/**
 * API endpoint to check if the Gemini API key is configured
 * This allows us to check server-side environment variables from the client
 * without exposing the actual key
 */
export async function GET() {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  return NextResponse.json({
    available: !!geminiApiKey
  });
} 