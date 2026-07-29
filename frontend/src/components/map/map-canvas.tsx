"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { LatLngBounds } from "leaflet";
import { CircleMarker, MapContainer, TileLayer, Tooltip as LeafletTooltip, useMap, useMapEvents } from "react-leaflet";
import type { Company } from "@/types/domain";

type GeoCompany = Company & { lat: number; lng: number };
interface Cluster { id: string; lat: number; lng: number; companies: GeoCompany[]; bounds: LatLngBounds }

export function MapCanvas({ companies, selectedId, onSelect }: { companies: GeoCompany[]; selectedId: number | null; onSelect: (company: Company) => void }) {
  const center: [number, number] = companies.length ? [companies[0].lat, companies[0].lng] : [55.75, 37.61];
  return (
    <MapContainer center={center} zoom={10} minZoom={3} maxZoom={18} scrollWheelZoom className="h-full w-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitCompanies companies={companies} />
      <FocusCompany companies={companies} selectedId={selectedId} />
      <ClusterLayer companies={companies} selectedId={selectedId} onSelect={onSelect} />
    </MapContainer>
  );
}

function FitCompanies({ companies }: { companies: GeoCompany[] }) {
  const map = useMap();
  useEffect(() => {
    if (!companies.length) return;
    if (companies.length === 1) { map.flyTo([companies[0].lat, companies[0].lng], 14, { duration: 0.7 }); return; }
    map.fitBounds(new LatLngBounds(companies.map((company) => [company.lat, company.lng])), { padding: [70, 70], maxZoom: 13 });
  }, [companies, map]);
  return null;
}

function FocusCompany({ companies, selectedId }: { companies: GeoCompany[]; selectedId: number | null }) {
  const map = useMap();
  useEffect(() => {
    const selected = companies.find((company) => company.id === selectedId);
    if (selected) map.flyTo([selected.lat, selected.lng], Math.max(map.getZoom(), 14), { duration: 0.65 });
  }, [companies, selectedId, map]);
  return null;
}

function ClusterLayer({ companies, selectedId, onSelect }: { companies: GeoCompany[]; selectedId: number | null; onSelect: (company: Company) => void }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()), moveend: () => setZoom(map.getZoom()) });
  const clusters = useMemo(() => clusterCompanies(companies, zoom), [companies, zoom]);

  return <>{clusters.map((cluster) => {
    if (cluster.companies.length === 1) {
      const company = cluster.companies[0];
      const selected = company.id === selectedId;
      const color = !company.website ? "#f43f5e" : (company.ai_score ?? 0) >= 70 ? "#8b5cf6" : company.monitored ? "#06b6d4" : "#10b981";
      return <CircleMarker key={cluster.id} center={[company.lat, company.lng]} radius={selected ? 11 : 7} pathOptions={{ color: selected ? "#0f172a" : "#fff", fillColor: color, fillOpacity: 0.95, weight: selected ? 4 : 2 }} eventHandlers={{ click: () => onSelect(company) }}><LeafletTooltip direction="top" offset={[0, -8]} opacity={1}><div className="min-w-36 p-0.5"><p className="text-xs font-semibold text-slate-900">{company.name}</p><p className="text-[10px] text-slate-500">{company.category || "Без категории"} · AI {company.ai_score ?? "—"}</p></div></LeafletTooltip></CircleMarker>;
    }
    const hot = cluster.companies.filter((company) => !company.website).length;
    const radius = Math.min(24, 10 + Math.log2(cluster.companies.length) * 3.5);
    return <CircleMarker key={cluster.id} center={[cluster.lat, cluster.lng]} radius={radius} pathOptions={{ color: "#fff", fillColor: hot / cluster.companies.length > 0.5 ? "#e11d48" : "#7c3aed", fillOpacity: 0.9, weight: 3 }} eventHandlers={{ click: () => map.fitBounds(cluster.bounds, { padding: [80, 80], maxZoom: 16 }) }}><LeafletTooltip permanent direction="center" className="cluster-count"><span className="font-bold text-white">{cluster.companies.length}</span></LeafletTooltip></CircleMarker>;
  })}</>;
}

function clusterCompanies(companies: GeoCompany[], zoom: number): Cluster[] {
  if (zoom >= 16) return companies.map((company) => ({ id: `company-${company.id}`, lat: company.lat, lng: company.lng, companies: [company], bounds: new LatLngBounds([[company.lat, company.lng]]) }));
  const cell = 40 / 2 ** zoom;
  const groups = new Map<string, GeoCompany[]>();
  companies.forEach((company) => {
    const key = `${Math.floor(company.lat / cell)}:${Math.floor(company.lng / cell)}`;
    groups.set(key, [...(groups.get(key) ?? []), company]);
  });
  return [...groups.entries()].map(([id, entries]) => ({ id, lat: entries.reduce((sum, company) => sum + company.lat, 0) / entries.length, lng: entries.reduce((sum, company) => sum + company.lng, 0) / entries.length, companies: entries, bounds: new LatLngBounds(entries.map((company) => [company.lat, company.lng])) }));
}
