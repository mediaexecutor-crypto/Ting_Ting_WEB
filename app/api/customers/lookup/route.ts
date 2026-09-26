import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = (searchParams.get('phone') ?? '').trim();

  if (!phone) {
    return NextResponse.json({ customer: null });
  }

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id, name, address')
    .eq('phone', phone)
    .maybeSingle();

  if (error) {
    console.error('Customer lookup failed:', error);
    return NextResponse.json({ customer: null });
  }

  return NextResponse.json({ customer: data });
}
