import { ActivatedRouteSnapshot } from '@angular/router';

import { buildBreadcrumbTrail } from './breadcrumb';

interface FakeNode {
  url: { path: string }[];
  routeConfig: { data?: Record<string, unknown> } | null;
  firstChild: FakeNode | null;
}

function node(
  path: string,
  data: Record<string, unknown> | null,
  firstChild: FakeNode | null = null,
): FakeNode {
  return {
    url: path ? path.split('/').map((segment) => ({ path: segment })) : [],
    routeConfig: data ? { data } : null,
    firstChild,
  };
}

function trailOf(root: FakeNode) {
  return buildBreadcrumbTrail(root as unknown as ActivatedRouteSnapshot);
}

describe('buildBreadcrumbTrail', () => {
  it('collects crumbs with cumulative urls', () => {
    const root = node(
      '',
      null,
      node('academic-catalog', { breadcrumb: 'CAT' }, node('students', { breadcrumb: 'STU' })),
    );

    expect(trailOf(root)).toEqual([
      { labelKey: 'CAT', url: '/academic-catalog' },
      { labelKey: 'STU', url: '/academic-catalog/students' },
    ]);
  });

  it('joins multi-segment route paths into one url', () => {
    const root = node('', null, node('students/new', { breadcrumb: 'NEW' }));

    expect(trailOf(root)).toEqual([{ labelKey: 'NEW', url: '/students/new' }]);
  });

  it('returns an empty trail when no route declares a breadcrumb', () => {
    const root = node('', null, node('dashboard', { roles: [] }));

    expect(trailOf(root)).toEqual([]);
  });
});
