import { LocalComparisonView } from "./local-comparison-view";

export const metadata = { title: "My comparison", robots: { index: false, follow: false } };

export default async function LocalComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LocalComparisonView id={id} />;
}
