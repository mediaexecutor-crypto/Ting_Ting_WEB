import { NextResponse } from 'next/server';
import { deleteOrderFile } from '@/lib/orderFiles';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { fileId } = await params;

  try {
    await deleteOrderFile(fileId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to delete file:', error);
    return NextResponse.json({ error: 'Failed to delete file.' }, { status: 500 });
  }
}
