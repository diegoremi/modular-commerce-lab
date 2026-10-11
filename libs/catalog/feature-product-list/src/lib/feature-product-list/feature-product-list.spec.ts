import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductService } from '@modular-commerce-lab/data-access';
import { Product } from '@modular-commerce-lab/catalog/models';
import { finalize, Observable, of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { FeatureProductList } from './feature-product-list';

const keyboard: Product = {
  id: 'keyboard',
  name: 'Teclado',
  price: 42.5,
  category: 'Accesorios',
  available: true,
};
const monitor: Product = {
  id: 'monitor',
  name: 'Monitor',
  price: 199,
  category: 'Pantallas',
  available: false,
};

describe('FeatureProductList', () => {
  let fixture: ComponentFixture<FeatureProductList>;
  const searchProducts = vi.fn<(query: string) => Observable<Product[]>>();

  beforeEach(async () => {
    searchProducts.mockReset().mockReturnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [FeatureProductList],
      providers: [{ provide: ProductService, useValue: { searchProducts } }],
    }).compileComponents();
    vi.useFakeTimers();
  });

  afterEach(() => {
    fixture?.destroy();
    vi.useRealTimers();
  });

  function render(products: Observable<Product[]> = of([])) {
    searchProducts.mockReturnValueOnce(products);
    fixture = TestBed.createComponent(FeatureProductList);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function search(query: string) {
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    input.value = query;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function advance(milliseconds = 300) {
    vi.advanceTimersByTime(milliseconds);
    fixture.detectChanges();
  }

  it('should load immediately and render the products supplied by the service', () => {
    const element = render(of([keyboard, monitor]));
    const products = element.querySelectorAll('.product');

    expect(searchProducts).toHaveBeenCalledExactlyOnceWith('');
    expect(products).toHaveLength(2);
    expect(products[0].querySelector('h2')?.textContent).toBe('Teclado');
    expect(products[0].textContent).toContain('Accesorios');
    expect(products[0].querySelector('.price')?.textContent).toContain(
      '$42.50',
    );
    expect(products[0].textContent).toContain('Disponible');
    expect(products[1].textContent).toContain('No disponible');
  });

  it('should debounce typing and search only after 300 ms of inactivity', () => {
    render();
    search('te');
    advance(200);
    search('teclado');
    advance(299);
    expect(searchProducts).toHaveBeenCalledTimes(1);

    advance(1);
    expect(searchProducts).toHaveBeenCalledTimes(2);
    expect(searchProducts).toHaveBeenLastCalledWith('teclado');
  });

  it('should ignore consecutive equivalent queries and reload when cleared', () => {
    render();
    search('Teclado');
    advance();
    search('  TECLADO  ');
    advance();
    expect(searchProducts).toHaveBeenCalledTimes(2);

    search('');
    advance();
    expect(searchProducts).toHaveBeenCalledTimes(3);
    expect(searchProducts).toHaveBeenLastCalledWith('');
  });

  it('should show loading, then the response, without showing an empty state while loading', () => {
    const response = new Subject<Product[]>();
    const element = render(response);
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'Cargando',
    );
    expect(element.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(element.textContent).not.toContain('No se encontraron productos.');

    response.next([keyboard]);
    fixture.detectChanges();
    expect(element.querySelector('[role="status"]')).toBeNull();
    expect(element.querySelectorAll('.product')).toHaveLength(1);
  });

  it('should cancel the previous request with switchMap and ignore its late response', () => {
    const previous = new Subject<Product[]>();
    const latest = new Subject<Product[]>();
    const cancelled = vi.fn();
    const element = render();
    searchProducts.mockReturnValueOnce(previous.pipe(finalize(cancelled)));
    searchProducts.mockReturnValueOnce(latest);

    search('teclado');
    advance();
    expect(cancelled).not.toHaveBeenCalled();
    search('monitor');
    advance();
    expect(cancelled).toHaveBeenCalledOnce();
    expect(element.querySelector('[role="status"]')).not.toBeNull();

    latest.next([monitor]);
    previous.next([keyboard]);
    fixture.detectChanges();
    expect(element.querySelectorAll('.product')).toHaveLength(1);
    expect(element.querySelector('.product h2')?.textContent).toBe('Monitor');
    expect(element.textContent).not.toContain('Teclado');
  });

  it('should cancel on typing and ignore a response arriving before the new debounce expires', () => {
    const previous = new Subject<Product[]>();
    const latest = new Subject<Product[]>();
    const cancelled = vi.fn();
    const element = render();
    searchProducts.mockReturnValueOnce(previous.pipe(finalize(cancelled)));
    searchProducts.mockReturnValueOnce(latest);

    search('teclado');
    advance();
    search('monitor');
    expect(cancelled).toHaveBeenCalledOnce();
    expect(searchProducts).toHaveBeenCalledTimes(2);
    expect(element.querySelector('[role="status"]')?.textContent).toContain(
      'Esperando',
    );

    advance(150);
    previous.next([keyboard]);
    fixture.detectChanges();
    expect(element.querySelectorAll('.product')).toHaveLength(0);
    expect(element.textContent).not.toContain('Teclado');
    expect(searchProducts).toHaveBeenCalledTimes(2);

    advance(150);
    expect(searchProducts).toHaveBeenLastCalledWith('monitor');
    latest.next([monitor]);
    fixture.detectChanges();
    expect(element.querySelector('.product h2')?.textContent).toBe('Monitor');
  });

  it('should show an empty state when no products match', () => {
    const element = render(of([]));
    expect(element.querySelectorAll('.product')).toHaveLength(0);
    expect(element.textContent).toContain('No se encontraron productos.');
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('should recover on the next search after a request fails', () => {
    const element = render(throwError(() => new Error('Service unavailable')));
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudieron cargar',
    );
    expect(element.textContent).not.toContain('No se encontraron productos.');

    searchProducts.mockReturnValueOnce(of([keyboard]));
    search('teclado');
    advance();
    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.querySelector('.product h2')?.textContent).toBe('Teclado');
  });

  it('should unsubscribe from the active request when the component is destroyed', () => {
    const response = new Subject<Product[]>();
    const cancelled = vi.fn();
    render(response.pipe(finalize(cancelled)));
    fixture.destroy();
    expect(cancelled).toHaveBeenCalledOnce();
  });
});
