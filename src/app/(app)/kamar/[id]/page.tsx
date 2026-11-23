import { RoomDetailView } from "@/components/kamar/room-detail-view";

export const instant = false;

export const metadata = {
  title: "Detail Kamar",
};

export default async function KamarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RoomDetailView roomId={id} />;
}
