'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, Search, UserCheck, UserX, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { EmptyState } from '@/components/states';

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`);
    }
    const { data } = await query.limit(50);
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const logActivity = async (action: string, target: string) => {
    if (!profile) return;
    await supabase.from('activity_log').insert({ admin_id: profile.id, action, target });
  };

  const toggleActive = async (user: Profile) => {
    const newActive = !user.is_active;
    const { error } = await supabase.from('profiles').update({ is_active: newActive }).eq('id', user.id);
    if (!error) {
      toast({ title: newActive ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب' });
      logActivity(newActive ? 'تفعيل مستخدم' : 'تعطيل مستخدم', user.username);
      fetchUsers();
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">المستخدمون</h2>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="ابحث بالاسم، اسم المستخدم، البريد..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="لا يوجد مستخدمون" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المستخدم</TableHead>
                <TableHead>البريد</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التسجيل</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {u.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell className="text-sm">{u.phone ?? '-'}</TableCell>
                  <TableCell>
                    {u.role === 'admin' ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-primary"><Shield className="h-3 w-3" /> مدير</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">مستخدم</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                      {u.is_active ? 'نشط' : 'معطل'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell>
                    {u.role !== 'admin' && (
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(u)} className={u.is_active ? 'text-destructive' : 'text-emerald-500'}>
                        {u.is_active ? <><UserX className="h-4 w-4 ml-1" />تعطيل</> : <><UserCheck className="h-4 w-4 ml-1" />تفعيل</>}
                      </Button>
                    )}
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
