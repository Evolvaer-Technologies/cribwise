import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { PublicComparison, PublicOption } from "@evolvaer/contracts";
import { sampleComparisons } from "../../../lib/demo-comparison";
import { getPublicComparison } from "../../../lib/public-comparisons";
import { PhotoGallery } from "./photo-gallery";
import { DemoVote } from "./demo-vote";
import { ShareComparison } from "./share-comparison";

export async function generateMetadata({ params }: { params: Promise<{ publicId: string }> }): Promise<Metadata> {
  const { publicId } = await params;
  const comparison = getPublicComparison(publicId);
  if (!comparison) return { title: "Comparison unavailable", robots: { index: false, follow: false } };

  const description = `Fictional sample: ${comparison.options[0].displayName} and ${comparison.options[1].displayName} on Cribwise.`;
  return {
    title: comparison.title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title: `${comparison.title} | Cribwise`, description, type: "website" },
  };
}

const billLabels = { included: "Included", excluded: "Excluded", partial: "Partially included" };

function ComparisonSummary({ comparison }: { comparison: PublicComparison }) {
  const [a, b] = comparison.options;
  const comparableRent = a.rent && b.rent && a.rent.currency === b.rent.currency && a.rent.period === b.rent.period;
  const cheaper = comparableRent && a.rent!.amount !== b.rent!.amount
    ? a.rent!.amount < b.rent!.amount ? a : b
    : null;
  const difference = comparableRent && cheaper
    ? new Intl.NumberFormat("en-GB", { style: "currency", currency: a.rent!.currency, maximumFractionDigits: 0 }).format(Math.abs(a.rent!.amount - b.rent!.amount))
    : null;

  return (
    <section className="summary-panel" aria-labelledby="summary-title">
      <p className="eyebrow">At a glance</p>
      <h2 id="summary-title">Comparison summary</h2>
      <p>{cheaper && difference
        ? `Option ${cheaper.side} is ${difference} less per ${cheaper.rent!.period} in the supplied figures.`
        : "Comparable rent figures are not available for both options."}</p>
      <p>{a.bills === "included" && b.bills !== "included"
        ? "Option A lists bills as included. Confirm the full cost of Option B."
        : b.bills === "included" && a.bills !== "included"
          ? "Option B lists bills as included. Confirm the full cost of Option A."
          : "Check what each rent figure covers before deciding."}</p>
      <small>Based on the example details shown here. Automated AI analysis will be added when the service is connected.</small>
    </section>
  );
}

function OptionCard({ option }: { option: PublicOption }) {
  const sourceUrl = option.sourceUrl && /^https?:\/\//i.test(option.sourceUrl) ? option.sourceUrl : undefined;
  const photos = (option.gallery ?? []).filter((photo) => photo.url.startsWith("/demo/"));
  const rent = option.rent
    ? `${new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: option.rent.currency,
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }).format(option.rent.amount)} per ${option.rent.period}`
    : "Not provided";

  return (
    <article className="option" data-side={option.side}>
      <PhotoGallery photos={photos} />
      <div className="option-heading">
        <div><p className="option-badge">Option {option.side}</p><h2>{option.displayName}</h2><p>{option.area ?? "Not provided"}</p></div>
        <div className="rent-highlight"><strong>{option.rent ? new Intl.NumberFormat("en-GB", { style: "currency", currency: option.rent.currency, maximumFractionDigits: 0 }).format(option.rent.amount) : "—"}</strong><span>per {option.rent?.period ?? "period"}</span></div>
      </div>
      <dl>
        <div><dt>Rent</dt><dd>{rent}</dd></div>
        <div><dt>Bills</dt><dd>{option.bills ? billLabels[option.bills] : "Not provided"}</dd></div>
        <div><dt>Room</dt><dd>{option.roomType ?? "Not provided"}</dd></div>
        <div><dt>Contract</dt><dd>{option.contractWeeks ? `${option.contractWeeks} weeks` : "Not provided"}</dd></div>
      </dl>
      {sourceUrl && (
        <a className="source-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">
          View original listing
        </a>
      )}
    </article>
  );
}

export default async function ComparisonPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const comparison = getPublicComparison(publicId);
  if (!comparison) notFound();

  return (
    <div className="comparison-layout">
      <section className="content">
        <p className="eyebrow">Sample comparison</p>
        <h1>{comparison.title}</h1>
        <p>These fictional listings show how rent, bills and room details appear side by side.</p>
        <ShareComparison title={comparison.title} publicId={comparison.publicId} />
        <div className="comparison-summary" aria-label="Comparison overview">
          <div><span>Comparing</span><strong>2 places</strong></div>
          <div><span>Weekly rent gap</span><strong>{comparison.options.every((option) => option.rent?.period === "week") ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(Math.abs(comparison.options[0].rent!.amount - comparison.options[1].rent!.amount)) : "Not provided"}</strong></div>
          <div><span>Listing sources</span><strong>Not provided</strong></div>
        </div>
        <div className="comparison">
          {comparison.options.map((option) => <OptionCard key={option.side} option={option} />)}
        </div>
        <ComparisonSummary comparison={comparison} />
        <DemoVote publicId={comparison.publicId} />
        <div className="decision-note"><strong>Before you decide</strong><p>Confirm missing details with the accommodation provider. Rent alone does not show the full cost of a tenancy.</p></div>
      </section>
      <aside className="comparison-sidebar" aria-label="More from Cribwise">
        <section className="sidebar-panel">
          <h2>At a glance</h2>
          <ul className="sidebar-facts">
            <li><span>Places</span><strong>2</strong></li>
            <li><span>Area A</span><strong>{comparison.options[0].area ?? "Not provided"}</strong></li>
            <li><span>Area B</span><strong>{comparison.options[1].area ?? "Not provided"}</strong></li>
          </ul>
        </section>
        <section className="sidebar-panel">
          <h2>Other comparisons</h2>
          <p>Explore more fictional examples.</p>
          <ul className="sidebar-links">
            {sampleComparisons.filter((item) => item.publicId !== publicId).slice(0, 3).map((item) => (
              <li key={item.publicId}>
                <Link href={`/c/${item.publicId}`}>{item.title}</Link>
                <span>{item.options[0].displayName} vs {item.options[1].displayName}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="sidebar-panel">
          <h2>Before you choose</h2>
          <ul className="sidebar-checklist">
            <li>Check total costs, including bills and deposit.</li>
            <li>Confirm contract dates and cancellation terms.</li>
            <li>Open the original listing when a source is available.</li>
          </ul>
          <Link href="/how-it-works">How it works</Link>
        </section>
      </aside>
    </div>
  );
}
