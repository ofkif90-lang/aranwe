'use client';

import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Phone, Mail, Eye, Calendar, DollarSign, FileText, X, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Deal, DealStatus, DEAL_STATUS_LABELS, Property, PropertyLead, LEAD_STATUS_LABELS } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<DealStatus, string> = {
  new_lead: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  viewing_scheduled: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  negotiating: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  deal_closed: 'bg-green-500/10 text-green-600 border-green-500/20',
  deal_lost: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function AdminDealsPage() {
  const { toast } = useToast();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [leads, setLeads] = useState<PropertyLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewLead, setViewLead] = useState<PropertyLead | null>(null);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [dealForm, setDealForm] = useState({
    buyer_name: '', buyer_phone: '', buyer_email: '', seller_name: '', seller_phone: '',
    commission_percentage: '2.5', property_price: '', viewing_date: '', admin_notes: '',
    viewing_agreement_signed: false,
  });
  const [convertingLead, setConvertingLead] = useState<PropertyLead | null>(null);

  const fetchData = useCallback(async () => {
    const [dealsRes, leadsRes] = await Promise.all([
      supabase.from('deals').select(`*, property:properties(*)`).order('created_at', { ascending: false }),
      supabase.from('property_leads').select(`*, property:properties(*)`).order('created_at', { ascending: false }),
    ]);
    setDeals((dealsRes.data as Deal[]) ?? []);
    setLeads((leadsRes.data as PropertyLead[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openLead = (lead: PropertyLead) => {
    setViewLead(lead);
    setLeadDialogOpen(true);
  };

  const updateLeadStatus = async (leadId: string, status: string) => {
    const { error } = await supabase.from('property_leads').update({ status }).eq('id', leadId);
    if (error) {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return;
    }
    toast({ title: 'تم تحديث حالة الطلب' });
    fetchData();
  };

  const openConvertToDeal = (lead: PropertyLead) => {
    setConvertingLead(lead);
    setDealForm({
      ...dealForm,
      buyer_name: lead.name,
      buyer_phone: lead.phone,
      buyer_email: lead.email ?? '',
      property_price: lead.property?.price?.toString() ?? '',
    });
    setDealDialogOpen(true);
  };

  const openEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setConvertingLead(null);
    setDealForm({
      buyer_name: deal.buyer_name,
      buyer_phone: deal.buyer_phone,
      buyer_email: deal.buyer_email ?? '',
      seller_name: deal.seller_name ?? '',
      seller_phone: deal.seller_phone ?? '',
      commission_percentage: deal.commission_percentage?.toString() ?? '2.5',
      property_price: deal.property_price?.toString() ?? '',
      viewing_date: deal.viewing_date ? new Date(deal.viewing_date).toISOString().slice(0, 16) : '',
      admin_notes: deal.admin_notes ?? '',
      viewing_agreement_signed: deal.viewing_agreement_signed,
    });
    setDealDialogOpen(true);
  };

  const saveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    const commissionAmount = (parseFloat(dealForm.property_price) || 0) * (parseFloat(dealForm.commission_percentage) || 0) / 100;

    const payload = {
      property_id: convertingLead?.property_id ?? editingDeal?.property_id,
      lead_id: convertingLead?.id ?? editingDeal?.lead_id ?? null,
      buyer_name: dealForm.buyer_name,
      buyer_phone: dealForm.buyer_phone,
      buyer_email: dealForm.buyer_email || null,
      seller_name: dealForm.seller_name || null,
      seller_phone: dealForm.seller_phone || null,
      commission_percentage: parseFloat(dealForm.commission_percentage) || 2.5,
      commission_amount: commissionAmount,
      property_price: parseFloat(dealForm.property_price) || null,
      viewing_date: dealForm.viewing_date ? new Date(dealForm.viewing_date).toISOString() : null,
      viewing_agreement_signed: dealForm.viewing_agreement_signed,
      admin_notes: dealForm.admin_notes || null,
      status: editingDeal?.status ?? 'new_lead',
    };

    if (editingDeal) {
      const { error } = await supabase.from('deals').update(payload).eq('id', editingDeal.id);
      if (error) { toast({ title: 'حدث خطأ', variant: 'destructive' }); return; }
      toast({ title: 'تم تحديث الصفقة' });
    } else {
      const { error } = await supabase.from('deals').insert(payload);
      if (error) { toast({ title: 'حدث خطأ', variant: 'destructive' }); return; }
      if (convertingLead) {
        await supabase.from('property_leads').update({ status: 'negotiating' }).eq('id', convertingLead.id);
      }
      toast({ title: 'تم إنشاء الصفقة بنجاح' });
    }

    setDealDialogOpen(false);
    setEditingDeal(null);
    setConvertingLead(null);
    fetchData();
  };

  const updateDealStatus = async (dealId: string, status: DealStatus) => {
    const update: Record<string, unknown> = { status };
    if (status === 'deal_closed') update.deal_closed_date = new Date().toISOString();

    const { error } = await supabase.from('deals').update(update).eq('id', dealId);
    if (error) { toast({ title: 'حدث خطأ', variant: 'destructive' }); return; }
    toast({ title: 'تم تحديث حالة الصفقة' });
    fetchData();
  };

  const filteredDeals = filterStatus === 'all' ? deals : deals.filter((d) => d.status === filterStatus);

  const formatPrice = (price: number) => new Intl.NumberFormat('ar-EG').format(price);

  const totalCommission = deals
    .filter((d) => d.status === 'deal_closed' && d.commission_amount)
    .reduce((sum, d) => sum + (d.commission_amount ?? 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Clock className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            الصفقات والعمولات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">تتبع طلبات المعاينة والصفقات والعمولات</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {Object.entries(DEAL_STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">إجمالي الصفقات</p>
          <p className="text-2xl font-bold mt-1">{deals.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">طلبات معاينة جديدة</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{leads.filter((l) => l.status === 'new').length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">صفقات مغلقة</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{deals.filter((d) => d.status === 'deal_closed').length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">إجمالي العمولات</p>
          <p className="text-2xl font-bold mt-1 text-primary">{formatPrice(totalCommission)} ج.م</p>
        </div>
      </div>

      {/* New Leads Section */}
      {leads.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              طلبات المعاينة ({leads.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {leads.map((lead) => (
              <div key={lead.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{lead.name}</span>
                      <Badge variant="outline" className={statusColors[lead.status as DealStatus] ?? statusColors.new_lead}>
                        {LEAD_STATUS_LABELS[lead.status as keyof typeof LEAD_STATUS_LABELS] ?? lead.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>
                      {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
                      <span className="text-xs bg-muted rounded px-2 py-0.5">
                        {lead.payment_method === 'cash' ? 'كاش' : lead.payment_method === 'installments' ? `تقسيط${lead.installment_years ? ` (${lead.installment_years} سنة)` : ''}` : 'تمويل عقاري'}
                      </span>
                      {lead.property && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {lead.property.property_code} - {lead.property.title}
                        </span>
                      )}
                      <span className="text-xs">{new Date(lead.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openLead(lead)}>عرض</Button>
                    <Button size="sm" onClick={() => openConvertToDeal(lead)}>
                      <TrendingUp className="h-3.5 w-3.5 ml-1" />
                      تحويل لصفقة
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deals Pipeline */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            الصفقات ({filteredDeals.length})
          </h2>
        </div>
        {filteredDeals.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">لا توجد صفقات بعد</div>
        ) : (
          <div className="divide-y divide-border">
            {filteredDeals.map((deal) => (
              <div key={deal.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold">{deal.buyer_name}</span>
                      <Badge variant="outline" className={statusColors[deal.status]}>
                        {DEAL_STATUS_LABELS[deal.status]}
                      </Badge>
                      {deal.viewing_agreement_signed && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                                          موقّع
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{deal.buyer_phone}</span>
                      {deal.property && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {deal.property.property_code}
                        </span>
                      )}
                      {deal.property_price && (
                        <span className="text-xs">السعر: {formatPrice(deal.property_price)} ج.م</span>
                      )}
                      {deal.commission_amount && (
                        <span className="text-xs font-semibold text-green-600">
                          العمولة: {formatPrice(deal.commission_amount)} ج.م ({deal.commission_percentage}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Select value={deal.status} onValueChange={(v) => updateDealStatus(deal.id, v as DealStatus)}>
                      <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(DEAL_STATUS_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => openEditDeal(deal)}>
                      <FileText className="h-3.5 w-3.5 ml-1" />
                      تفاصيل
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lead Detail Dialog */}
      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب المعاينة</DialogTitle>
          </DialogHeader>
          {viewLead && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">الاسم</p><p className="font-medium">{viewLead.name}</p></div>
                <div><p className="text-xs text-muted-foreground">الهاتف</p><p className="font-medium" dir="ltr">{viewLead.phone}</p></div>
                <div><p className="text-xs text-muted-foreground">البريد</p><p className="font-medium">{viewLead.email ?? '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">طريقة الدفع</p><p className="font-medium">{viewLead.payment_method === 'cash' ? 'كاش' : viewLead.payment_method === 'installments' ? 'تقسيط' : 'تمويل عقاري'}</p></div>
                {viewLead.installment_years && (
                  <div><p className="text-xs text-muted-foreground">مدة التقسيط</p><p className="font-medium">{viewLead.installment_years} سنة</p></div>
                )}
                <div><p className="text-xs text-muted-foreground">التاريخ المفضل</p><p className="font-medium">{viewLead.preferred_date ?? '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">الوقت المفضل</p><p className="font-medium">{viewLead.preferred_time ?? '-'}</p></div>
              </div>
              {viewLead.message && (
                <div><p className="text-xs text-muted-foreground">ملاحظات</p><p className="text-sm bg-muted/30 rounded-lg p-3">{viewLead.message}</p></div>
              )}
              {viewLead.property && (
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">العقار</p>
                  <p className="font-medium">{viewLead.property.property_code} - {viewLead.property.title}</p>
                  <p className="text-sm text-muted-foreground">{viewLead.property.city} - {formatPrice(viewLead.property.price)} ج.م</p>
                </div>
              )}
              <div className="flex gap-2">
                <Select value={viewLead.status} onValueChange={(v) => { updateLeadStatus(viewLead.id, v); setViewLead({ ...viewLead, status: v as PropertyLead['status'] }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAD_STATUS_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deal Form Dialog */}
      <Dialog open={dealDialogOpen} onOpenChange={setDealDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDeal ? 'تعديل الصفقة' : 'إنشاء صفقة جديدة'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveDeal} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>اسم المشتري *</Label>
                <Input required value={dealForm.buyer_name} onChange={(e) => setDealForm({ ...dealForm, buyer_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>هاتف المشتري *</Label>
                <Input required value={dealForm.buyer_phone} onChange={(e) => setDealForm({ ...dealForm, buyer_phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>بريد المشتري</Label>
                <Input value={dealForm.buyer_email} onChange={(e) => setDealForm({ ...dealForm, buyer_email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>اسم البائع</Label>
                <Input value={dealForm.seller_name} onChange={(e) => setDealForm({ ...dealForm, seller_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>هاتف البائع</Label>
                <Input value={dealForm.seller_phone} onChange={(e) => setDealForm({ ...dealForm, seller_phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>سعر العقار (ج.م)</Label>
                <Input type="number" value={dealForm.property_price} onChange={(e) => setDealForm({ ...dealForm, property_price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>نسبة العمولة (%)</Label>
                <Input type="number" step="0.1" value={dealForm.commission_percentage} onChange={(e) => setDealForm({ ...dealForm, commission_percentage: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>موعد المعاينة</Label>
                <Input type="datetime-local" value={dealForm.viewing_date} onChange={(e) => setDealForm({ ...dealForm, viewing_date: e.target.value })} />
              </div>
            </div>
            {dealForm.property_price && dealForm.commission_percentage && (
              <div className="bg-primary/5 rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">قيمة العمولة: </span>
                <span className="font-bold text-primary">
                  {formatPrice((parseFloat(dealForm.property_price) || 0) * (parseFloat(dealForm.commission_percentage) || 0) / 100)} ج.م
                </span>
              </div>
            )}
            <div className="space-y-2">
              <Label>ملاحظات</Label>
              <Textarea rows={3} value={dealForm.admin_notes} onChange={(e) => setDealForm({ ...dealForm, admin_notes: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={dealForm.viewing_agreement_signed} onChange={(e) => setDealForm({ ...dealForm, viewing_agreement_signed: e.target.checked })} />
              تم توقيع إقرار المعاينة
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDealDialogOpen(false)}>إلغاء</Button>
              <Button type="submit">{editingDeal ? 'حفظ' : 'إنشاء'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
