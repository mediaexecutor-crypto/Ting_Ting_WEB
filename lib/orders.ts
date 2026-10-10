import { supabaseAdmin } from './supabaseAdmin';
import { findOrCreateCustomer } from './customers';
import { getOrCreateOrderFolder } from './orderFolders';
import { NewOrderPayload, Order, OrderStatus } from './types';

export async function getOrders(salespersonId?: string): Promise<Order[]> {
  let query = supabaseAdmin
    .from('orders')
    .select(`
      id,
      invoice,
      created_at,
      delivery_date,
      order_date,
      source,
      total_amount,
      delivery_charge,
      advance,
      due_amount,
      status,
      priority,
      courier,
      order_type,
      salesperson_id,
      confirmed_date,
      order_items ( quantity ),
      customers (
        name,
        phone,
        address
      )
    `)
    .order('created_at', { ascending: false });

  if (salespersonId) {
    query = query.eq('salesperson_id', salespersonId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }

  return (data ?? []).map((order: any) => ({
    id: order.id,
    invoice: order.invoice ?? '',
    customer: order.customers?.name ?? '',
    phone: order.customers?.phone ?? '',
    address: order.customers?.address ?? '',
    delivery: order.delivery_date,
    orderDate: order.order_date,
    createdAt: order.created_at,
    source: order.source ?? '',
    amount: Number(order.total_amount ?? 0),
    deliveryCharge: Number(order.delivery_charge ?? 0),
    advance: Number(order.advance ?? 0),
    due: Number(order.due_amount ?? 0),
    status: order.status as OrderStatus,
    priority: order.priority ?? 'Normal',
    deliveryChargeSet: order.delivery_charge !== null,
    courier: order.courier ?? '',
    orderType: order.order_type ?? '',
    salespersonId: order.salesperson_id ?? null,
    confirmedDate: order.confirmed_date ?? '',
    totalQty: (order.order_items ?? []).reduce(
      (s: number, it: any) => s + Number(it.quantity ?? 0),
      0
    ),
  }));
}

// Orders still awaiting delivery (excludes DELIVERED / CANCELLED),
// soonest delivery date first.
export async function getPendingDeliveries(salespersonId?: string): Promise<Order[]> {
  const orders = await getOrders(salespersonId);
  return orders
    .filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
    .sort((a, b) => (a.delivery || '9999').localeCompare(b.delivery || '9999'));
}

// The Deliveries page specifically: only orders that have actually
// reached the delivery stage (READY/DELIVERY/DELIVERED) — a product
// still being designed or produced shouldn't show up here.
export async function getDeliveryQueue(salespersonId?: string): Promise<Order[]> {
  const orders = await getOrders(salespersonId);
  const relevant: OrderStatus[] = ['READY', 'DELIVERY', 'DELIVERED'];
  return orders
    .filter((o) => relevant.includes(o.status))
    .sort((a, b) => (a.delivery || '9999').localeCompare(b.delivery || '9999'));
}

export type OrderDetail = Order & {
  customerId: string;
  items: { id: string; product: string; qty: number; price: number }[];
  notes: string;
  confirmedDate: string;
  productNotes: string;
  alternativeNumber: string;
  orderType: string;
};

// Returns the order's salesperson_id only (cheap check used to enforce
// per-salesperson visibility before rendering/editing an order).
export async function getOrderOwner(id: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('salesperson_id')
    .eq('id', id)
    .maybeSingle();
  return data?.salesperson_id ?? null;
}

export async function getOrderDetail(id: string): Promise<OrderDetail | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      invoice,
      delivery_date,
      order_date,
      created_at,
      confirmed_date,
      source,
      total_amount,
      delivery_charge,
      advance,
      due_amount,
      status,
      priority,
      courier,
      notes,
      product_notes,
      alternative_number,
      order_type,
      customer_id,
      salesperson_id,
      customers ( name, phone, address ),
      order_items ( id, product_name, quantity, unit_price )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch order detail:', error);
    throw error;
  }

  if (!data) return null;

  const order: any = data;

  return {
    id: order.id,
    customerId: order.customer_id,
    invoice: order.invoice ?? '',
    customer: order.customers?.name ?? '',
    phone: order.customers?.phone ?? '',
    address: order.customers?.address ?? '',
    delivery: order.delivery_date,
    orderDate: order.order_date,
    createdAt: order.created_at,
    confirmedDate: order.confirmed_date ?? '',
    source: order.source ?? '',
    amount: Number(order.total_amount ?? 0),
    deliveryCharge: Number(order.delivery_charge ?? 0),
    advance: Number(order.advance ?? 0),
    due: Number(order.due_amount ?? 0),
    status: order.status as OrderStatus,
    priority: order.priority ?? 'Normal',
    deliveryChargeSet: order.delivery_charge !== null,
    courier: order.courier ?? '',
    salespersonId: order.salesperson_id ?? null,
    notes: order.notes ?? '',
    productNotes: order.product_notes ?? '',
    alternativeNumber: order.alternative_number ?? '',
    orderType: order.order_type ?? '',
    totalQty: (order.order_items ?? []).reduce(
      (s: number, it: any) => s + Number(it.quantity ?? 0),
      0
    ),
    items: (order.order_items ?? []).map((it: any) => ({
      id: it.id,
      product: it.product_name,
      qty: it.quantity,
      price: Number(it.unit_price ?? 0),
    })),
  };
}

export type UpdateOrderPayload = {
  customerName: string;
  phone: string;
  alternativeNumber: string;
  address: string;
  invoice: string;
  deliveryDate: string;
  confirmedDate: string;
  orderType: string;
  source: string;
  priority: string;
  status: OrderStatus;
  items: { product: string; qty: number; price: number }[];
  deliveryCharge: number | null;
  courier: string;
  advance: number;
  productNotes: string;
  notes: string;
};

// Next invoice number in sequence: highest all-digit invoice (max 6 digits)
// + 1. Falls back to the smallest unused number if the sequence would pass
// 999999 (the 6-character limit). No DB sequence/migration needed — a rare
// clash from two simultaneous creates is retried by the caller.
async function generateNextInvoice(): Promise<string> {
  const used = new Set<number>();
  const pageSize = 1000;
  for (let from = 0; from < 200000; from += pageSize) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('invoice')
      .not('invoice', 'is', null)
      .order('id')
      .range(from, from + pageSize - 1);
    if (error) throw error;
    for (const row of data ?? []) {
      if (/^\d{1,6}$/.test(row.invoice)) used.add(Number(row.invoice));
    }
    if (!data || data.length < pageSize) break;
  }
  const max = used.size ? Math.max(...used) : 0;
  if (max < 999999) return String(max + 1);
  let n = 1;
  while (used.has(n)) n++;
  return String(n);
}

export async function updateOrder(orderId: string, customerId: string, payload: UpdateOrderPayload) {
  const { error: customerError } = await supabaseAdmin
    .from('customers')
    .update({
      name: payload.customerName.trim() || 'Unnamed Customer',
      phone: payload.phone.trim(),
      address: payload.address,
    })
    .eq('id', customerId);

  if (customerError) {
    console.error('Failed to update customer:', customerError);
    throw customerError;
  }

  const itemsTotal = payload.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const deliveryCharge = payload.deliveryCharge; // keep null distinct from 0
  const advance = payload.advance || 0;
  const dueAmount = itemsTotal + (deliveryCharge ?? 0) - advance;
  // Blank invoice never blanks out an existing number; an order that has
  // none yet (older orders) gets the next serial number.
  const typedInvoice = payload.invoice.trim().slice(0, 6);
  let invoiceUpdate: { invoice?: string } = {};
  if (typedInvoice) {
    invoiceUpdate = { invoice: typedInvoice };
  } else {
    const { data: current } = await supabaseAdmin
      .from('orders')
      .select('invoice')
      .eq('id', orderId)
      .maybeSingle();
    if (!current?.invoice) invoiceUpdate = { invoice: await generateNextInvoice() };
  }

  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .update({
      ...invoiceUpdate,
      delivery_date: payload.deliveryDate || null,
      confirmed_date: payload.confirmedDate || null,
      alternative_number: payload.alternativeNumber?.trim() || null,
      order_type: payload.orderType || null,
      source: payload.source,
      priority: payload.priority,
      status: payload.status,
      total_amount: itemsTotal,
      delivery_charge: deliveryCharge,
      advance,
      due_amount: dueAmount,
      product_notes: payload.productNotes,
      notes: payload.notes,
      courier: payload.courier,
    })
    .eq('id', orderId);

  if (orderError) {
    console.error('Failed to update order:', orderError);
    throw orderError;
  }

  // Simplest correct way to handle add/remove/edit of line items together:
  // replace the whole set rather than diffing.
  const { error: deleteItemsError } = await supabaseAdmin
    .from('order_items')
    .delete()
    .eq('order_id', orderId);

  if (deleteItemsError) {
    console.error('Failed to clear old order items:', deleteItemsError);
    throw deleteItemsError;
  }

  const items = payload.items
    .filter((item) => item.product.trim() !== '')
    .map((item) => ({
      order_id: orderId,
      product_name: item.product,
      quantity: item.qty,
      unit_price: item.price,
    }));

  if (items.length > 0) {
    const { error: insertItemsError } = await supabaseAdmin.from('order_items').insert(items);
    if (insertItemsError) {
      console.error('Failed to save order items:', insertItemsError);
      throw insertItemsError;
    }
  }
}

// Lightweight status-only update — used for quick status changes from
// the Orders list or order page without opening the full edit form (and
// without risk of clobbering other fields, unlike updateOrder()).
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { error } = await supabaseAdmin.from('orders').update({ status }).eq('id', orderId);
  if (error) {
    console.error('Failed to update order status:', error);
    throw error;
  }
}

// Cascades (order_items, order_files, google_drive_folders, etc.) are
// all "on delete cascade" in the schema, so this is the only query needed.
export async function deleteOrder(orderId: string) {
  const { error } = await supabaseAdmin.from('orders').delete().eq('id', orderId);
  if (error) {
    console.error('Failed to delete order:', error);
    throw error;
  }
}

export async function createOrder(payload: NewOrderPayload, salespersonId: string | null) {
  const customerId = await findOrCreateCustomer(
    payload.customerName,
    payload.phone,
    payload.address
  );

  const itemsTotal = payload.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const deliveryCharge = payload.deliveryCharge; // keep null distinct from 0
  const advance = payload.advance || 0;
  const dueAmount = itemsTotal + (deliveryCharge ?? 0) - advance;

  // Invoice is optional (max 6 characters). Left blank, the next serial
  // number is assigned automatically; it can be edited later.
  const typedInvoice = payload.invoice.trim().slice(0, 6);

  let inserted: { id: string } | null = null;
  for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
    const invoice = typedInvoice || (await generateNextInvoice());
    const { data, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        invoice,
        customer_id: customerId,
        delivery_date: payload.deliveryDate || null,
        confirmed_date: payload.confirmedDate || null,
        alternative_number: payload.alternativeNumber?.trim() || null,
        order_type: payload.orderType || null,
        source: payload.source,
        priority: payload.priority,
        status: 'NEW',
        total_amount: itemsTotal,
        delivery_charge: deliveryCharge,
        advance,
        due_amount: dueAmount,
        product_notes: payload.productNotes,
        notes: payload.notes,
        courier: payload.courier,
        salesperson_id: salespersonId,
      })
      .select('id')
      .single();

    if (!orderError) {
      inserted = data;
      break;
    }
    // Another order just took the same auto number — try the next one.
    if (!typedInvoice && orderError.code === '23505') continue;
    console.error('Failed to create order:', orderError);
    throw orderError;
  }
  if (!inserted) throw new Error('Could not assign an invoice number. Please try again.');
  const order = inserted;

  const items = payload.items
    .filter((item) => item.product.trim() !== '')
    .map((item) => ({
      order_id: order.id,
      product_name: item.product,
      quantity: item.qty,
      unit_price: item.price,
    }));

  if (items.length > 0) {
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(items);

    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
      throw itemsError;
    }
  }

  // Best-effort: create the order's Drive folder if a Google account is
  // connected. Never let a Drive hiccup fail the order itself — the
  // folder can also be created lazily on first file upload.
  try {
    const folderName = [payload.customerName.trim(), payload.phone.trim()]
      .filter(Boolean)
      .join(' - ') || `Order ${order.id.slice(0, 8)}`;
    await getOrCreateOrderFolder(order.id, folderName, salespersonId);
  } catch (err) {
    console.error('Order created, but Drive folder creation failed:', err);
  }

  return order.id as string;
}

export async function updateOrderCourier(orderId: string, courier: string) {
  const { error } = await supabaseAdmin.from('orders').update({ courier }).eq('id', orderId);
  if (error) {
    console.error('Failed to update courier:', error);
    throw error;
  }
}

// Share link: a random token anyone with the link can use to view one
// order, read-only, no login needed — for sending to a merchandiser.
export async function getOrCreateShareToken(orderId: string): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('share_token')
    .eq('id', orderId)
    .maybeSingle();

  if (existing?.share_token) return existing.share_token;

  const token = crypto.randomUUID().replace(/-/g, '');
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ share_token: token })
    .eq('id', orderId);
  if (error) {
    console.error('Failed to create share token:', error);
    throw error;
  }
  return token;
}

export async function getOrderIdByShareToken(token: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('share_token', token)
    .maybeSingle();
  return data?.id ?? null;
}
