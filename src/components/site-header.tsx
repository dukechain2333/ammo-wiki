"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { REPO_URL } from "@/lib/site";
import { GitHubIcon, Logo, MenuIcon, SearchIcon } from "./icons";

const NAV = [
  { href: "/", label: "Catalog" },
  { href: "/calibers", label: "Calibers" },
  { href: "/brands", label: "Brands" },
  { href: "/sources", label: "Sources" },
  { href: "/contribute", label: "Contribute" },
];

const isCurrent = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" || pathname.startsWith("/loads/") : pathname.startsWith(href);

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="wrap" style={{ position: "relative" }}>
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <Logo />
          <span className="brand-word">AMMO WIKI</span>
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-label="Menu"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <MenuIcon size={20} />
        </button>
        <nav id="site-nav" aria-label="Main" className="nav" data-open={open}>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isCurrent(pathname, n.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        {pathname !== "/" && (
          <form action="/" method="get" role="search" className="header-search">
            <SearchIcon />
            <label htmlFor="header-q" className="sr-only">
              Search loads
            </label>
            <input id="header-q" name="q" type="search" placeholder="Search loads" />
          </form>
        )}
        <a href={REPO_URL} className="header-gh" style={pathname === "/" ? { marginLeft: "auto" } : undefined}>
          <GitHubIcon />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
}
