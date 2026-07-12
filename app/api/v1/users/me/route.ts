import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  const headersList = await headers();
  const userLevelRaw = headersList.get('X-User-Level');

  if (!userLevelRaw || userLevelRaw.trim() === '') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: CORS_HEADERS },
    );
  }

  const userLevel = Number(userLevelRaw);

  return NextResponse.json(
    { user_level: userLevel },
    { status: 200, headers: CORS_HEADERS },
  );
}
