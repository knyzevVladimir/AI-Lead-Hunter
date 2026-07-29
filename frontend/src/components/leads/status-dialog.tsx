"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { STATUS_META, STATUS_ORDER } from "@/theme/constants";
import type { CRMStatus } from "@/types/domain";

export function StatusDialog({ open, onOpenChange, current, loading, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; current: CRMStatus; loading: boolean; onSubmit: (status: CRMStatus, note?: string) => void }) {
  const [status, setStatus] = useState(current);
  const [note, setNote] = useState("");
  useEffect(() => { if (open) { setStatus(current); setNote(""); } }, [open, current]);
  return <Dialog open={open} onOpenChange={onOpenChange} title="Обновить CRM-статус" description="Изменение попадёт в историю лида." footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>Отмена</Button><Button loading={loading} onClick={() => onSubmit(status, note.trim() || undefined)}>Сохранить</Button></>}><div className="space-y-4"><div><Label>Статус</Label><Select value={status} onChange={(event) => setStatus(event.target.value as CRMStatus)}>{STATUS_ORDER.map((item) => <option key={item} value={item}>{STATUS_META[item].label}</option>)}</Select></div><div><Label>Комментарий</Label><Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Добавьте контекст для истории…" /></div></div></Dialog>;
}
