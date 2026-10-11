import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductService } from '@modular-commerce-lab/data-access';
import { Product } from '@modular-commerce-lab/catalog/models';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { FeatureProductList } from './feature-product-list';

describe('FeatureProductList', () => {
  let fixture: ComponentFixture<FeatureProductList>;
  const getProducts = vi.fn<() => Observable<Product[]>>();

  beforeEach(async () => {
    getProducts.mockReset();
    await TestBed.configureTestingModule({
      imports: [FeatureProductList],
      providers: [{ provide: ProductService, useValue: { getProducts } }],
    }).compileComponents();
  });

  async function render(products: Observable<Product[]>) {
    getProducts.mockReturnValue(products);
    fixture = TestBed.createComponent(FeatureProductList);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('should render the products supplied by the service', async () => {
    const element = await render(
      of([
        {
          id: 'keyboard',
          name: 'Teclado',
          price: 42.5,
          category: 'Accesorios',
          available: true,
        },
        {
          id: 'monitor',
          name: 'Monitor',
          price: 199,
          category: 'Pantallas',
          available: false,
        },
      ]),
    );

    const products = element.querySelectorAll('.product');
    expect(getProducts).toHaveBeenCalledOnce();
    expect(products).toHaveLength(2);
    expect(products[0].querySelector('h2')?.textContent).toBe('Teclado');
    expect(products[0].textContent).toContain('Accesorios');
    expect(products[0].querySelector('.price')?.textContent).toContain(
      '$42.50',
    );
    expect(products[0].textContent).toContain('Disponible');
    expect(products[1].querySelector('h2')?.textContent).toBe('Monitor');
    expect(products[1].textContent).toContain('No disponible');
  });

  it('should show an empty state when the service returns no products', async () => {
    const element = await render(of([]));

    expect(element.querySelectorAll('.product')).toHaveLength(0);
    expect(element.textContent).toContain('No hay productos disponibles.');
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('should show an error when the service fails', async () => {
    const element = await render(
      throwError(() => new Error('Service unavailable')),
    );

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudieron cargar los productos.',
    );
    expect(element.querySelectorAll('.product')).toHaveLength(0);
    expect(element.textContent).not.toContain('No hay productos disponibles.');
  });
});
