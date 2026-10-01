'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActivityLog } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { EmptyState } from '@/components/states';

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('activity_log')
      .select('*, admin:profiles!activity_log_admin_id_fkey(full_name, username)')
      .order('created_at', { ascending: false })
      .limit(100);
    setLogs((data as ActivityLog[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" />
        سجل النشاط
      </h2>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : logs.length === 0 ? (
        <EmptyState icon={Activity} title="لا يوجد نشاط" description="سيظهر هنا سجل جميع الإجراءات الإدارية" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المدير</TableHead>
                <TableHead>الإجراء</TableHead>
                <TableHead>الهدف</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                        {log.admin?.full_name?.charAt(0) ?? 'A'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{log.admin?.full_name}</p>
                        <p className="text-xs text-muted-foreground">@{log.admin?.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.target ?? '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString('ar-EG')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
