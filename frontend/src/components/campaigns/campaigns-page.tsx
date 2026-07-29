"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Mail, MessageCircleReply, Plus, Search, Send, Sparkles } from "lucide-react";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog";
import { MessageCard } from "@/components/campaigns/message-card";
import { MessageDialog } from "@/components/campaigns/message-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/providers/toast-provider";
import { api } from "@/services/api";
import { queryKeys } from "@/services/query-keys";
import type { CampaignMessage, MessageStatus } from "@/types/domain";


type MessageFilter = "all" | MessageStatus;

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<CampaignMessage | null>(null);
  const [filter, setFilter] = useState<MessageFilter>("all");
  const [search, setSearch] = useState("");
  const campaignsQuery = useQuery({ queryKey: queryKeys.campaigns.list, queryFn: api.listCampaigns });
  const messagesQuery = useQuery({ queryKey: queryKeys.campaigns.messages(), queryFn: () => api.listMessages() });
  const leadsQuery = useQuery({ queryKey: queryKeys.leads.list({ limit: 500 }), queryFn: () => api.listLeads({ limit: 500 }) });
  const integrationsQuery = useQuery({ queryKey: queryKeys.integrations, queryFn: api.getIntegrationStatus });
  const companies = new Map((leadsQuery.data?.items ?? []).map((company) => [company.id, company]));
  const messages = messagesQuery.data ?? [];
  const normalized = search.trim().toLocaleLowerCase("ru");
  const filtered = useMemo(() => messages.filter((message) => {
    if (filter !== "all" && message.status !== filter) return false;
    const company = companies.get(message.company_id);
    return !normalized || [message.subject, message.body, company?.name].some((value) => value?.toLocaleLowerCase("ru").includes(normalized));
  }), [messages, filter, normalized, companies]);
  const emailReady = integrationsQuery.data ? Object.values(integrationsQuery.data.email).some(Boolean) : true;

  const createMutation = useMutation({ mutationFn: api.createCampaign, onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all }); setCreateOpen(false); toast({ title: "Кампания создана", tone: "success" }); }, onError: (error) => toast({ title: "Кампания не создана", description: (error as Error).message, tone: "error" }) });
  const sendMutation = useMutation({ mutationFn: (message: CampaignMessage) => api.sendMessage({ message_id: message.id }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.messages() }); queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }); toast({ title: "Сообщение отправлено", tone: "success" }); }, onError: (error) => toast({ title: "Отправка не выполнена", description: (error as Error).message, tone: "error" }) });

  const tabs = (["all", "draft", "sent", "replied", "failed"] as MessageFilter[]).map((value) => ({ value, label: value === "all" ? "Все" : value === "draft" ? "Черновики" : value === "sent" ? "Отправленные" : value === "replied" ? "Ответы" : "Ошибки", count: value === "all" ? messages.length : messages.filter((message) => message.status === value).length }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Outreach" title="Кампании" description="Управляйте последовательностями касаний, AI-черновиками и отправкой сообщений." actions={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Новая кампания</Button>} />
      {!emailReady && <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold text-amber-900">Email-провайдер не подключён</p><p className="mt-0.5 text-[11px] text-amber-700">Черновики доступны, но отправка потребует SMTP, Gmail или Outlook в backend.</p></div><Link href="/integrations" className="text-xs font-semibold text-amber-800 underline underline-offset-2">Проверить интеграции</Link></div>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Activity} label="Кампаний" value={campaignsQuery.data?.length ?? 0} /><Metric icon={Mail} label="Сообщений" value={messages.length} /><Metric icon={Send} label="Отправлено" value={messages.filter((message) => message.status === "sent").length} /><Metric icon={MessageCircleReply} label="Ответов" value={messages.filter((message) => message.status === "replied").length} /></div>
      <section><div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-900">Активные кампании</h2><p className="mt-0.5 text-[11px] text-slate-400">Шаблоны и cadence для текущих сегментов</p></div></div>{campaignsQuery.isLoading ? <div className="flex gap-3 overflow-hidden">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-48 min-w-[300px] flex-1 rounded-2xl" />)}</div> : campaignsQuery.data?.length ? <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">{campaignsQuery.data.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} messages={messages} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-200 bg-white"><EmptyState icon={Sparkles} title="Создайте первую кампанию" description="Настройте канал, шаблон и интервалы follow-up." action={<Button size="sm" onClick={() => setCreateOpen(true)}>Новая кампания</Button>} /></div>}</section>
      <section className="space-y-4"><div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><Tabs items={tabs} value={filter} onChange={setFilter} className="max-w-full overflow-x-auto" /><div className="relative w-full xl:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Компания, тема или текст…" /></div></div>
        {messagesQuery.isLoading ? <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-52 rounded-2xl" />)}</div> : messagesQuery.isError ? <div className="rounded-2xl border border-slate-200 bg-white"><ErrorState message={(messagesQuery.error as Error).message} onRetry={() => messagesQuery.refetch()} /></div> : filtered.length ? <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{filtered.map((message) => <MessageCard key={message.id} message={message} company={companies.get(message.company_id)} onOpen={() => setSelectedMessage(message)} onSend={() => sendMutation.mutate(message)} sending={sendMutation.isPending && sendMutation.variables?.id === message.id} />)}</div> : <div className="rounded-2xl border border-slate-200 bg-white"><EmptyState icon={Mail} title="Сообщений нет" description="Сгенерируйте предложение из карточки лида или измените фильтр." action={<Link href="/leads" className="text-xs font-semibold text-violet-600">Открыть лиды</Link>} /></div>}
      </section>
      <CreateCampaignDialog open={createOpen} onOpenChange={setCreateOpen} loading={createMutation.isPending} onSubmit={(data) => createMutation.mutate(data)} />
      <MessageDialog message={selectedMessage} company={selectedMessage ? companies.get(selectedMessage.company_id) : undefined} open={Boolean(selectedMessage)} onOpenChange={(open) => !open && setSelectedMessage(null)} onSend={() => selectedMessage && sendMutation.mutate(selectedMessage)} sending={sendMutation.isPending} />
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) { return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Icon className="h-4 w-4" /></span><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-0.5 text-xl font-semibold tracking-[-.03em] text-slate-900 tabular-nums">{value}</p></div></div>; }
