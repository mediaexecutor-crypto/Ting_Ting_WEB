import { NextResponse } from 'next/server';
import { setActiveDriveTarget } from '@/lib/driveTargets';
import { getCurrentUserContext } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCurrentUserContext();

  if (!ctx) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  try {
    await setActiveDriveTarget(id, ctx.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to set active Drive target:', error);
    return NextResponse.json({ error: 'Something went wrong while saving.' }, { status: 500 });
  }
}
