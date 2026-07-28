"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { LatLngBounds } from "leaflet";
import { ExternalLink, AlertCircle } from "lucide-react";
import { listLeads } from "@/lib/api";
import type { Company } from "@/lib/types";
import ScoreBadge from "@/components/ScoreBadge";
import AnimatedNumber from "@/components/motion/AnimatedNumber";

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const MOSCOW: [number, number] = [55.75, 37.61];
const DEFAULT_ZOOM = 10;

// CartoDB dark basemap tiles — visually consistent with the app's dark navy theme.
const CARTO_DARK_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
  '&copy; <a href="https://carto.com/attributions">CARTO</a>';

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

// Company is "geolocated" only if both lat and lng are present.
type GeoCompany = Company & { lat: number; lng: number };

function hasCoords(c: Company): c is GeoCompany {
  return typeof c.lat === "number" && typeof c.lng === "number";
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

/**
 * Map an AI score (0–100) to a marker radius (4–11 px).
 *
 * Leaflet sizes circle markers in screen pixels, so this range has to stay
 * tight: leads cluster heavily by city, and anything larger merges neighbouring
 * halos into one unreadable blob at country-level zoom.
 */
function scoreToRadius(score: number | null | undefined): number {
  const v = score ?? 40;
  return 4 + (v / 100) * 7;
}

/* ------------------------------------------------------------------ */
/* FitBounds — inner map controller                                     */
/* ------------------------------------------------------------------ */

/** When data loads, fit the map viewport to the markers' bounds. */
function FitBounds({ points }: { points: GeoCompany[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
      return;
    }
    const bounds = new LatLngBounds(
      points.map((p) => [p.lat, p.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

/* ------------------------------------------------------------------ */
/* Dark-theme style injection for Leaflet chrome                        */
/* ------------------------------------------------------------------ */

/**
 * Leaflet's popup and zoom controls use their own DOM and can't be
 * targeted by Tailwind. We inject a scoped <style> block that is
 * rendered by the component itself so it stays self-contained and
 * doesn't touch globals.css.
 */
function LeafletDarkStyles() {
  return (
    <style>{`
      /* Popup container */
      .leaflet-popup-content-wrapper {
        background: #0f1528;
        color: #e7ecf5;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 12px;
        box-shadow: 0 12px 40px -12px rgba(0,0,0,0.9),
                    0 0 0 1px rgba(59,108,255,0.18);
        padding: 0;
      }
      .leaflet-popup-content {
        margin: 0;
      }
      /* The little triangle tip */
      .leaflet-popup-tip {
        background: #0f1528;
        border: 1px solid rgba(255,255,255,0.10);
      }
      /* Zoom controls */
      .leaflet-bar {
        border: 1px solid rgba(255,255,255,0.10) !important;
        border-radius: 10px !important;
        overflow: hidden;
        box-shadow: 0 4px 20px -8px rgba(0,0,0,0.8) !important;
      }
      .leaflet-control-zoom a {
        background: rgba(15,21,40,0.92) !important;
        color: #8892b0 !important;
        border-bottom: 1px solid rgba(255,255,255,0.08) !important;
        backdrop-filter: blur(12px);
        transition: background 0.15s, color 0.15s;
      }
      .leaflet-control-zoom a:hover {
        background: rgba(59,108,255,0.18) !important;
        color: #fff !important;
      }
      .leaflet-control-zoom-in {
        border-radius: 10px 10px 0 0 !important;
      }
      .leaflet-control-zoom-out {
        border-radius: 0 0 10px 10px !important;
        border-bottom: none !important;
      }
      /* Attribution */
      .leaflet-control-attribution {
        background: rgba(11,16,32,0.72) !important;
        color: rgba(136,146,176,0.7) !important;
        backdrop-filter: blur(8px);
        border-radius: 8px 0 0 0;
        font-size: 10px;
      }
      .leaflet-control-attribution a {
        color: rgba(92,140,255,0.8) !important;
      }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/* Floating stats overlay                                               */
/* ------------------------------------------------------------------ */

interface StatsOverlayProps {
  total: number;
  plotted: number;
  noWebsite: number;
}

/**
 * Glass panel overlaid on the top-right of the map.
 * Animated counts communicate that the data just loaded.
 */
function StatsOverlay({ total, plotted, noWebsite }: StatsOverlayProps) {
  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2.5 rounded-xl border border-white/10 bg-panel/80 p-3.5 shadow-lift backdrop-blur-xl">
      {/* Legend */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
        Легенда
      </p>
      <div className="space-y-1.5">
        <span className="flex items-center gap-2 text-xs text-white/80">
          <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-red-500/20 ring-2 ring-red-500/50">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          </span>
          Нет сайта
        </span>
        <span className="flex items-center gap-2 text-xs text-white/80">
          <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full bg-green-500/20 ring-2 ring-green-500/50">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          </span>
          Есть сайт
        </span>
      </div>

      <div className="my-0.5 h-px bg-white/8" />

      {/* Animated stat cells */}
      <div className="space-y-1.5">
        <StatCell label="На карте" value={plotted} suffix={` / ${total}`} />
        <StatCell label="Без сайта" value={noWebsite} hot />
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  suffix,
  hot,
}: {
  label: string;
  value: number;
  suffix?: string;
  hot?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[10px] text-muted">{label}</span>
      <span
        className={hot ? "text-xs font-bold text-red-400" : "text-xs font-bold text-white"}
      >
        <AnimatedNumber value={value} duration={900} />
        {suffix && (
          <span className="font-normal text-muted">{suffix}</span>
        )}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export default function LeadsMap() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["leads", "map"],
    queryFn: () => listLeads({ limit: 500 }),
  });

  const points = useMemo(
    () => (data?.items ?? []).filter(hasCoords),
    [data]
  );

  const noWebsiteCount = useMemo(
    () => points.filter((c) => !c.website).length,
    [points]
  );

  // Map fills available space below the page header (~13 rem of surrounding chrome)
  const mapHeight = "calc(100vh - 13rem)";

  /* ---------------------------------------------------------------- */
  /* Loading state                                                     */
  /* ---------------------------------------------------------------- */
  if (isLoading) {
    return (
      <div
        className="card relative overflow-hidden"
        style={{ height: mapHeight }}
        aria-label="Загрузка компаний"
      >
        <div className="skeleton absolute inset-0" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            {/* Radar sweep communicates "scanning" */}
            <div className="relative h-14 w-14">
              <span className="absolute inset-0 rounded-full border border-brand-500/30" />
              <span className="absolute inset-1.5 rounded-full border border-brand-500/20" />
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-brand-500/10 animate-pulse-ring"
              />
              <span
                aria-hidden
                className="absolute inset-0 origin-center animate-radar-sweep"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(59,108,255,0.45), transparent 40%)",
                  borderRadius: "50%",
                }}
              />
            </div>
            <p className="text-sm text-muted">Загрузка компаний…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Error state                                                       */
  /* ---------------------------------------------------------------- */
  if (isError) {
    return (
      <div
        className="card flex flex-col items-center justify-center gap-3"
        style={{ height: mapHeight }}
      >
        <AlertCircle className="h-8 w-8 text-red-400/70" />
        <p className="text-sm text-red-300">
          Не удалось загрузить данные для карты.
        </p>
        <p className="text-xs text-muted">
          Проверьте соединение и перезагрузите страницу.
        </p>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Map                                                               */
  /* ---------------------------------------------------------------- */
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/10"
      style={{ height: mapHeight }}
    >
      {/* Floating stats panel — positioned inside the map container */}
      <StatsOverlay
        total={data?.total ?? 0}
        plotted={points.length}
        noWebsite={noWebsiteCount}
      />

      {/* Inject dark-theme overrides for Leaflet's own DOM */}
      <LeafletDarkStyles />

      <MapContainer
        center={MOSCOW}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", background: "#0b1020" }}
      >
        {/* Dark basemap — visually integrated with the navy app theme */}
        <TileLayer
          attribution={CARTO_ATTRIBUTION}
          url={CARTO_DARK_URL}
          subdomains="abcd"
          maxZoom={20}
        />

        <FitBounds points={points} />

        {points.map((c) => {
          const hot = !c.website;
          // Hot leads (no website) are red — the primary sales opportunity signal
          const coreColor = hot ? "#ef4444" : "#22c55e";
          const haloColor = hot
            ? "rgba(239,68,68,0.18)"
            : "rgba(34,197,94,0.15)";
          const radius = scoreToRadius(c.ai_score);

          return (
            // Two layered CircleMarkers simulate a "radar contact" look:
            // an outer translucent halo + a solid inner core.
            // React-leaflet renders the halo first so the core sits on top.
            <CircleMarker
              key={`halo-${c.id}`}
              center={[c.lat, c.lng]}
              // Halo is 2× the core radius — enough to read as a glow while
              // staying small enough that dense city clusters remain legible.
              radius={radius * 2}
              pathOptions={{
                color: coreColor,
                fillColor: haloColor,
                fillOpacity: 1,
                weight: 0,
              }}
            >
              {/* The Popup attaches to the halo so clicking anywhere in the
                  glow ring opens it — better UX on dense maps. */}
              <Popup
                // Offset so the popup tip points at the core centre
                offset={[0, -radius]}
                className="leaflet-popup-dark"
              >
                <div className="min-w-[190px] space-y-1 p-3 text-sm">
                  <div className="font-semibold leading-tight text-white">
                    {c.name}
                  </div>
                  {c.category && (
                    <div className="text-xs text-muted">{c.category}</div>
                  )}
                  {c.city && (
                    <div className="text-xs text-muted">{c.city}</div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted">AI-оценка:</span>
                    <ScoreBadge score={c.ai_score} />
                  </div>
                  {c.website ? (
                    <a
                      href={c.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 pt-0.5 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Сайт <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
                      Нет сайта
                    </span>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Solid core markers rendered on top of the halos */}
        {points.map((c) => {
          const hot = !c.website;
          const coreColor = hot ? "#ef4444" : "#22c55e";
          const radius = scoreToRadius(c.ai_score);

          return (
            <CircleMarker
              key={`core-${c.id}`}
              center={[c.lat, c.lng]}
              radius={radius}
              // Non-interactive so clicks fall through to the halo's Popup
              interactive={false}
              pathOptions={{
                color: coreColor,
                fillColor: coreColor,
                fillOpacity: 0.85,
                weight: 1.5,
              }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
