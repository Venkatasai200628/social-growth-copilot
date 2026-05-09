import Groq from 'groq-sdk';

export const MODEL = 'llama-3.3-70b-versatile';

// Lazy client — instantiated on first call so a missing key returns a
// clean JSON error instead of crashing the route and returning an HTML page.
let _groq: Groq | null = null;

export function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      'GROQ_API_KEY is not set. Create a .env.local file with: GROQ_API_KEY=your_key_here'
    );
  }
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}
