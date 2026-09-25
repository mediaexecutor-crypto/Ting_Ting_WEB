import { NextResponse } from 'next/server';
import { deleteDriveTarget } from '@/lib/driveTargets';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await deleteDriveTarget(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete Drive target:', error);
    return NextResponse.json({ error: 'Something went wrong while removing.' }, { status: 500 });
  }
}
