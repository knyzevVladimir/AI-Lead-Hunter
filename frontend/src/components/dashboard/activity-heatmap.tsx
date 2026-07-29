import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import { heatmapDays } from "@/utils/analytics";
import type { Company } from "@/types/domain";
import { formatDate } from "@/utils/format";

export function ActivityHeatmap({ leads }: { leads: Company[] }) {
  const days = heatmapDays(leads);
  return (
    <div className="overflow-x-auto pb-1">
      <div className="grid min-w-[570px] grid-flow-col grid-rows-7 gap-1">
        {days.map((day) => (
          <Tooltip key={day.key} content={`${formatDate(day.date)} · ${day.value} лидов`}>
            <span className={cn("h-[13px] w-[13px] rounded-[3px] ring-1 ring-inset", day.intensity === 0 ? "bg-slate-100 ring-slate-200/40" : day.intensity < 0.34 ? "bg-violet-200 ring-violet-300/50" : day.intensity < 0.67 ? "bg-violet-400 ring-violet-500/30" : "bg-violet-600 ring-violet-700/30")} />
          </Tooltip>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-slate-400"><span className="mr-1">Меньше</span><span className="h-2.5 w-2.5 rounded-sm bg-slate-100" /><span className="h-2.5 w-2.5 rounded-sm bg-violet-200" /><span className="h-2.5 w-2.5 rounded-sm bg-violet-400" /><span className="h-2.5 w-2.5 rounded-sm bg-violet-600" /><span className="ml-1">Больше</span></div>
    </div>
  );
}
