import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file if it exists in the workspace root
const cwd = process.cwd();
const envPath = path.join(cwd, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const matched = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (matched) {
      const key = matched[1];
      let value = matched[2];
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const apiKey = process.env.GEMINI_API_KEY;

export async function callGemini(prompt, systemInstruction = '', isHeavy = false) {
  if (process.env.LOCAL_MODEL === 'true' && !isHeavy) {
    try {
      const url = process.env.LOCAL_MODEL_URL || 'http://localhost:11434/v1/chat/completions';
      const payload = {
        model: process.env.LOCAL_MODEL_NAME || 'gemma2',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ]
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error(`Unexpected local API response structure: ${JSON.stringify(data)}`);
      }
    } catch (localError) {
      console.error('\x1b[31mLocal model API request failed:\x1b[0m');
      console.error(`- Error: ${localError.message}`);
      process.exit(1);
    }
  }

  if (process.env.USE_OPENROUTER === 'true' || process.env.OPENROUTER_API_KEY) {
    try {
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (!openRouterKey) {
        throw new Error('OPENROUTER_API_KEY is not set in environment.');
      }
      const url = 'https://openrouter.ai/api/v1/chat/completions';
      const payload = {
        model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct:free',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey}`,
          'HTTP-Referer': process.env.SAGA_REPO_URL || 'https://github.com/saga-icm',
          'X-Title': 'SAGA-ICM'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      } else {
        throw new Error(`Unexpected OpenRouter response: ${JSON.stringify(data)}`);
      }
    } catch (orError) {
      console.error('\x1b[31mOpenRouter API request failed:\x1b[0m');
      console.error(`- Error: ${orError.message}`);
      process.exit(1);
    }
  }

  if (!apiKey) {
    console.error('\x1b[31mError: GEMINI_API_KEY environment variable is not set.\x1b[0m');
    console.error('Please configure it in a .env file in your project root directory or export it in your shell.');
    process.exit(1);
  }

  // Attempt to use new @google/genai SDK
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: systemInstruction ? { systemInstruction } : undefined,
    });
    return response.text.trim();
  } catch (sdkError) {
    // Fallback to pure HTTPS Fetch with API Key
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{ parts: [{ text: prompt }] }]
      };
      if (systemInstruction) {
        payload.systemInstruction = { parts: [{ text: systemInstruction }] };
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text.trim();
      } else {
        throw new Error(`Unexpected API response structure: ${JSON.stringify(data)}`);
      }
    } catch (fetchError) {
      console.error('\x1b[31mGemini API Request failed (both SDK and Fetch):\x1b[0m');
      console.error(`- SDK Error: ${sdkError.message}`);
      console.error(`- Fetch Fallback Error: ${fetchError.message}`);
      process.exit(1);
    }
  }
}
