import { NextResponse } from 'next/server';
import { addDriveTarget } from '@/lib/driveTargets';

export async function POST(request: Request) {
  const body = await request.json();

  if (!body.googleAccountId) {
    return NextResponse.json({ error: 'Missing google account.' }, { status: 400 });
  }

  try {
    await addDriveTarget(body.googleAccountId, body.label ?? '', body.folderUrl ?? '');
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to add Drive target:', error);
    return NextResponse.json({ error: 'Something went wrong while saving.' }, { status: 500 });
  }
}
