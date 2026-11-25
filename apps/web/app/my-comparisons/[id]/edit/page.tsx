import { EditComparison } from "./edit-comparison";

export const metadata = { title: "Edit comparison", robots: { index: false, follow: false } };

export default async function EditComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditComparison id={id} />;
}
