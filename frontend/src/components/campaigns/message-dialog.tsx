"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, Copy, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { CampaignMessage, Company } from "@/types/domain";
import { formatDateTime } from "@/utils/format";

export function MessageDialog({ message, company, open, onOpenChange, onSend, sending }: { message: CampaignMessage | null; company?: Company; open: boolean; onOpenChange: (open: boolean) => void; onSend: () => void; sending: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!message) return null;
  const copy = async () => { await navigator.clipboard.writeText([message.subject, message.body].filter(Boolean).join("\n\n")); setCopied(true); window.setTimeout(() => setCopied(false), 1500); };
  return <Dialog open={open} onOpenChange={onOpenChange} title={message.subject || "Сообщение без темы"} description={`${company?.name || `Лид #${message.company_id}`} · ${formatDateTime(message.created_at)}`} size="lg" footer={<><Button variant="secondary" onClick={copy}>{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Скопировано" : "Скопировать"}</Button>{message.status === "draft" && <Button onClick={onSend} loading={sending}><Send className="h-4 w-4" />Отправить</Button>}<Link href={`/leads/${message.company_id}`} className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-slate-950 px-3.5 text-sm font-medium text-white">Открыть лид<ArrowUpRight className="h-4 w-4" /></Link></>}><div className="space-y-4"><div className="flex flex-wrap gap-2"><Badge>{message.channel}</Badge><Badge>Follow-up {message.followup_step}</Badge><Badge tone={message.status === "sent" ? "blue" : message.status === "replied" ? "emerald" : message.status === "failed" ? "rose" : "neutral"}>{message.status}</Badge></div><div className="whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">{message.body}</div></div></Dialog>;
}
