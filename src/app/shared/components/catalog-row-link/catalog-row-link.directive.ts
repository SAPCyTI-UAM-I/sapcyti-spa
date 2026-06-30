import { Directive } from '@angular/core';

/**
 * Shared styling for the primary name link in catalog list rows. Applied to an
 * `<a>` that already carries its own `[routerLink]`, so the long, identical
 * Tailwind class string lives in one place instead of being copied per list.
 */
@Directive({
  selector: 'a[appCatalogRowLink]',
  host: {
    class:
      'text-primary hover:text-primary-hover active:text-primary-hover text-h3 md:text-body-md -mx-xs px-xs py-xs max-md:-mx-sm max-md:px-sm max-md:py-sm hover:bg-primary-container active:bg-primary-container focus-visible:ring-primary inline-block w-fit cursor-pointer rounded-sm font-bold underline underline-offset-2 transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:underline max-md:block max-md:w-full md:font-medium md:no-underline',
  },
})
export class CatalogRowLinkDirective {}
