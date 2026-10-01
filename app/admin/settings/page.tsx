'use client';

import { useEffect, useState } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettingsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('site_settings').select('setting_key, setting_value');
      const map: Record<string, string> = {};
      (data ?? []).forEach((s) => { if (s.setting_value) map[s.setting_key] = s.setting_value; });
      setSettings(map);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(settings);
      for (const [key, value] of entries) {
        await supabase.from('site_settings').upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });
      }
      if (profile) {
        await supabase.from('activity_log').insert({ admin_id: profile.id, action: 'تحديث إعدادات الموقع', target: 'site_settings' });
      }
      toast({ title: 'تم حفظ الإعدادات' });
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const fields = [
    { key: 'site_name', label: 'اسم الموقع', type: 'input' },
    { key: 'whatsapp_number', label: 'رقم واتساب', type: 'input' },
    { key: 'contact_email', label: 'بريد التواصل', type: 'input' },
    { key: 'hero_title', label: 'عنوان الصفحة الرئيسية', type: 'input' },
    { key: 'hero_subtitle', label: 'وصف الصفحة الرئيسية', type: 'input' },
    { key: 'footer_text', label: 'نص التذييل', type: 'input' },
    { key: 'paypal_email', label: 'بريد PayPal', type: 'input' },
    { key: 'paypal_mode', label: 'وضع PayPal', type: 'input' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        إعدادات الموقع
      </h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">المحتوى والتواصل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                value={settings[field.key] ?? ''}
                onChange={(e) => setSettings({ ...settings, [field.key]: e.target.value })}
              />
            </div>
          ))}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 ml-2" />حفظ الإعدادات</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
