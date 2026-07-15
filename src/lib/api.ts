const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";

export type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  position: string;
  is_super_admin: boolean;
};

export type AdminAuthResponse = {
  access_token: string;
  token_type: string;
  user: AdminUser;
};

export type Dashboard = {
  total_units: number;
  total_residents: number;
  monthly_billed: string;
  collected: string;
  overdue: string;
  delinquent_units: number;
  active_reservations: number;
  monthly_collection_rate: number;
};

export type Resident = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  document_number: string;
  resident_type: string;
  is_owner: boolean;
  is_delinquent: boolean;
  unit: string;
  unit_id: string;
};

export type CreateResidentPayload = {
  full_name: string;
  email: string;
  phone: string;
  document_number: string;
  resident_type: string;
  is_owner: boolean;
  tower_name: string;
  unit_number: string;
  administration_fee: number;
  parking_slot?: string | null;
  initial_password: string;
};

export type PeaceClearance = {
  id: string;
  unit_id: string;
  certificate_number: string;
  issued_at: string;
  valid_until: string;
  is_valid: boolean;
};

export type Unit = {
  id: string;
  tower: string;
  number: string;
  administration_fee: string;
  parking_slot: string | null;
  balance: string;
};

export type Invoice = {
  id: string;
  unit_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  period: string;
  total: string;
  paid_amount: string;
  status: string;
};

export type CommonArea = {
  id: string;
  name: string;
  capacity: number;
  hourly_rate: string;
  requires_approval: boolean;
  rules: string;
  is_active: boolean;
};

export type Reservation = {
  id: string;
  resident_id: string;
  common_area_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  amount: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  category: string;
  published_at: string;
};

export type AccountingReport = {
  income: string;
  expenses: string;
  net_result: string;
  receivables: string;
  entries: Array<Record<string, string>>;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");

  const token = localStorage.getItem("auth-store")
    ? JSON.parse(localStorage.getItem("auth-store") as string).state?.token
    : null;

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    const detail = body?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((item) => item?.msg ?? JSON.stringify(item)).join("; ")
          : response.statusText;
    throw new Error(message || "Error de API");
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      request<AdminAuthResponse>("/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    adminRegister: (payload: {
      email: string;
      full_name: string;
      password: string;
      password_confirm: string;
      position: string;
    }) =>
      request<AdminAuthResponse>("/auth/admin/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    me: () => request<AdminUser>("/auth/admin/me"),
  },

  // Dashboard
  dashboard: () => request<Dashboard>("/admin/dashboard"),
  
  // Towers & Units
  towers: () => request<Array<{ id: string; name: string; units: Array<{ id: string; number: string; parking_slot: string | null; administration_fee: string }> }>>("/towers"),
  
  // Residents
  residents: () => request<Resident[]>("/admin/residents"),
  createResident: (payload: CreateResidentPayload) =>
    request<Resident>("/admin/residents", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Units
  units: () => request<Unit[]>("/admin/units"),
  
  // Invoices
  invoices: (params?: { onlyOpen?: boolean; unitId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.onlyOpen) qs.set("only_open", "true");
    if (params?.unitId) qs.set("unit_id", params.unitId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<Invoice[]>(`/admin/invoices${suffix}`);
  },
  generateInvoices: (period: string, issueDate: string, dueDate: string) =>
    request<Invoice[]>("/admin/invoices/generate", {
      method: "POST",
      body: JSON.stringify({ period, issue_date: issueDate, due_date: dueDate }),
    }),

  // Common Areas & Reservations
  commonAreas: () => request<CommonArea[]>("/common-areas"),
  reservations: () => request<Reservation[]>("/admin/reservations"),

  // Announcements
  announcements: () => request<Announcement[]>("/announcements"),
  createAnnouncement: (payload: { title: string; body: string; category: string }) =>
    request<Announcement>("/admin/announcements", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Accounting
  accountingReport: () => request<AccountingReport>("/admin/accounting-report"),
  
  // Other
  issuePeaceClearance: (unitId: string) =>
    request<PeaceClearance>("/admin/peace-clearances/" + unitId, {
      method: "POST",
    }),
};

export function money(value: string | number): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value));
}

