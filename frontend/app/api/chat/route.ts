import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      response:
        'This endpoint is disabled in BYOK mode. FinalCode calls your selected AI provider directly from the browser. Open AI Settings in the IDE to configure your key.',
      files: {},
    },
    { status: 200 }
  );
}
