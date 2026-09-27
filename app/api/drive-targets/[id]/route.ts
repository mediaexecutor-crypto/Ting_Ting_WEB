import { NextResponse } from 'next/server';
import { deleteDriveTarget } from '@/lib/driveTargets';
import { getCurrentUserContext } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCurrentUserContext();

  if (!ctx) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  try {
    await deleteDriveTarget(id, ctx.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete Drive target:', error);
    return NextResponse.json({ error: 'Something went wrong while removing.' }, { status: 500 });
  }
}
