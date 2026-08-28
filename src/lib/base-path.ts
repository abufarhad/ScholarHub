/**
 * GitHub Pages project sites (username.github.io/repo-name) serve everything
 * under a `/repo-name` path prefix. `next/link` and `next/image` pick up
 * `basePath` from next.config.ts automatically, but a raw `fetch()` for a
 * static asset (our exported JSON data files) does not — call sites for
 * those must prepend this manually.
 */
export function withBasePath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (!path.startsWith("/")) return `${basePath}/${path}`;
  return `${basePath}${path}`;
}
