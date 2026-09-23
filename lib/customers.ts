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

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSales: number;
  outstanding: number;
  lastOrderDate: string;
};

export async function getCustomersSummary(): Promise<CustomerSummary[]> {
  const { data, error } = await supabaseAdmin.from('customers').select(`
      id,
      name,
      phone,
      orders (
        total_amount,
        due_amount,
        status,
        order_date
      )
    `);

  if (error) {
    console.error('Failed to fetch customers:', error);
    throw error;
  }

  return (data ?? [])
    .map((c: any) => {
      const orders = c.orders ?? [];
      const activeOrders = orders.filter((o: any) => o.status !== 'CANCELLED');

      const totalSales = activeOrders.reduce(
        (sum: number, o: any) => sum + Number(o.total_amount ?? 0),
        0
      );
      const outstanding = activeOrders
        .filter((o: any) => o.status !== 'DELIVERED')
        .reduce((sum: number, o: any) => sum + Number(o.due_amount ?? 0), 0);
      const lastOrderDate = orders.reduce(
        (latest: string, o: any) => (o.order_date > latest ? o.order_date : latest),
        ''
      );

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        orderCount: orders.length,
        totalSales,
        outstanding,
        lastOrderDate,
      };
    })
    .sort((a, b) => b.lastOrderDate.localeCompare(a.lastOrderDate));
}
