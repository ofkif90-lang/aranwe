'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, Send, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Notification, Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/states';

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ userId: '', title: '', message: '', type: 'info' });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const [notifData, usersData] = await Promise.all([
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('profiles').select('*').eq('role', 'user').order('full_name'),
    ]);
    setNotifications((notifData.data as Notification[]) ?? []);
    setUsers((usersData.data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.title || !form.message) return;
    setSending(true);
    try {
      await supabase.from('notifications').insert({
        user_id: form.userId,
        title: form.title,
        message: form.message,
        type: form.type,
      });
      toast({ title: 'تم إرسال الإشعار' });
      setForm({ userId: '', title: '', message: '', type: 'info' });
      fetchNotifications();
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">إدارة الإشعارات</h2>

      {/* Send notification */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" />
          إرسال إشعار جديد
        </h3>
        <form onSubmit={sendNotification} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>المستلم</Label>
              <Select value={form.userId} onValueChange={(v) => setForm({ ...form, userId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر مستخدم" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name} (@{u.username})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">معلومة</SelectItem>
                  <SelectItem value="success">نجاح</SelectItem>
                  <SelectItem value="warning">تحذير</SelectItem>
                  <SelectItem value="error">خطأ</SelectItem>
                  <SelectItem value="property">عقار</SelectItem>
                  <SelectItem value="system">نظام</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>الرسالة</Label>
            <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
          </div>
          <Button type="submit" disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 ml-2" />إرسال</>}
          </Button>
        </form>
      </div>

      {/* Recent notifications */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="لا توجد إشعارات" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العنوان</TableHead>
                <TableHead>الرسالة</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="font-medium text-sm">{n.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{n.message}</TableCell>
                  <TableCell><span className="text-xs rounded-full bg-muted px-2 py-0.5">{n.type}</span></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(n.created_at).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteNotification(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
