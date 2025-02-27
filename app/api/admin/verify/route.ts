import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctPassword) {
      console.error('ADMIN_PASSWORD environment variable is not set');
      return new NextResponse(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
      });
    }

    if (password === correctPassword) {
      return new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
      });
    }

    return new NextResponse(JSON.stringify({ error: 'Invalid password' }), {
      status: 401,
    });
  } catch (error) {
    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
} 