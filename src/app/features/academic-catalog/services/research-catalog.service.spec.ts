import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { provideAppMockConfig } from '../../../core/mocks/mock.config';
import { DATA_LAYER_PROVIDERS } from '../../../core/api/data-layer.providers';
import { API_ENDPOINTS } from '../../../core/api/api-endpoints';
import { ResearchCatalogService } from './research-catalog.service';

describe('ResearchCatalogService', () => {
  it('uses session mock for research catalog', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideAppMockConfig({ researchCatalog: true }),
        ...DATA_LAYER_PROVIDERS,
        ResearchCatalogService,
      ],
    });
    const service = TestBed.inject(ResearchCatalogService);

    service.getResearchCatalog().subscribe((catalog) => {
      expect(catalog.length).toBeGreaterThan(0);
      expect(catalog[0]?.line).toBeTruthy();
      expect(catalog[0]?.areas).toBeInstanceOf(Array);
    });
  });

  it('builds the HTTP catalog URL', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAppMockConfig({ researchCatalog: false }),
        ...DATA_LAYER_PROVIDERS,
        ResearchCatalogService,
      ],
    });
    const service = TestBed.inject(ResearchCatalogService);
    const http = TestBed.inject(HttpTestingController);

    service.getResearchCatalog().subscribe();

    const req = http.expectOne(API_ENDPOINTS.researchCatalog);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
    http.verify();
  });
});
