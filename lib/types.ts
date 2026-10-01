export type UserRole = 'user' | 'admin';

export type PropertyType = 'villa' | 'house' | 'apartment' | 'land' | 'commercial' | 'office' | 'chalet';

export type PropertyStatus = 'available' | 'reserved' | 'sold' | 'unpublished';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type SellRequestStatus = 'pending' | 'approved' | 'rejected' | 'published' | 'reserved' | 'sold';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'property' | 'system';

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyContactDetails {
  property_id: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  property_code: string;
  owner_id: string;
  title: string;
  slug: string;
  property_type: PropertyType;
  address: string | null;
  city: string | null;
  location: string | null;
  price: number;
  original_price: number | null;
  discount_amount: number | null;
  discount_percentage: number | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floors: number | null;
  description: string | null;
  features: string[] | null;
  display_fields?: Record<string, boolean>;
  property_contact_details?: PropertyContactDetails[];
  status: PropertyStatus;
  approval_status: ApprovalStatus;
  rejection_reason: string | null;
  is_featured: boolean;
  published_at: string | null;
  finishing_type: FinishingType | null;
  floor_plan_url: string | null;
  map_lat: number | null;
  map_lng: number | null;
  payment_type: PaymentType;
  down_payment_percentage: number | null;
  down_payment_amount: number | null;
  installment_duration_months: number | null;
  payment_frequency: PaymentFrequency;
  monthly_installment: number | null;
  created_at: string;
  updated_at: string;
  property_images?: PropertyImage[];
  owner?: Profile;
  is_favorited?: boolean;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  is_main: boolean;
  display_order: number;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  property_id: string;
  created_at: string;
}

export interface SellRequest {
  id: string;
  property_id: string;
  user_id: string;
  status: SellRequestStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  property?: Property;
  user?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  is_admin?: boolean;
  created_at: string;
}

export interface Inquiry {
  id: string;
  user_id: string | null;
  property_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded' | 'closed';
  created_at: string;
}

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  updated_at: string;
}

export type TicketCategory = 'account_problem' | 'website_problem' | 'property_problem' | 'payment_problem' | 'technical_problem' | 'complaint' | 'suggestion' | 'general_inquiry' | 'other';

export type TicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  account_problem: 'مشكلة في الحساب',
  website_problem: 'مشكلة في الموقع',
  property_problem: 'مشكلة في عقار',
  payment_problem: 'مشكلة في الدفع',
  technical_problem: 'مشكلة تقنية',
  complaint: 'شكوى',
  suggestion: 'اقتراح',
  general_inquiry: 'استفسار عام',
  other: 'أخرى',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'مفتوح',
  in_progress: 'قيد المعالجة',
  waiting_user: 'بانتظار المستخدم',
  resolved: 'تم الحل',
  closed: 'مغلق',
};

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-blue-500/10 text-blue-600',
  in_progress: 'bg-amber-500/10 text-amber-600',
  waiting_user: 'bg-cyan-500/10 text-cyan-600',
  resolved: 'bg-green-500/10 text-green-600',
  closed: 'bg-gray-500/10 text-gray-600',
};

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  ticket_replies?: TicketReply[];
  ticket_attachments?: TicketAttachment[];
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  user_id: string | null;
  sender_type: 'user' | 'admin';
  message: string;
  created_at: string;
}

export interface TicketAttachment {
  id: string;
  ticket_id: string;
  reply_id: string | null;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export type PaymentType = 'cash_only' | 'installments_only' | 'cash_installments';
export type PaymentFrequency = 'monthly' | 'quarterly';

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  cash_only: 'كاش فقط',
  installments_only: 'تقسيط فقط',
  cash_installments: 'كاش وتقسيط',
};

export const PAYMENT_FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  monthly: 'شهري',
  quarterly: 'ربعي (كل 3 شهور)',
};

export type FinishingType = 'super_lux' | 'lux' | 'semi_lux' | 'skeleton' | 'furnished';

export const FINISHING_TYPE_LABELS: Record<FinishingType, string> = {
  super_lux: 'سوبر لوكس',
  lux: 'لوكس',
  semi_lux: 'نص لوكس',
  skeleton: 'عظم',
  furnished: 'مفروش',
};

export type LeadStatus = 'new' | 'contacted' | 'viewing_scheduled' | 'negotiating' | 'closed_won' | 'closed_lost';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'طلب جديد',
  contacted: 'تم التواصل',
  viewing_scheduled: 'تم تحديد معاينة',
  negotiating: 'جارٍ التفاوض',
  closed_won: 'تم البيع',
  closed_lost: 'فقد الطلب',
};

export type DealStatus = 'new_lead' | 'viewing_scheduled' | 'negotiating' | 'deal_closed' | 'deal_lost';

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  new_lead: 'طلب جديد',
  viewing_scheduled: 'تم تحديد معاينة',
  negotiating: 'جارٍ التفاوض',
  deal_closed: 'تم إغلاق الصفقة',
  deal_lost: 'فقد الصفقة',
};

export interface PropertyLead {
  id: string;
  property_id: string;
  user_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  payment_method: string;
  installment_years: number | null;
  message: string | null;
  status: LeadStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  property?: Property;
}

export interface Deal {
  id: string;
  property_id: string;
  lead_id: string | null;
  buyer_name: string;
  buyer_phone: string;
  buyer_email: string | null;
  seller_name: string | null;
  seller_phone: string | null;
  status: DealStatus;
  commission_percentage: number;
  commission_amount: number | null;
  property_price: number | null;
  viewing_date: string | null;
  viewing_agreement_signed: boolean;
  deal_closed_date: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  property?: Property;
}

export interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin?: Profile;
}

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  villa: 'فيلا',
  house: 'منزل',
  apartment: 'شقة',
  land: 'أرض',
  commercial: 'تجاري',
  office: 'مكتب',
  chalet: 'شاليه',
};

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  available: 'متاح',
  reserved: 'محجوز',
  sold: 'تم البيع',
  unpublished: 'غير منشور',
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'قيد المراجعة',
  approved: 'مقبول',
  rejected: 'مرفوض',
};
