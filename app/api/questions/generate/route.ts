import { NextRequest, NextResponse } from 'next/server';
import { generateAdaptiveQuestion, QuestionRequest } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as QuestionRequest;

    if (!body || !body.partnerA || !body.partnerB) {
      return NextResponse.json(
        {
          question: "What is your favorite memory of us together?",
          options: ["Our very first call", "Airport reunion", "Late-night game night", "Laughing at inside jokes"],
          commentary: "Connecting couple memories!",
          source: 'fallback',
        },
        { status: 200 }
      );
    }

    const result = await generateAdaptiveQuestion(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        question: "When we meet next, what is our top priority?",
        options: ["The biggest hug at arrival", "Eating our favorite food together", "Taking a 4-cut photostrip", "Exploring the city walking holding hands"],
        commentary: "Reunion excitement locked in.",
        source: 'fallback',
      },
      { status: 200 }
    );
  }
}
