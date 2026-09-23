import { supabaseAdmin } from './supabaseAdmin';

// Finds a customer by phone (our de-dupe key) or creates a new one.
// Returns the customer id.
export async function findOrCreateCustomer(
  name: string,
  phone: string,
  address: string
): Promise<string> {
  const { data: existing, error: findError } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (findError) {
    console.error('Failed to look up customer:', findError);
    throw findError;
  }

  if (existing) {
    return existing.id as string;
  }

  const { data: created, error: insertError } = await supabaseAdmin
    .from('customers')
    .insert({ name, phone, address })
    .select('id')
    .single();

  if (insertError) {
    console.error('Failed to create customer:', insertError);
    throw insertError;
  }

  return created.id as string;
}
