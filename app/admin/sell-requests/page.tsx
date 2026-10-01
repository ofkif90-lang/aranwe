'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, Eye, Check, X, Loader2, Phone, Pencil, EyeOff, Power } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { SellRequest, SellRequestStatus, Property, Profile, PAYMENT_TYPE_LABELS, PAYMENT_FREQUENCY_LABELS, PaymentType, PaymentFrequency } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/states';

const statusLabels: Record<SellRequestStatus, string> = {
  pending: 'قيد المراجعة',
  approved: 'مقبول',
  rejected: 'مرفوض',
  published: 'منشور',
  reserved: 'محجوز',
  sold: 'مباع',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500',
  approved: 'bg-emerald-500/10 text-emerald-500',
  rejected: 'bg-red-500/10 text-red-500',
  published: 'bg-primary/10 text-primary',
  reserved: 'bg-orange-500/10 text-orange-500',
  sold: 'bg-blue-500/10 text-blue-500',
};

export default function AdminSellRequestsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<(SellRequest & { property: Property & { property_images?: { image_url: string; is_main: boolean }[] }; user: Profile; contact?: { contact_phone: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [rejectModal, setRejectModal] = useState<SellRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewModal, setViewModal] = useState<(SellRequest & { property: Property & { property_images?: { image_url: string; is_main: boolean }[] }; user: Profile; contact?: { contact_phone: string } | null }) | null>(null);
  const [editModal, setEditModal] = useState<(SellRequest & { property: Property & { property_images?: { image_url: string; is_main: boolean }[] }; user: Profile; contact?: { contact_phone: string } | null }) | null>(null);
  const [editForm, setEditForm] = useState({
    title: '', property_type: 'apartment', city: '', location: '', price: 0,
    area: 0, bedrooms: 0, bathrooms: 0, floors: 0, description: '',
    payment_type: 'cash_only' as string, down_payment_percentage: '', installment_duration_months: '',
    payment_frequency: 'monthly' as string, display_fields: {} as Record<string, boolean>,
  });
  const [editSaving, setEditSaving] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('sell_requests')
      .select('*, property:properties(*)')
      .order('created_at', { ascending: false });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data, error: queryError } = await query.limit(50);

    if (queryError) {
      console.error('Admin sell-requests query error:', queryError);
      setRequests([]);
      setLoading(false);
      return;
    }

    const rows = (data as any[]) ?? [];
    if (rows.length > 0) {
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const [contactRes, imgRes, userRes] = await Promise.all([
        supabase.from('property_contact_details').select('property_id, contact_phone').in('property_id', rows.map((r) => r.property_id)),
        supabase.from('property_images').select('property_id, image_url, is_main').in('property_id', rows.map((r) => r.property_id)),
        supabase.from('profiles').select('id, full_name, username, email, phone').in('id', userIds),
      ]);
      const contactMap = new Map((contactRes.data ?? []).map((c: any) => [c.property_id, c]));
      const imgMap = new Map<string, any[]>();
      (imgRes.data ?? []).forEach((img: any) => {
        if (!imgMap.has(img.property_id)) imgMap.set(img.property_id, []);
        imgMap.get(img.property_id)!.push(img);
      });
      const userMap = new Map((userRes.data ?? []).map((u: any) => [u.id, u]));
      rows.forEach((r) => {
        r.contact = contactMap.get(r.property_id) ?? null;
        r.user = userMap.get(r.user_id) ?? null;
        if (r.property) r.property.property_images = imgMap.get(r.property_id) ?? [];
      });
    }
    setRequests(rows as any);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const logActivity = async (action: string, target: string) => {
    if (!profile) return;
    await supabase.from('activity_log').insert({ admin_id: profile.id, action, target });
  };

  const approveRequest = async (req: SellRequest) => {
    const { error: propError } = await supabase.from('properties').update({
      approval_status: 'approved',
      status: 'available',
      published_at: new Date().toISOString(),
    }).eq('id', req.property_id);

    if (propError) { toast({ title: 'حدث خطأ', variant: 'destructive' }); return; }

    await supabase.from('sell_requests').update({
      status: 'approved',
      reviewed_by: profile?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', req.id);

    await supabase.from('notifications').insert({
      user_id: req.user_id,
      title: 'تم قبول عقارك',
      message: `تم قبول عقارك "${req.property?.title}" ونشره على المنصة`,
      type: 'success',
    });

    logActivity('قبول طلب بيع', req.property?.property_code ?? '');
    toast({ title: 'تم قبول الطلب ونشر العقار' });
    fetchRequests();
  };

  const openEdit = (req: any) => {
    const p = req.property ?? {};
    setEditModal(req);
    setEditForm({
      title: p.title ?? '',
      property_type: p.property_type ?? 'apartment',
      city: p.city ?? '',
      location: p.location ?? '',
      price: p.price ?? 0,
      area: p.area ?? 0,
      bedrooms: p.bedrooms ?? 0,
      bathrooms: p.bathrooms ?? 0,
      floors: p.floors ?? 0,
      description: p.description ?? '',
      payment_type: p.payment_type ?? 'cash_only',
      down_payment_percentage: p.down_payment_percentage?.toString() ?? '',
      installment_duration_months: p.installment_duration_months?.toString() ?? '',
      payment_frequency: p.payment_frequency ?? 'monthly',
      display_fields: {
        address: true, location: true, price: true, area: true, bedrooms: true,
        bathrooms: true, floors: true, description: true, features: true,
        ...(p.display_fields ?? {}),
      },
    });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setEditSaving(true);
    const price = Number(editForm.price);
    const downPct = editForm.payment_type !== 'cash_only' && editForm.down_payment_percentage ? parseFloat(editForm.down_payment_percentage) : null;
    const durationMonths = editForm.payment_type !== 'cash_only' && editForm.installment_duration_months ? parseInt(editForm.installment_duration_months) : null;
    const monthlyInstallment = downPct != null && durationMonths != null && durationMonths > 0
      ? (price * (1 - downPct / 100) / durationMonths) : null;
    const { error } = await supabase.from('properties').update({
      title: editForm.title,
      property_type: editForm.property_type,
      city: editForm.city,
      location: editForm.location,
      price,
      area: editForm.area ? Number(editForm.area) : null,
      bedrooms: editForm.bedrooms ? Number(editForm.bedrooms) : null,
      bathrooms: editForm.bathrooms ? Number(editForm.bathrooms) : null,
      floors: editForm.floors ? Number(editForm.floors) : null,
      description: editForm.description || null,
      payment_type: editForm.payment_type as PaymentType,
      down_payment_percentage: downPct,
      installment_duration_months: durationMonths,
      payment_frequency: (editForm.payment_type !== 'cash_only' ? editForm.payment_frequency : 'monthly') as PaymentFrequency,
      monthly_installment: monthlyInstallment,
      display_fields: editForm.display_fields,
    }).eq('id', editModal.property_id);
    if (error) {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } else {
      toast({ title: 'تم تحديث العقار' });
      setEditModal(null);
      fetchRequests();
    }
    setEditSaving(false);
  };

  const togglePublish = async (req: SellRequest) => {
    const isPublished = req.property?.status === 'available' || req.property?.status === 'reserved' || req.property?.status === 'sold';
    const newStatus = isPublished ? 'unpublished' : 'available';
    const newApproval = isPublished ? 'approved' : 'approved';
    const newPublishedAt = isPublished ? null : new Date().toISOString();
    const { error } = await supabase.from('properties').update({
      status: newStatus,
      approval_status: newApproval,
      published_at: newPublishedAt,
    }).eq('id', req.property_id);
    if (error) {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } else {
      toast({ title: isPublished ? 'تم إخفاء العقار' : 'تم نشر العقار' });
      logActivity(isPublished ? 'إخفاء عقار' : 'نشر عقار', req.property?.property_code ?? '');
      fetchRequests();
    }
  };

  const confirmReject = async () => {
    if (!rejectModal || !rejectReason.trim()) return;

    await supabase.from('properties').update({
      approval_status: 'rejected',
      rejection_reason: rejectReason,
    }).eq('id', rejectModal.property_id);

    await supabase.from('sell_requests').update({
      status: 'rejected',
      rejection_reason: rejectReason,
      reviewed_by: profile?.id,
      reviewed_at: new Date().toISOString(),
    }).eq('id', rejectModal.id);

    await supabase.from('notifications').insert({
      user_id: rejectModal.user_id,
      title: 'تم رفض عقارك',
      message: `تم رفض عقارك "${rejectModal.property?.title}". السبب: ${rejectReason}`,
      type: 'error',
    });

    logActivity('رفض طلب بيع', rejectModal.property?.property_code ?? '');
    toast({ title: 'تم رفض الطلب' });
    setRejectModal(null);
    setRejectReason('');
    fetchRequests();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">طلبات البيع</h2>

      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="pending">قيد المراجعة</SelectItem>
            <SelectItem value="approved">مقبول</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : requests.length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد طلبات" description="لا توجد طلبات بيع مطابقة" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العقار</TableHead>
                <TableHead>الصورة</TableHead>
                <TableHead>البائع</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{req.property?.title}</p>
                      <p className="text-xs text-muted-foreground">{req.property?.property_code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const mainImg = req.property?.property_images?.find((img: any) => img.is_main) ?? req.property?.property_images?.[0];
                      return mainImg ? (
                        <div className="relative h-14 w-20 overflow-hidden rounded-lg">
                          <Image src={mainImg.image_url} alt={req.property?.title ?? ''} fill sizes="80px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">لا صورة</div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{req.user?.full_name}</p>
                      <p className="text-xs text-muted-foreground">@{req.user?.username}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{new Intl.NumberFormat('ar-EG').format(req.property?.price ?? 0)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(req.created_at).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[req.status]}`}>
                      {statusLabels[req.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setViewModal(req)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(req)} title="تعديل">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {req.status === 'pending' && (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={() => approveRequest(req)} title="قبول">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { setRejectModal(req); setRejectReason(''); }} title="رفض">
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => togglePublish(req)} title={req.property?.status === 'unpublished' ? 'نشر' : 'إخفاء'}>
                          {req.property?.status === 'unpublished' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Modal */}
      <Dialog open={!!viewModal} onOpenChange={(v) => !v && setViewModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب البيع</DialogTitle>
          </DialogHeader>
          {viewModal && (
            <div className="space-y-3 text-sm">
              {(() => {
                const mainImg = viewModal.property?.property_images?.find((img: any) => img.is_main) ?? viewModal.property?.property_images?.[0];
                return mainImg ? (
                  <div className="relative h-40 w-full overflow-hidden rounded-lg">
                    <Image src={mainImg.image_url} alt={viewModal.property?.title ?? ''} fill sizes="100%" className="object-cover" />
                  </div>
                ) : null;
              })()}
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">العنوان:</span> <span className="font-medium">{viewModal.property?.title}</span></div>
                <div><span className="text-muted-foreground">الرمز:</span> <span className="font-medium">{viewModal.property?.property_code}</span></div>
                <div><span className="text-muted-foreground">النوع:</span> <span className="font-medium">{viewModal.property?.property_type}</span></div>
                <div><span className="text-muted-foreground">المدينة:</span> <span className="font-medium">{viewModal.property?.city}</span></div>
                <div><span className="text-muted-foreground">السعر:</span> <span className="font-medium">{new Intl.NumberFormat('ar-EG').format(viewModal.property?.price ?? 0)} جنيه</span></div>
                <div><span className="text-muted-foreground">المساحة:</span> <span className="font-medium">{viewModal.property?.area ?? '-'} م²</span></div>
                <div><span className="text-muted-foreground">غرف:</span> <span className="font-medium">{viewModal.property?.bedrooms ?? '-'}</span></div>
                <div><span className="text-muted-foreground">حمامات:</span> <span className="font-medium">{viewModal.property?.bathrooms ?? '-'}</span></div>
              </div>
              {viewModal.property?.description && (
                <div>
                  <span className="text-muted-foreground">الوصف:</span>
                  <p className="mt-1">{viewModal.property.description}</p>
                </div>
              )}
              <div className="border-t pt-3">
                <p className="font-medium mb-1">البائع:</p>
                <p>{viewModal.user?.full_name} (@{viewModal.user?.username})</p>
                <p className="text-muted-foreground">{viewModal.user?.email} · {viewModal.user?.phone}</p>
              </div>
              {viewModal.contact && (
                <div className="border-t pt-3">
                  <p className="flex items-center gap-1 font-medium mb-1"><Phone className="h-4 w-4 text-primary" /> رقم التواصل بالعقار:</p>
                  <p className="text-lg font-bold text-primary" dir="ltr">{viewModal.contact.contact_phone}</p>
                  <p className="text-xs text-muted-foreground">هذا الرقم يظهر للإدارة فقط ولا يظهر للزوار</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {viewModal?.status === 'pending' && (
              <>
                <Button variant="outline" onClick={() => { openEdit(viewModal); setViewModal(null); }}>
                  <Pencil className="h-4 w-4 ml-1" /> تعديل
                </Button>
                <Button variant="destructive" onClick={() => { setRejectModal(viewModal); setRejectReason(''); setViewModal(null); }}>
                  <X className="h-4 w-4 ml-1" /> رفض
                </Button>
                <Button onClick={() => { approveRequest(viewModal); setViewModal(null); }}>
                  <Check className="h-4 w-4 ml-1" /> قبول ونشر
                </Button>
              </>
            )}
            {viewModal?.status !== 'pending' && (
              <>
                <Button variant="outline" onClick={() => { openEdit(viewModal); setViewModal(null); }}>
                  <Pencil className="h-4 w-4 ml-1" /> تعديل
                </Button>
                <Button variant="outline" onClick={() => { togglePublish(viewModal as any); setViewModal(null); }}>
                  <Power className="h-4 w-4 ml-1" />
                  {viewModal?.property?.status === 'unpublished' ? 'نشر' : 'إخفاء'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editModal} onOpenChange={(v) => !v && setEditModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل العقار</DialogTitle>
          </DialogHeader>
          {editModal && (
            <form onSubmit={saveEdit} className="space-y-3">
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>النوع</Label>
                  <Select value={editForm.property_type} onValueChange={(v) => setEditForm({ ...editForm, property_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">شقة</SelectItem>
                      <SelectItem value="villa">فيلا</SelectItem>
                      <SelectItem value="house">منزل</SelectItem>
                      <SelectItem value="land">أرض</SelectItem>
                      <SelectItem value="commercial">تجاري</SelectItem>
                      <SelectItem value="chalet">شاليه</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>الموقع</Label>
                  <Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>السعر</Label>
                  <Input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>المساحة (م²)</Label>
                  <Input type="number" value={editForm.area} onChange={(e) => setEditForm({ ...editForm, area: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>غرف</Label>
                  <Input type="number" value={editForm.bedrooms} onChange={(e) => setEditForm({ ...editForm, bedrooms: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>حمامات</Label>
                  <Input type="number" value={editForm.bathrooms} onChange={(e) => setEditForm({ ...editForm, bathrooms: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الطوابق</Label>
                <Input type="number" value={editForm.floors} onChange={(e) => setEditForm({ ...editForm, floors: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea rows={4} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
              </div>

              {/* Payment Plan */}
              <div className="space-y-3 border-t border-border pt-3">
                <Label className="text-sm font-semibold">طريقة الدفع</Label>
                <Select value={editForm.payment_type} onValueChange={(v) => setEditForm({ ...editForm, payment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editForm.payment_type !== 'cash_only' && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">المقدم (%)</Label>
                      <Input type="number" min={0} max={100} value={editForm.down_payment_percentage} onChange={(e) => setEditForm({ ...editForm, down_payment_percentage: e.target.value })} placeholder="20" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">المدة (شهر)</Label>
                      <Input type="number" value={editForm.installment_duration_months} onChange={(e) => setEditForm({ ...editForm, installment_duration_months: e.target.value })} placeholder="60" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">التكرار</Label>
                      <Select value={editForm.payment_frequency} onValueChange={(v) => setEditForm({ ...editForm, payment_frequency: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Display Fields */}
              <div className="space-y-2 border-t border-border pt-3">
                <Label className="text-sm font-semibold">البيانات الظاهرة للزوار</Label>
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 text-xs">
                  {[
                    ['address', 'العنوان التفصيلي'], ['location', 'المنطقة'], ['price', 'السعر'],
                    ['area', 'المساحة'], ['bedrooms', 'غرف النوم'], ['bathrooms', 'الحمامات'],
                    ['floors', 'الطوابق'], ['description', 'الوصف'], ['features', 'المميزات'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={editForm.display_fields[key] ?? true}
                        onChange={(e) => setEditForm({
                          ...editForm,
                          display_fields: { ...editForm.display_fields, [key]: e.target.checked },
                        })}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditModal(null)}>إلغاء</Button>
                <Button type="submit" disabled={editSaving}>
                  {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ التعديلات'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={!!rejectModal} onOpenChange={(v) => !v && setRejectModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>رفض الطلب</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">أدخل سبب الرفض (سيظهر للمستخدم):</p>
            <Textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="مثال: الصور غير واضحة، المعلومات ناقصة..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!rejectReason.trim()}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
