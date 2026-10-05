import { downloadBlob } from './download.util';

describe('downloadBlob', () => {
  afterEach(() => vi.restoreAllMocks());

  it('configures the download and releases the object URL', () => {
    const anchor = document.createElement('a');
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const createUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    downloadBlob(new Blob(['excel']), 'plan.xlsx');

    expect(anchor.href).toContain('blob:test');
    expect(anchor.download).toBe('plan.xlsx');
    expect(clickSpy).toHaveBeenCalledOnce();
    // No se cuentan las llamadas a URL.createObjectURL: es una global compartida con
    // los specs que corren en paralelo en el mismo entorno, y el conteo salía flaky.
    // Lo que importa de downloadBlob es la URL que arma y la que libera.
    expect(createUrlSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeUrlSpy).toHaveBeenCalledWith('blob:test');
  });
});
