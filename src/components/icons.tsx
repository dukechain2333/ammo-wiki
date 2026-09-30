// Stroke icons (24px grid) and the headstamp logo.

type P = { size?: number; className?: string };

export const Logo = ({ size = 30 }: P) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none" aria-hidden="true">
    <circle cx="15" cy="15" r="13.5" stroke="var(--brass)" strokeWidth="2" />
    <circle cx="15" cy="15" r="9" stroke="var(--brass)" strokeWidth="1" strokeDasharray="2 2.2" />
    <circle cx="15" cy="15" r="4" fill="var(--brass)" />
  </svg>
);

const Icon = ({ size = 16, className, children }: P & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {children}
  </svg>
);

export const SearchIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);

export const GitHubIcon = (p: P) => (
  <Icon {...p}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </Icon>
);

export const PencilIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icon>
);

export const MenuIcon = (p: P) => (
  <Icon {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icon>
);

export const SortIcon = ({ dir, ...p }: P & { dir: "asc" | "desc" | null }) => (
  <Icon size={12} {...p}>
    {dir === "asc" ? <path d="m6 15 6-6 6 6" /> : dir === "desc" ? <path d="m6 9 6 6 6-6" /> : <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />}
  </Icon>
);
