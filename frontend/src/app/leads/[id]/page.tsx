import type { Metadata } from "next";
import LeadDetailPage from "@/components/leads/lead-detail-page";

export const metadata: Metadata = { title: "Карточка лида" };

export default function LeadPage({ params }: { params: { id: string } }) {
  return <LeadDetailPage id={Number(params.id)} />;
}
