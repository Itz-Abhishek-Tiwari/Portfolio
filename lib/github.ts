// Public GitHub data shown on the site and in the studio's Connections tab.
export type GithubData = {
  profile: { login: string; name: string; repos: number };
  repositories: {
    id: number;
    name: string;
    description: string;
    language: string;
    stars: number;
    url: string;
  }[];
  syncedAt: string;
  /** True when GitHub was unreachable and this is the last saved sync. */
  stale: boolean;
};
