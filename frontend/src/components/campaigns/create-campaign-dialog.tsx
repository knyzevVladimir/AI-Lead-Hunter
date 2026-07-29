"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Channel } from "@/types/domain";

export function CreateCampaignDialog({ open, onOpenChange, onSubmit, loading }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (data: { name: string; channel: Channel; subject_template?: string; body_template?: string; followup_days?: string }) => void; loading: boolean }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [days, setDays] = useState("3,7");
  useEffect(() => { if (!open) { setName(""); setSubject(""); setBody(""); setDays("3,7"); } }, [open]);
  return <Dialog open={open} onOpenChange={onOpenChange} title="Новая кампания" description="Создайте последовательность касаний. Секреты провайдера остаются в backend." size="lg" footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button><Button loading={loading} disabled={!name.trim()} onClick={() => onSubmit({ name: name.trim(), channel, subject_template: subject.trim() || undefined, body_template: body.trim() || undefined, followup_days: days.trim() || undefined })}>Создать кампанию</Button></>}>
    <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><Label>Название</Label><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Стоматологии Москвы · Q3" autoFocus /></div><div><Label>Канал</Label><Select value={channel} onChange={(event) => setChannel(event.target.value as Channel)}><option value="email">Email</option><option value="telegram">Telegram</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="linkedin">LinkedIn</option></Select></div></div><div><Label>Тема по умолчанию</Label><Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Идея по развитию {company}" /></div><div><Label>Шаблон сообщения</Label><Textarea value={body} onChange={(event) => setBody(event.target.value)} className="min-h-44" placeholder="Здравствуйте! Изучил цифровое присутствие вашей компании…" /></div><div><Label>Follow-up, дни</Label><Input value={days} onChange={(event) => setDays(event.target.value)} placeholder="3,7" /><p className="mt-1.5 text-[10px] text-slate-400">Введите интервалы через запятую, например 3,7.</p></div></div>
  </Dialog>;
}
