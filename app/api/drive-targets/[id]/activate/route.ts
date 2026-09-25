import { NextResponse } from 'next/server';
import { setActiveDriveTarget } from '@/lib/driveTargets';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await setActiveDriveTarget(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to set active Drive target:', error);
    return NextResponse.json({ error: 'Something went wrong while saving.' }, { status: 500 });
  }
}
