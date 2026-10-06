import { supabaseAdmin } from './supabaseAdmin';

// Same Odoo instance and login flow as the original system — talks to
// Odoo directly (JSON-RPC), no dependency on the old backend.
const ODOO_HOST = process.env.ODOO_HOST || 'cods-clothing-co.odoo.com';
const ODOO_DB = process.env.ODOO_DB || 'cods-clothing-co';

async function rpc(path: string, params: unknown, cookie = '') {
  const res = await fetch(`https://${ODOO_HOST}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', id: 1, params }),
  });

  const setCookies: string[] = (res.headers as any).getSetCookie?.() ?? [];
  const sessionCookie = setCookies.map((c) => c.split(';')[0]).join('; ');

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error('Bad response from Odoo.');
  }
  return { json, cookie: sessionCookie };
}

// Logs in, then creates a res.partner contact (customer_rank 1 = customer).
async function createOdooContact(input: { name: string; phone: string; address: string }) {
  const login = process.env.ODOO_USERNAME;
  const password = process.env.ODOO_PASSWORD;
  if (!login || !password) {
    throw new Error(
      'Odoo isn\'t set up yet: add ODOO_USERNAME and ODOO_PASSWORD in Vercel and redeploy.'
    );
  }

  const auth = await rpc('/web/session/authenticate', { db: ODOO_DB, login, password });
  if (!auth.json?.result?.uid) {
    throw new Error('Odoo login failed — check ODOO_USERNAME / ODOO_PASSWORD.');
  }

  const create = await rpc(
    '/web/dataset/call_kw',
    {
      model: 'res.partner',
      method: 'create',
      args: [
        {
          name: input.name,
          phone: input.phone || '',
          email: '',
          street: input.address || '',
          customer_rank: 1,
        },
      ],
      kwargs: { context: {} },
    },
    auth.cookie
  );

  const contactId = create.json?.result;
  if (!contactId) {
    const detail = create.json?.error?.data?.message ?? create.json?.error?.message ?? '';
    throw new Error(`Odoo contact could not be created. ${detail}`.trim());
  }

  return { contactId: contactId as number, url: `https://${ODOO_HOST}/odoo/contacts/${contactId}` };
}

export async function getOdooContactUrl(customerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('odoo_contacts')
    .select('odoo_url')
    .eq('customer_id', customerId)
    .maybeSingle();
  return data?.odoo_url ?? null;
}

// One Odoo contact per customer: if this customer already has one (from
// any of their orders) that link is reused instead of creating a duplicate.
export async function ensureOdooContact(customerId: string): Promise<{ url: string }> {
  const existing = await getOdooContactUrl(customerId);
  if (existing) return { url: existing };

  const { data: customer } = await supabaseAdmin
    .from('customers')
    .select('name, phone, address')
    .eq('id', customerId)
    .maybeSingle();

  if (!customer) throw new Error('Customer not found.');

  const name = (customer.name ?? '').trim();
  if (!name || name === 'Unnamed Customer') {
    throw new Error("Add the customer's name to this order first, then create the Odoo contact.");
  }

  const { contactId, url } = await createOdooContact({
    name,
    phone: customer.phone ?? '',
    address: customer.address ?? '',
  });

  const { error } = await supabaseAdmin
    .from('odoo_contacts')
    .insert({ customer_id: customerId, odoo_contact_id: String(contactId), odoo_url: url });

  if (error) {
    if (error.code === '23505') {
      const again = await getOdooContactUrl(customerId);
      if (again) return { url: again };
    }
    console.error('Failed to save Odoo contact link:', error);
    throw error;
  }

  return { url };
}

// For a contact already created in Odoo (e.g. by the old system) —
// just save the link here instead of creating a duplicate contact.
export async function saveExistingOdooLink(customerId: string, url: string) {
  const { error } = await supabaseAdmin
    .from('odoo_contacts')
    .upsert({ customer_id: customerId, odoo_url: url }, { onConflict: 'customer_id' });
  if (error) {
    console.error('Failed to save Odoo link:', error);
    throw error;
  }
}
