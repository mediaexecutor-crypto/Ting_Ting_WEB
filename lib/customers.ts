import { supabaseAdmin } from './supabaseAdmin';

// Finds a customer by phone (our de-dupe key) or creates a new one.
// Returns the customer id.
export async function findOrCreateCustomer(
  name: string,
  phone: string,
  address: string
): Promise<string> {
  const trimmedPhone = phone.trim();

  // Nothing is required on the order form, so phone can be blank. Don't
  // dedupe on an empty string (that would merge every no-phone customer
  // into one row) — just create a fresh customer each time.
  if (trimmedPhone !== '') {
    const { data: existing, error: findError } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('phone', trimmedPhone)
      .maybeSingle();

    if (findError) {
      console.error('Failed to look up customer:', findError);
      throw findError;
    }

    if (existing) {
      return existing.id as string;
    }
  }

  const { data: created, error: insertError } = await supabaseAdmin
    .from('customers')
    .insert({ name: name.trim() || 'Unnamed Customer', phone: trimmedPhone, address })
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
  address: string;
  orderCount: number;
  totalSales: number;
  totalPcs: number;
  lastOrderDate: string;
};

export async function getCustomersSummary(salespersonId?: string): Promise<CustomerSummary[]> {
  const { data, error } = await supabaseAdmin.from('customers').select(`
      id,
      name,
      phone,
      address,
      orders (
        total_amount,
        status,
        order_date,
        salesperson_id,
        order_items ( quantity )
      )
    `);

  if (error) {
    console.error('Failed to fetch customers:', error);
    throw error;
  }

  return (data ?? [])
    .map((c: any) => {
      // A SALESPERSON only sees their own orders' contribution to a
      // customer's numbers — and if they have no orders with this
      // customer, the customer shouldn't show up for them at all.
      const scopedOrders = salespersonId
        ? (c.orders ?? []).filter((o: any) => o.salesperson_id === salespersonId)
        : c.orders ?? [];
      const orders = scopedOrders;
      const activeOrders = orders.filter((o: any) => o.status !== 'CANCELLED');

      const totalSales = activeOrders.reduce(
        (sum: number, o: any) => sum + Number(o.total_amount ?? 0),
        0
      );
      const totalPcs = activeOrders.reduce((sum: number, o: any) => {
        const items = o.order_items ?? [];
        return sum + items.reduce((s: number, it: any) => s + Number(it.quantity ?? 0), 0);
      }, 0);
      const lastOrderDate = orders.reduce(
        (latest: string, o: any) => (o.order_date > latest ? o.order_date : latest),
        ''
      );

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address ?? '',
        orderCount: orders.length,
        totalSales,
        totalPcs,
        lastOrderDate,
      };
    })
    .filter((c) => !salespersonId || c.orderCount > 0)
    .sort((a, b) => b.lastOrderDate.localeCompare(a.lastOrderDate));
}
