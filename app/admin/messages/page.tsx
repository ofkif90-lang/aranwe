'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Loader2, Mail, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContactMessage, Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/states';

const statusLabels: Record<string, string> = {
  new: 'جديد',
  read: 'مقروء',
  responded: 'تم الرد',
  closed: 'مغلق',
};

const statusColors: Record<string, string> = {
  new: 'bg-primary/10 text-primary',
  read: 'bg-muted text-muted-foreground',
  responded: 'bg-emerald-500/10 text-emerald-500',
  closed: 'bg-muted text-muted-foreground',
};

export default function AdminMessagesPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMsg, setViewMsg] = useState<ContactMessage | null>(null);
  const [sendModal, setSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({ userId: '', title: '', message: '' });
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(50);
    setMessages((data as ContactMessage[]) ?? []);
    setLoading(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'user').order('full_name');
    setUsers((data as Profile[]) ?? []);
  }, []);

  useEffect(() => { fetchMessages(); fetchUsers(); }, [fetchMessages, fetchUsers]);

  const markAsRead = async (msg: ContactMessage) => {
    if (msg.status === 'new') {
      await supabase.from('contact_messages').update({ status: 'read' }).eq('id', msg.id);
      fetchMessages();
    }
  };

  const updateStatus = async (msg: ContactMessage, status: string) => {
    await supabase.from('contact_messages').update({ status }).eq('id', msg.id);
    toast({ title: 'تم تحديث الحالة' });
    fetchMessages();
  };

  const sendToUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendForm.userId || !sendForm.title || !sendForm.message) return;
    setSending(true);
    try {
      await supabase.from('notifications').insert({
        user_id: sendForm.userId,
        title: sendForm.title,
        message: sendForm.message,
        type: 'info',
      });
      toast({ title: 'تم إرسال الرسالة' });
      setSendForm({ userId: '', title: '', message: '' });
      setSendModal(false);
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">الرسائل</h2>
        <Button onClick={() => setSendModal(true)}>
          <Send className="h-4 w-4 ml-2" />
          إرسال رسالة لمستخدم
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : messages.length === 0 ? (
        <EmptyState icon={MessageSquare} title="لا توجد رسائل" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المرسل</TableHead>
                <TableHead>الموضوع</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg.id} className={msg.status === 'new' ? 'bg-primary/5' : ''}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{msg.name}</p>
                      <p className="text-xs text-muted-foreground">{msg.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{msg.subject}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(msg.created_at).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[msg.status]}`}>
                      {statusLabels[msg.status]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => { setViewMsg(msg); markAsRead(msg); }}>
                      عرض
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!viewMsg} onOpenChange={(v) => !v && setViewMsg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewMsg?.subject}</DialogTitle>
          </DialogHeader>
          {viewMsg && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {viewMsg.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{viewMsg.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{viewMsg.email}</span>
                    {viewMsg.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{viewMsg.phone}</span>}
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4 text-sm leading-relaxed">{viewMsg.message}</div>
              <p className="text-xs text-muted-foreground">{new Date(viewMsg.created_at).toLocaleString('ar-EG')}</p>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => updateStatus(viewMsg, 'responded')}>تم الرد</Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(viewMsg, 'closed')}>إغلاق</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={sendModal} onOpenChange={setSendModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إرسال رسالة لمستخدم</DialogTitle>
          </DialogHeader>
          <form onSubmit={sendToUser} className="space-y-4">
            <div className="space-y-2">
              <Label>المستلم</Label>
              <Select value={sendForm.userId} onValueChange={(v) => setSendForm({ ...sendForm, userId: v })}>
                <SelectTrigger><SelectValue placeholder="اختر مستخدم" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name} (@{u.username})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input value={sendForm.title} onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>الرسالة</Label>
              <Textarea rows={4} value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSendModal(false)}>إلغاء</Button>
              <Button type="submit" disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 ml-2" />إرسال</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
