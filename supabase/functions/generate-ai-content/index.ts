import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateRequest {
  productName: string;
  type: 'short' | 'long';
  provider?: 'gemini' | 'claude';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { productName, type, provider: requestedProvider }: GenerateRequest = await req.json();

    if (!productName) {
      return new Response(
        JSON.stringify({ error: 'Product name is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/ai_settings?select=*&limit=1`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
    });

    if (!settingsResponse.ok) {
      throw new Error('Failed to fetch AI settings');
    }

    const settings = (await settingsResponse.json())[0];

    if (!settings || !settings.is_active) {
      return new Response(
        JSON.stringify({ error: 'AI content generation is not active' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const provider = requestedProvider || settings.default_provider;
    const promptTemplate = type === 'short'
      ? settings.short_description_prompt
      : settings.long_description_prompt;
    const maxWords = type === 'short'
      ? settings.short_description_max_words
      : settings.long_description_max_words;

    const prompt = promptTemplate
      .replace(/{product_name}/g, productName)
      .replace(/{max_words}/g, maxWords.toString());

    let content: string;

    if (provider === 'gemini' && settings.gemini_api_key) {
      content = await generateWithGemini(settings.gemini_api_key, prompt, settings.temperature);
    } else if (provider === 'claude' && settings.claude_api_key) {
      content = await generateWithClaude(settings.claude_api_key, prompt, settings.temperature);
    } else {
      return new Response(
        JSON.stringify({ error: `API key not configured for ${provider}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ content, provider }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error generating content:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateWithGemini(apiKey: string, prompt: string, temperature: number): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: temperature,
          maxOutputTokens: 2048,
        }
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function generateWithClaude(apiKey: string, prompt: string, temperature: number): Promise<string> {
  const response = await fetch(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2048,
        temperature: temperature,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}