import Link from "next/link";

export const metadata = { title: "How it works" };

export default function HowItWorks() {
  return (
    <section className="content">
      <h1>How it works</h1>
      <ol className="steps">
        <li><strong>Add two listings.</strong> Start with a listing link or a screenshot for each place.</li>
        <li><strong>Check the facts.</strong> Confirm details such as rent, bills and contract length.</li>
        <li><strong>Compare side by side.</strong> See what each place offers and which details are missing.</li>
        <li><strong>Ask people you trust.</strong> Share the comparison and use their feedback to make your decision.</li>
      </ol>
      <Link className="button" href="/c/demo">View a sample comparison</Link>
    </section>
  );
}
