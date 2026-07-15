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
  category: string;
  description: string;
  capacity: number;
  hourly_rate: string;
  has_cost: boolean;
  requires_approval: boolean;
  rules: string;
  is_active: boolean;
  is_bookable: boolean;
  min_duration_minutes: number;
  max_duration_minutes: number;
  min_advance_minutes: number;
  max_advance_days: number;
  cleanup_buffer_minutes: number;
  max_active_per_resident: number;
  required_documents: string[];
};

export type CommonAreaPayload = {
  name: string;
  category: string;
  description: string;
  capacity: number;
  hourly_rate: number;
  has_cost: boolean;
  requires_approval: boolean;
  rules: string;
  is_active: boolean;
  is_bookable: boolean;
  min_duration_minutes: number;
  max_duration_minutes: number;
  min_advance_minutes: number;
  max_advance_days: number;
  cleanup_buffer_minutes: number;
  max_active_per_resident: number;
  required_documents: string[];
};

export type ScheduleItem = {
  weekday: number;
  open_time?: string | null;
  close_time?: string | null;
  is_closed: boolean;
};

export type ScheduleOut = ScheduleItem & { id: string };

export type BlackoutOut = {
  id: string;
  common_area_id: string;
  reason_type: string;
  starts_at: string;
  ends_at: string;
  note: string;
};

export type ImageOut = { id: string; url: string; sort_order: number };

export type CommonAreaDetail = CommonArea & {
  schedules: ScheduleOut[];
  blackouts: BlackoutOut[];
  images: ImageOut[];
};

export type Reservation = {
  id: string;
  resident_id: string;
  common_area_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  amount: string;
  reject_reason?: string | null;
};

export type ReservationAdmin = Reservation & {
  resident_name: string;
  common_area_name: string;
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
  commonAreas: () => request<CommonArea[]>("/admin/common-areas"),
  commonAreaDetail: (id: string) => request<CommonAreaDetail>(`/admin/common-areas/${id}`),
  createCommonArea: (payload: CommonAreaPayload) =>
    request<CommonArea>("/admin/common-areas", { method: "POST", body: JSON.stringify(payload) }),
  updateCommonArea: (id: string, payload: Partial<CommonAreaPayload>) =>
    request<CommonArea>(`/admin/common-areas/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deactivateCommonArea: (id: string) =>
    request<CommonArea>(`/admin/common-areas/${id}`, { method: "DELETE" }),
  replaceSchedules: (id: string, items: ScheduleItem[]) =>
    request<CommonAreaDetail>(`/admin/common-areas/${id}/schedules`, {
      method: "PUT",
      body: JSON.stringify(items),
    }),
  replaceImages: (id: string, items: Array<{ url: string; sort_order: number }>) =>
    request<CommonAreaDetail>(`/admin/common-areas/${id}/images`, {
      method: "PUT",
      body: JSON.stringify(items),
    }),
  createBlackout: (
    id: string,
    payload: { reason_type: string; starts_at: string; ends_at: string; note?: string },
  ) =>
    request<BlackoutOut>(`/admin/common-areas/${id}/blackouts`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deleteBlackout: async (areaId: string, blackoutId: string) => {
    const headers = new Headers({ "Content-Type": "application/json" });
    const token = localStorage.getItem("auth-store")
      ? JSON.parse(localStorage.getItem("auth-store") as string).state?.token
      : null;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${API_BASE_URL}/admin/common-areas/${areaId}/blackouts/${blackoutId}`, {
      method: "DELETE",
      headers,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(typeof body?.detail === "string" ? body.detail : response.statusText);
    }
  },
  reservations: (params?: {
    from_date?: string;
    to_date?: string;
    common_area_id?: string;
    resident_id?: string;
    status?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.from_date) qs.set("from_date", params.from_date);
    if (params?.to_date) qs.set("to_date", params.to_date);
    if (params?.common_area_id) qs.set("common_area_id", params.common_area_id);
    if (params?.resident_id) qs.set("resident_id", params.resident_id);
    if (params?.status) qs.set("status", params.status);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<ReservationAdmin[]>(`/admin/reservations${suffix}`);
  },
  approveReservation: (id: string) =>
    request<ReservationAdmin>(`/admin/reservations/${id}/approve`, { method: "POST" }),
  rejectReservation: (id: string, reason = "") =>
    request<ReservationAdmin>(`/admin/reservations/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  cancelReservationAdmin: (id: string) =>
    request<ReservationAdmin>(`/admin/reservations/${id}/cancel`, { method: "POST" }),

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

