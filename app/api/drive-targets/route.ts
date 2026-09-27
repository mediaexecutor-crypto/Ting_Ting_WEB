import { NextResponse } from 'next/server';
import { addDriveTarget } from '@/lib/driveTargets';
import { getCurrentUserContext } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const ctx = await getCurrentUserContext();

  if (!ctx) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }
  if (!body.googleAccountId) {
    return NextResponse.json({ error: 'Missing google account.' }, { status: 400 });
  }

  try {
    await addDriveTarget(body.googleAccountId, body.label ?? '', body.folderUrl ?? '', ctx.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to add Drive target:', error);
    return NextResponse.json({ error: 'Something went wrong while saving.' }, { status: 500 });
  }
}
