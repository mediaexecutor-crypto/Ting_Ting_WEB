import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/orders';
import { NewOrderPayload } from '@/lib/types';
import { getCurrentUserContext } from '@/lib/auth';

export async function POST(request: Request) {
  const body = (await request.json()) as NewOrderPayload;
  const ctx = await getCurrentUserContext();

  if (!body.customerName?.trim() || !body.phone?.trim()) {
    return NextResponse.json(
      { error: 'Customer name and phone are required.' },
      { status: 400 }
    );
  }

  try {
    const orderId = await createOrder(body, ctx?.id ?? null);
    return NextResponse.json({ id: orderId }, { status: 201 });
  } catch (error: any) {
    // Postgres unique_violation on the invoice column
    if (error?.code === '23505') {
      return NextResponse.json(
        { error: `Invoice "${body.invoice}" already exists. Use a different invoice number.` },
        { status: 409 }
      );
    }

    console.error('Order creation failed:', error);
    return NextResponse.json(
      { error: `Something went wrong while creating the order: ${error?.message ?? 'unknown error'}` },
      { status: 500 }
    );
  }
}
