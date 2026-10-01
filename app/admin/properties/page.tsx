'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Building2, Search, Eye, Trash2, Star, Edit, Loader2, Plus, Ban, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Property, PropertyStatus, PROPERTY_TYPE_LABELS, PAYMENT_TYPE_LABELS, PAYMENT_FREQUENCY_LABELS, PaymentType, PaymentFrequency } from '@/lib/types';
import { ApprovalBadge, StatusBadge } from '@/components/status-badge';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/states';

export default function AdminPropertiesPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('approved');
  const [editProp, setEditProp] = useState<Property | null>(null);
  const [deleteProp, setDeleteProp] = useState<Property | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string; price: string; original_price: string; status: string; is_featured: boolean; description: string;
    display_fields: Record<string, boolean>;
    payment_type: string; down_payment_percentage: string; installment_duration_months: string; payment_frequency: string;
  }>({
    title: '', price: '', original_price: '', status: '', is_featured: false, description: '',
    display_fields: { address: true, location: true, price: true, area: true, bedrooms: true, bathrooms: true, floors: true, description: true, features: true },
    payment_type: 'cash_only', down_payment_percentage: '', installment_duration_months: '', payment_frequency: 'monthly',
  });

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('properties').select('*, property_images(*)').order('created_at', { ascending: false });
    if (search) {
      query = query.or(`title.ilike.%${search}%,property_code.ilike.%${search}%,city.ilike.%${search}%`);
    }
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (approvalFilter !== 'all') query = query.eq('approval_status', approvalFilter);
    const { data } = await query.limit(50);
    setProperties((data as Property[]) ?? []);
    setLoading(false);
  }, [search, statusFilter, approvalFilter]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const logActivity = async (action: string, target: string) => {
    if (!profile) return;
    await supabase.from('activity_log').insert({ admin_id: profile.id, action, target });
  };

  const updatePropertyStatus = async (id: string, status: PropertyStatus) => {
    const { error } = await supabase.from('properties').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } else {
      toast({ title: 'تم تحديث الحالة' });
      logActivity('تغيير حالة العقار إلى', status);
      fetchProperties();
    }
  };

  const toggleFeatured = async (prop: Property) => {
    const { error } = await supabase.from('properties').update({ is_featured: !prop.is_featured }).eq('id', prop.id);
    if (!error) {
      toast({ title: prop.is_featured ? 'تم إزالة التمييز' : 'تم تمييز العقار' });
      logActivity(prop.is_featured ? 'إزالة تمييز عقار' : 'تمييز عقار', prop.property_code);
      fetchProperties();
    }
  };

  const openEdit = (prop: Property) => {
    setEditProp(prop);
    setEditForm({
      title: prop.title,
      price: prop.price.toString(),
      original_price: prop.original_price?.toString() ?? '',
      status: prop.status,
      is_featured: prop.is_featured,
      description: prop.description ?? '',
      display_fields: {
        address: true, location: true, price: true, area: true, bedrooms: true,
        bathrooms: true, floors: true, description: true, features: true,
        ...(prop.display_fields ?? {}),
      },
      payment_type: prop.payment_type ?? 'cash_only',
      down_payment_percentage: prop.down_payment_percentage?.toString() ?? '',
      installment_duration_months: prop.installment_duration_months?.toString() ?? '',
      payment_frequency: prop.payment_frequency ?? 'monthly',
    });
  };

  const saveEdit = async () => {
    if (!editProp) return;
    const originalPrice = editForm.original_price ? parseFloat(editForm.original_price) : null;
    const price = parseFloat(editForm.price);
    const downPct = editForm.payment_type !== 'cash_only' && editForm.down_payment_percentage ? parseFloat(editForm.down_payment_percentage) : null;
    const durationMonths = editForm.payment_type !== 'cash_only' && editForm.installment_duration_months ? parseInt(editForm.installment_duration_months) : null;
    const monthlyInstallment = downPct != null && durationMonths != null && durationMonths > 0
      ? (price * (1 - downPct / 100) / durationMonths) : null;

    const { error } = await supabase.from('properties').update({
      title: editForm.title,
      price,
      original_price: originalPrice,
      discount_amount: originalPrice && originalPrice > price ? originalPrice - price : null,
      discount_percentage: originalPrice && originalPrice > price ? ((originalPrice - price) / originalPrice * 100) : null,
      status: editForm.status as PropertyStatus,
      is_featured: editForm.is_featured,
      description: editForm.description,
      display_fields: editForm.display_fields,
      payment_type: editForm.payment_type as PaymentType,
      down_payment_percentage: downPct,
      installment_duration_months: durationMonths,
      payment_frequency: (editForm.payment_type !== 'cash_only' ? editForm.payment_frequency : 'monthly') as PaymentFrequency,
      monthly_installment: monthlyInstallment,
    }).eq('id', editProp.id);

    if (!error) {
      toast({ title: 'تم تحديث العقار' });
      logActivity('تعديل عقار', editProp.property_code);
      setEditProp(null);
      fetchProperties();
    } else {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteProp) return;
    const { error } = await supabase.from('properties').delete().eq('id', deleteProp.id);
    if (!error) {
      toast({ title: 'تم حذف العقار' });
      logActivity('حذف عقار', deleteProp.property_code);
      setDeleteProp(null);
      fetchProperties();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold">إدارة العقارات</h2>
        <Button asChild>
          <Link href="/sell">
            <Plus className="h-4 w-4 ml-2" />
            إضافة عقار
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث بالعنوان، الرمز، المدينة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="available">متاح</SelectItem>
            <SelectItem value="reserved">محجوز</SelectItem>
            <SelectItem value="sold">مباع</SelectItem>
            <SelectItem value="unpublished">غير منشور</SelectItem>
          </SelectContent>
        </Select>
        <Select value={approvalFilter} onValueChange={setApprovalFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="الموافقة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="pending">قيد المراجعة</SelectItem>
            <SelectItem value="approved">مقبول</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : properties.length === 0 ? (
        <EmptyState icon={Building2} title="لا توجد عقارات" description="لا توجد عقارات مطابقة للبحث" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العقار</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الموافقة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((prop) => (
                <TableRow key={prop.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{prop.title}</p>
                      <p className="text-xs text-muted-foreground">{prop.property_code} · {prop.city}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{PROPERTY_TYPE_LABELS[prop.property_type]}</TableCell>
                  <TableCell className="text-sm font-medium">{new Intl.NumberFormat('ar-EG').format(prop.price)}</TableCell>
                  <TableCell><StatusBadge status={prop.status} /></TableCell>
                  <TableCell><ApprovalBadge status={prop.approval_status} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {prop.approval_status === 'approved' && prop.status !== 'sold' && (
                        <>
                          {prop.status !== 'reserved' && (
                            <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => updatePropertyStatus(prop.id, 'reserved')}>
                              <Clock className="h-3.5 w-3.5 ml-1" />
                              حجز
                            </Button>
                          )}
                          {prop.status !== 'available' && (
                            <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => updatePropertyStatus(prop.id, 'available')}>
                              <CheckCircle className="h-3.5 w-3.5 ml-1" />
                              متاح
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => updatePropertyStatus(prop.id, 'sold')}>
                            <Ban className="h-3.5 w-3.5 ml-1" />
                            بيع
                          </Button>
                        </>
                      )}
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                        <Link href={`/property/${prop.slug}`} target="_blank"><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(prop)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleFeatured(prop)}>
                        <Star className={`h-4 w-4 ${prop.is_featured ? 'fill-gold text-gold' : ''}`} />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteProp(prop)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editProp} onOpenChange={(v) => !v && setEditProp(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل العقار</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السعر</Label>
                <Input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">متاح</SelectItem>
                    <SelectItem value="reserved">محجوز</SelectItem>
                    <SelectItem value="sold">مباع</SelectItem>
                    <SelectItem value="unpublished">غير منشور</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea rows={4} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="featured" checked={editForm.is_featured} onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })} />
              <Label htmlFor="featured">عقار مميز</Label>
            </div>

            {/* Payment Plan */}
            <div className="space-y-3 border-t border-border pt-4">
              <Label className="text-base font-semibold">خطة الدفع والخصم</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>السعر الأصلي (للخصم)</Label>
                  <Input type="number" value={editForm.original_price} onChange={(e) => setEditForm({ ...editForm, original_price: e.target.value })} placeholder="لو فيه خصم" />
                </div>
                <div className="space-y-2">
                  <Label>نوع الدفع</Label>
                  <Select value={editForm.payment_type} onValueChange={(v) => setEditForm({ ...editForm, payment_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {editForm.payment_type !== 'cash_only' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>نسبة المقدم (%)</Label>
                    <Input type="number" min={0} max={100} value={editForm.down_payment_percentage} onChange={(e) => setEditForm({ ...editForm, down_payment_percentage: e.target.value })} placeholder="20" />
                  </div>
                  <div className="space-y-2">
                    <Label>مدة التقسيط (شهر)</Label>
                    <Input type="number" value={editForm.installment_duration_months} onChange={(e) => setEditForm({ ...editForm, installment_duration_months: e.target.value })} placeholder="60" />
                  </div>
                  <div className="space-y-2">
                    <Label>تكرار الدفع</Label>
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

            <div className="space-y-2">
              <Label>البيانات الظاهرة للزوار</Label>
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 text-sm">
                {[
                  ['address', 'العنوان التفصيلي'], ['location', 'المنطقة'], ['price', 'السعر'],
                  ['area', 'المساحة'], ['bedrooms', 'غرف النوم'], ['bathrooms', 'الحمامات'],
                  ['floors', 'الطوابق'], ['description', 'الوصف'], ['features', 'المميزات'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProp(null)}>إلغاء</Button>
            <Button onClick={saveEdit}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteProp} onOpenChange={(v) => !v && setDeleteProp(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">هل أنت متأكد من حذف العقار "{deleteProp?.title}"؟ لا يمكن التراجع عن هذا الإجراء.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProp(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={confirmDelete}>حذف</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
