import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TranslateRequest {
  text: string | string[];
  targetLanguage: string;
  sourceLanguage?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text, targetLanguage, sourceLanguage = 'auto' }: TranslateRequest = await req.json();

    if (!text || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text and targetLanguage' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const GOOGLE_TRANSLATE_API_KEY = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');

    if (!GOOGLE_TRANSLATE_API_KEY) {
      console.error('Google Translate API key not configured');
      return new Response(
        JSON.stringify({ error: 'Translation service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const textsToTranslate = Array.isArray(text) ? text : [text];

    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: textsToTranslate,
        target: targetLanguage,
        source: sourceLanguage === 'auto' ? undefined : sourceLanguage,
        format: 'text',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Translate API error:', response.status, errorText);
      return new Response(
        JSON.stringify({
          error: 'Translation failed',
          details: errorText,
          status: response.status
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();

    const translations = data.data.translations.map((t: any) => ({
      translatedText: t.translatedText,
      detectedSourceLanguage: t.detectedSourceLanguage,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        translations: Array.isArray(text) ? translations : translations[0],
        targetLanguage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Translation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});