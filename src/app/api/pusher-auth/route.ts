import { NextRequest, NextResponse } from 'next/server';
import api from '@/lib/axios';

export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const formData = await req.formData();
    const body = Object.fromEntries(formData);

    const response = await api.post('/api/pusher/pusher/auth', body, {
      withCredentials: true,
      headers: {
        Cookie: cookieHeader, // forward browser cookies to backend
      },
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Pusher auth proxy error:', error.response?.data || error.message);
    return NextResponse.json({ message: 'Pusher auth failed' }, { status: error.response?.status || 500 });
  }
}