import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap">
      <section className="section" style={{ paddingBottom: 96 }}>
        <div className="eyebrow">404</div>
        <h1 style={{ fontSize: 44 }}>No such page</h1>
        <p className="lede">
          The load may have been renamed, or it isn’t in the wiki yet. <Link href="/">Search the catalog</Link> or{" "}
          <Link href="/contribute">add it</Link>.
        </p>
      </section>
    </div>
  );
}
