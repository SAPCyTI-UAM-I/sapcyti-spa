import { Observable, of, throwError } from 'rxjs';

/**
 * Runs a synchronous mock-store call and returns it as an Observable, surfacing a
 * thrown `HttpErrorResponse` as an `error` notification — mirroring how the HTTP
 * repository would emit. Keeps the mock repositories free of repeated try/catch.
 */
export function fromMockStore<T>(produce: () => T): Observable<T> {
  try {
    return of(produce());
  } catch (error) {
    return throwError(() => error);
  }
}
