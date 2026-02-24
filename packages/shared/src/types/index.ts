export interface TenantWithRelations {
  id: string;
  name: string;
  phone_number: string;
  status: string;
  config: {
    template_type: string;
    business_name: string;
    language: string;
  } | null;
  whatsapp_session: {
    state: string;
    last_qr: string | null;
  } | null;
  worker_process: {
    pm2_name: string;
    status: string;
  } | null;
}

export interface CreateTenantInput {
  name: string;
  phone_number: string;
  template_type: 'BOOKING' | 'ECOMMERCE' | 'SUPPORT';
  business_name: string;
  language: 'SW' | 'EN';
}

export interface WorkerStartInput {
  tenant_id: string;
}

export interface MessageLogInput {
  tenant_id: string;
  direction: 'IN' | 'OUT';
  from_number: string;
  to_number: string;
  message_text: string;
  wa_message_id?: string;
}
