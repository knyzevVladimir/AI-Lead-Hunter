"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { STATUS_META, STATUS_ORDER } from "@/theme/constants";
import type { CRMStatus } from "@/types/domain";

export function BulkStatusDialog({ open, onOpenChange, count, onSubmit, loading }: { open: boolean; onOpenChange: (open: boolean) => void; count: number; onSubmit: (status: CRMStatus, note?: string) => void; loading: boolean }) {
  const [status, setStatus] = useState<CRMStatus>("analyzed");
  const [note, setNote] = useState("");
  return <Dialog open={open} onOpenChange={onOpenChange} title="Изменить CRM-статус" description={`Изменение будет применено к ${count} выбранным лидам.`} footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button><Button loading={loading} onClick={() => onSubmit(status, note.trim() || undefined)}>Применить</Button></>}><div className="space-y-4"><div><Label>Новый статус</Label><Select value={status} onChange={(event) => setStatus(event.target.value as CRMStatus)}>{STATUS_ORDER.map((item) => <option key={item} value={item}>{STATUS_META[item].label}</option>)}</Select></div><div><Label>Комментарий</Label><Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Причина изменения или контекст для команды…" /></div></div></Dialog>;
}
