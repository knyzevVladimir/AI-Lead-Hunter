import { Skeleton } from "@/components/ui/skeleton";

export function SearchResultsSkeleton() {
  return <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3" aria-label="Поиск компаний" aria-busy="true">{Array.from({ length: 9 }).map((_, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start gap-3"><Skeleton className="h-11 w-11 shrink-0 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div><Skeleton className="h-9 w-9 rounded-full" /></div><div className="mt-5 grid grid-cols-2 gap-2"><Skeleton className="h-8" /><Skeleton className="h-8" /></div><Skeleton className="mt-4 h-8 w-full" /></div>)}</div>;
}
