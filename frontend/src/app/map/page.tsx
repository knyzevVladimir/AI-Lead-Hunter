"use client";

import dynamic from "next/dynamic";
import { Map } from "lucide-react";
import Reveal from "@/components/motion/Reveal";

/* ------------------------------------------------------------------ */
/* Leaflet needs `window`, so the map component is always client-only. */
/* Keep ssr: false to avoid the "window is not defined" error.          */
/* ------------------------------------------------------------------ */
const LeadsMap = dynamic(() => import("@/components/LeadsMap"), {
  ssr: false,
  loading: () => (
    // Skeleton that matches the card height so the layout doesn't jump
    <div
      className="card relative overflow-hidden"
      style={{ height: "calc(100vh - 13rem)" }}
      aria-label="Карта загружается"
    >
      {/* Travelling shimmer */}
      <div className="skeleton absolute inset-0" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <span className="animate-pulse-ring absolute h-12 w-12 rounded-full bg-brand-500/20" />
        <Map className="relative h-6 w-6 text-brand-500/70 animate-float" />
        <p className="relative text-sm text-muted">Загрузка карты…</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div className="space-y-4">
      {/* Page header — same presence as other pages */}
      <Reveal from="up" blur>
        <div>
          <h1 className="page-title">Карта лидов</h1>
          <p className="page-subtitle">
            Компании на карте. Красные — без сайта (горячие лиды), зелёные — с
            сайтом. Размер маркера отражает AI-оценку.
          </p>
        </div>
      </Reveal>

      <LeadsMap />
    </div>
  );
}
