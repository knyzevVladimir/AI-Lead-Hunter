"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { LatLngBounds } from "leaflet";
import { Loader2, ExternalLink } from "lucide-react";
import { listLeads } from "@/lib/api";
import type { Company } from "@/lib/types";
import ScoreBadge from "@/components/ScoreBadge";

const MOSCOW: [number, number] = [55.75, 37.61];
const DEFAULT_ZOOM = 10;

// Company is "geolocated" only if both lat and lng are present.
type GeoCompany = Company & { lat: number; lng: number };

function hasCoords(c: Company): c is GeoCompany {
  return typeof c.lat === "number" && typeof c.lng === "number";
}

/** When data loads, fit the map to the markers' bounds. */
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

export default function LeadsMap() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["leads", "map"],
    queryFn: () => listLeads({ limit: 500 }),
  });

  const points = useMemo(
    () => (data?.items ?? []).filter(hasCoords),
    [data]
  );

  const height = "calc(100vh - 12rem)";

  if (isLoading) {
    return (
      <div
        className="card flex items-center justify-center gap-3 text-muted"
        style={{ height }}
      >
        <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
        Загрузка компаний…
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="card flex items-center justify-center text-sm text-rose-600"
        style={{ height }}
      >
        Не удалось загрузить данные для карты.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Legend + counter */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-rose-500 ring-2 ring-rose-200" />
          Нет сайта
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          Есть сайт
        </span>
        <span className="ml-auto">
          На карте: {points.length} из {data?.total ?? 0}
        </span>
      </div>

      <div
        className="overflow-hidden rounded-xl border border-line shadow-card"
        style={{ height }}
      >
        <MapContainer
          center={MOSCOW}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          style={{ height: "100%", width: "100%", background: "#f6f7f9" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds points={points} />

          {points.map((c) => {
            const hot = !c.website;
            const color = hot ? "#ef4444" : "#22c55e";
            return (
              <CircleMarker
                key={c.id}
                center={[c.lat, c.lng]}
                radius={8}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.7,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="min-w-[180px] space-y-1 text-sm">
                    <div className="font-semibold text-gray-900">
                      {c.name}
                    </div>
                    {c.category && (
                      <div className="text-xs text-gray-600">
                        {c.category}
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-gray-600">AI:</span>
                      <ScoreBadge score={c.ai_score} />
                    </div>
                    {c.website ? (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600"
                      >
                        Сайт <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-xs font-medium text-red-600">
                        Нет сайта
                      </span>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
