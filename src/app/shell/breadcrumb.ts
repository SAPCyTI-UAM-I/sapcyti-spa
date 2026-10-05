import { ActivatedRouteSnapshot } from '@angular/router';

/** A single crumb in the top-bar breadcrumb. */
export interface BreadcrumbItem {
  labelKey: string;
  url: string;
}

/**
 * Walks the activated route tree from `root` downwards and collects one crumb per
 * route that declares a `breadcrumb` label key in its static `data`, building the
 * cumulative URL for each segment (kept for potential future use; crumbs render
 * as read-only labels in the shell). The home crumb is added by the view.
 */
export function buildBreadcrumbTrail(root: ActivatedRouteSnapshot): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = [];
  let url = '';
  let node: ActivatedRouteSnapshot | null = root;

  while (node) {
    const path = node.url.map((segment) => segment.path).join('/');
    if (path) {
      url += `/${path}`;
    }

    const labelKey = node.routeConfig?.data?.['breadcrumb'] as string | undefined;
    if (labelKey) {
      trail.push({ labelKey, url });
    }

    node = node.firstChild;
  }

  return trail;
}
