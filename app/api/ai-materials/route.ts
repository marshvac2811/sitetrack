import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const boqText = String(body?.boqText ?? '').trim();

    if (!boqText) {
      return Response.json({ error: 'BOQ description is required' }, { status: 400 });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: 'gpt-5-mini',
      input: `You are a construction material quantity assistant.

Analyze this BOQ item:
${boqText}

Return JSON only with:
{
  "work_description": "string",
  "assumptions": ["string"],
  "materials": [
    {
      "material_name": "string",
      "unit": "string",
      "quantity": 0,
      "basis": "string"
    }
  ]
}

Calculate material quantities only. Do not calculate rates or prices.`,
    });

    return Response.json({
      success: true,
      result: JSON.parse(response.output_text),
    });

  } catch (error: any) {
    console.error('AI ERROR:', error);

    return Response.json(
      {
        success: false,
        error: error?.message || String(error),
        type: error?.constructor?.name,
      },
      { status: 500 }
    );
  }
}
