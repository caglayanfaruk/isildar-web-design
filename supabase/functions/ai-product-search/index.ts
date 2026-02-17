import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { query, conversation_history = [] } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseKey);

    const lowerQuery = query.toLowerCase();
    const searchTerms = extractSearchTerms(lowerQuery);

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        sku,
        slug,
        product_translations!inner(name, short_description, language_code),
        product_media(media(url)),
        product_filter_values(
          filter_option_id,
          product_filter_options(
            name,
            filter_group_id,
            product_filter_groups(name, filter_type)
          )
        )
      `)
      .eq('status', 'active')
      .eq('product_translations.language_code', 'tr')
      .limit(50);

    if (productsError) {
      console.error('Products fetch error:', productsError);
      throw productsError;
    }

    const scoredProducts = products
      .map(product => {
        const translation = product.product_translations[0];
        let score = 0;

        const productText = `${translation.name} ${translation.short_description}`.toLowerCase();

        searchTerms.forEach(term => {
          if (productText.includes(term)) {
            score += 3;
          }
          if (translation.name.toLowerCase().includes(term)) {
            score += 5;
          }
        });

        if (product.product_filter_values) {
          product.product_filter_values.forEach((fv: any) => {
            const optionName = fv.product_filter_options?.name?.toLowerCase() || '';
            searchTerms.forEach(term => {
              if (optionName.includes(term)) {
                score += 2;
              }
            });
          });
        }

        return {
          ...product,
          score,
          name: translation.name,
          description: translation.short_description,
          image: product.product_media?.[0]?.media?.url
        };
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    let responseText = '';

    if (openaiKey && scoredProducts.length > 0) {
      try {
        const aiResponse = await generateAIResponse(
          query,
          scoredProducts,
          conversation_history,
          openaiKey
        );
        responseText = aiResponse;
      } catch (aiError) {
        console.error('AI generation error:', aiError);
        responseText = generateFallbackResponse(query, scoredProducts);
      }
    } else {
      responseText = generateFallbackResponse(query, scoredProducts);
    }

    return new Response(
      JSON.stringify({
        response: responseText,
        products: scoredProducts.map(p => ({
          id: p.id,
          sku: p.sku,
          slug: p.slug,
          name: p.name,
          description: p.description,
          image: p.image
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function extractSearchTerms(query: string): string[] {
  const stopWords = ['için', 'bir', 've', 'ile', 'bu', 'şu', 'o', 'ne', 'nasıl', 'nerede', 'arıyorum', 'istiyorum', 'lazım', 'lütfen'];

  const terms = query
    .toLowerCase()
    .replace(/[.,!?;:]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopWords.includes(term));

  return [...new Set(terms)];
}

async function generateAIResponse(
  query: string,
  products: any[],
  conversationHistory: Message[],
  openaiKey: string
): Promise<string> {
  const productDescriptions = products
    .slice(0, 5)
    .map(p => `- ${p.name} (SKU: ${p.sku}): ${p.description || 'Kaliteli aydınlatma ürünü'}`)
    .join('\n');

  const messages: any[] = [
    {
      role: 'system',
      content: `Sen IŞILDAR'ın AI ürün danışmanısın. Görevin müşterilere en uygun aydınlatma ürünlerini bulmalarına yardımcı olmak.

Kurallar:
- Samimi ve yardımsever ol
- Türkçe konuş
- Kısa ve öz cevaplar ver (maksimum 3-4 cümle)
- Ürün önerilerini listelerken sadece isimlerini belirt
- Müşteriye sorular sorarak ihtiyaçlarını anlamaya çalış
- Ürün bulunamadığında alternatif öner veya daha fazla bilgi iste`
    }
  ];

  conversationHistory.slice(-5).forEach(msg => {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  });

  messages.push({
    role: 'user',
    content: `Müşteri sorusu: "${query}"\n\nBulunan ürünler:\n${productDescriptions}\n\nBu ürünleri müşteriye öner ve ek bilgi iste.`
  });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 200,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error('OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function generateFallbackResponse(query: string, products: any[]): string {
  if (products.length === 0) {
    return `"${query}" aramanız için tam olarak eşleşen bir ürün bulamadım. Size daha iyi yardımcı olabilmem için lütfen aradığınız ürünün kullanım alanı, özellikler veya kategori gibi detayları paylaşır mısınız?`;
  }

  if (products.length === 1) {
    return `Aramanıza uygun harika bir ürün buldum! Aşağıda detaylarını görebilirsiniz. Bu ürün hakkında daha fazla bilgi almak ister misiniz?`;
  }

  return `Aramanıza uygun ${products.length} ürün buldum. Aşağıda en uygun seçenekleri görebilirsiniz. Hangi ürün hakkında daha fazla bilgi almak istersiniz?`;
}
