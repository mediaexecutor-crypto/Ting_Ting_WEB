import { NextResponse } from 'next/server';
import { deleteCustomer } from '@/lib/customers';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    await deleteCustomer(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to delete customer.' },
      { status: 400 }
    );
  }
}
