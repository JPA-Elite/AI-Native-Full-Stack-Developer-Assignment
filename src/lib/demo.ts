/**
 * Seeded workspace. Shared by the database seed and the sign-in screen so the
 * demo credentials reviewers see are the ones that actually exist.
 */
export const DEMO_PASSWORD = "demo1234";

export const DEMO_ACCOUNTS = [
  {
    id: "usr_ada",
    name: "Ada Lovelace",
    email: "ada@ajaia.dev",
    color: "#2c6a51",
    title: "Owner of 2 docs",
  },
  {
    id: "usr_grace",
    name: "Grace Hopper",
    email: "grace@ajaia.dev",
    color: "#3f5d8a",
    title: "Editor on shared docs",
  },
  {
    id: "usr_linus",
    name: "Linus Torvalds",
    email: "linus@ajaia.dev",
    color: "#8a4a3f",
    title: "Viewer + owner",
  },
] as const;
