"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/providers/toast-provider";
import { api } from "@/services/api";
import type { Channel, Company } from "@/types/domain";

export function OfferDialog({ company, open, onOpenChange }: { company: Company | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [channel, setChannel] = useState<Channel>("email");
  const [tone, setTone] = useState("professional");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const mutation = useMutation({
    mutationFn: () => api.generateOffer(company!.id, channel, tone),
    onSuccess: (data) => { setSubject(data.subject ?? ""); setBody(data.body); toast({ title: "Предложение готово", description: data.used_llm ? "Текст создан с помощью LLM." : "Использован резервный шаблон.", tone: "success" }); },
    onError: (error) => toast({ title: "Не удалось создать предложение", description: (error as Error).message, tone: "error" }),
  });
  useEffect(() => { if (!open) { setSubject(""); setBody(""); setCopied(false); } }, [open]);
  const copy = async () => { await navigator.clipboard.writeText([subject, body].filter(Boolean).join("\n\n")); setCopied(true); window.setTimeout(() => setCopied(false), 1600); };

  return <Dialog open={open} onOpenChange={onOpenChange} title="AI-предложение" description={company ? `Персонализированный текст для ${company.name}` : undefined} size="lg" footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>Закрыть</Button>{body ? <Button onClick={copy}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Скопировано" : "Скопировать"}</Button> : <Button onClick={() => mutation.mutate()} loading={mutation.isPending}><Sparkles className="h-4 w-4" />Сгенерировать</Button>}</>}>
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><div><Label>Канал</Label><Select value={channel} onChange={(event) => setChannel(event.target.value as Channel)}><option value="email">Email</option><option value="telegram">Telegram</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="linkedin">LinkedIn</option></Select></div><div><Label>Тон сообщения</Label><Select value={tone} onChange={(event) => setTone(event.target.value)}><option value="professional">Профессиональный</option><option value="friendly">Дружелюбный</option><option value="short">Короткий</option></Select></div></div>
      {!body ? <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-8 text-center transition hover:bg-violet-50 disabled:opacity-50"><span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-200"><Sparkles className="h-5 w-5" /></span><span className="text-sm font-semibold text-slate-900">Создать персональное предложение</span><span className="mt-1 max-w-md text-xs leading-5 text-slate-500">AI использует данные компании и результаты анализа. Сообщение сохранится как черновик кампании.</span></button> : <><div><Label>Тема</Label><Textarea value={subject} onChange={(event) => setSubject(event.target.value)} className="min-h-12 resize-none" /></div><div><Label>Сообщение</Label><Textarea value={body} onChange={(event) => setBody(event.target.value)} className="min-h-64" /></div></>}
    </div>
  </Dialog>;
}
