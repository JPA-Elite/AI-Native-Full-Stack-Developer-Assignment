/**
 * Seeded workspace members, shared by the database seed and the sign-in screen
 * so the accounts reviewers see are the ones that actually exist.
 *
 * The demo password deliberately lives in `seed.ts` instead: this module is
 * imported by client components, and a credential has no business being
 * shipped in a browser bundle.
 */
export const DEMO_ACCOUNTS = [
  {
    id: "usr_ada",
    name: "Ada Lovelace",
    email: "ada@ajaia.dev",
    color: "#2c6a51",
  },
  {
    id: "usr_grace",
    name: "Grace Hopper",
    email: "grace@ajaia.dev",
    color: "#3f5d8a",
  },
  {
    id: "usr_linus",
    name: "Linus Torvalds",
    email: "linus@ajaia.dev",
    color: "#8a4a3f",
  },
] as const;
