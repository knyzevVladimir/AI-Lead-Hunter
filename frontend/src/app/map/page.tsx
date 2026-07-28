"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Leaflet needs `window`, so the map is client-only (ssr disabled).
const LeadsMap = dynamic(() => import("@/components/LeadsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] items-center justify-center gap-3 text-muted">
      <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
      Загрузка карты…
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Карта</h1>
        <p className="page-subtitle">
          Компании на карте. Красные — без сайта (горячие лиды), зелёные — с
          сайтом.
        </p>
      </div>
      <LeadsMap />
    </div>
  );
}
