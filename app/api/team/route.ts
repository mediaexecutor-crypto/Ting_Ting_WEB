import { NextResponse } from 'next/server';
import { updateProfile } from '@/lib/team';

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: 'Missing user id.' }, { status: 400 });
  }

  try {
    await updateProfile(body.id, { fullName: body.fullName, role: body.role });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Team update failed:', error);
    return NextResponse.json(
      { error: 'Something went wrong while saving.' },
      { status: 500 }
    );
  }
}
