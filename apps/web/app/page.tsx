import Link from "next/link";
import { ComparisonBrowse } from "./comparison-browse";

export default function Home() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Student housing, made clearer</p>
        <h1>Choose your next home with more confidence.</h1>
        <p>Explore side by side comparisons of rent, bills, room type and contract details.</p>
        <div className="actions">
          <a className="button" href="#comparisons">Explore comparisons</a>
          <Link href="/how-it-works">See how it works</Link>
        </div>
      </section>
      <ComparisonBrowse />
    </>
  );
}
