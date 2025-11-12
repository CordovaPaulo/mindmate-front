import { NextRequest, NextResponse } from 'next/server';
import api from '@/lib/axios';

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const contentType = req.headers.get('content-type') || '';

    // Build urlencoded body for Pusher server auth
    let bodyToSend: string | URLSearchParams;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Forward raw body unchanged if already urlencoded
      bodyToSend = await req.text();
    } else if (contentType.includes('multipart/form-data')) {
      // Convert FormData to urlencoded
      const form = await req.formData();
      bodyToSend = new URLSearchParams(Object.fromEntries(form as any));
    } else {
      // Fallback: parse JSON and convert to urlencoded
      const json = await req.json().catch(() => ({}));
      bodyToSend = new URLSearchParams(json as Record<string, string>);
    }

    const upstream = await api.post('/api/pusher/pusher/auth', bodyToSend, {
      withCredentials: true,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        Cookie: cookieHeader,
        Authorization: req.headers.get('authorization') || '',
      },
      // prevent axios from JSON stringifying
      transformRequest: (data) => data,
    });

    // Pusher accepts JSON; return as received
    return new NextResponse(
      typeof upstream.data === 'string' ? upstream.data : JSON.stringify(upstream.data),
      {
        status: upstream.status,
        headers: {
          'content-type': upstream.headers['content-type'] || 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Pusher auth proxy error:', error?.response?.data || error?.message);
    return NextResponse.json(
      error?.response?.data || { message: 'Pusher auth failed' },
      { status: error?.response?.status || 500 }
    );
  }
}