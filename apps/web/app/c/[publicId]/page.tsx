import { notFound } from "next/navigation";
import Link from "next/link";
import type { PublicOption } from "@evolvaer/contracts";
import { sampleComparisons } from "../../../lib/demo-comparison";

export const metadata = {
  title: "Sample comparison",
  robots: { index: false, follow: false },
};

const billLabels = { included: "Included", excluded: "Excluded", partial: "Partially included" };

function OptionCard({ option }: { option: PublicOption }) {
  const sourceUrl = option.sourceUrl && /^https?:\/\//i.test(option.sourceUrl) ? option.sourceUrl : undefined;
  const heroImage = option.heroImage && /^https?:\/\//i.test(option.heroImage.url) ? option.heroImage : undefined;
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
      <div className="option-media">
        {heroImage ? (
          // Public media must be approved before a URL is added to the public DTO.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage.url} alt={heroImage.alt} />
        ) : (
          <span>Photo unavailable</span>
        )}
      </div>
      <p className="eyebrow">Option {option.side}</p>
      <h2>{option.displayName}</h2>
      <p>{option.area ?? "Not provided"}</p>
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
  const comparison = sampleComparisons.find((item) => item.publicId === publicId);
  if (!comparison) notFound();

  return (
    <div className="comparison-layout">
      <section className="content">
        <p className="eyebrow">Sample comparison</p>
        <h1>{comparison.title}</h1>
        <p>These fictional listings show how rent, bills and room details appear side by side.</p>
        <div className="comparison">
          {comparison.options.map((option) => <OptionCard key={option.side} option={option} />)}
        </div>
      </section>
      <aside className="comparison-sidebar" aria-label="More from Cribwise">
        <section className="sidebar-panel">
          <h2>Other comparisons</h2>
          <p>Explore more fictional examples.</p>
          <ul className="sidebar-links">
            {sampleComparisons.filter((item) => item.publicId !== publicId).map((item) => (
              <li key={item.publicId}>
                <Link href={`/c/${item.publicId}`}>{item.title}</Link>
                <span>{item.options[0].area} · {item.options[1].area}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="sidebar-panel">
          <h2>Using Cribwise</h2>
          <p>Compare confirmed details, spot missing information and decide what matters to you.</p>
          <Link href="/how-it-works">How it works</Link>
        </section>
      </aside>
    </div>
  );
}
