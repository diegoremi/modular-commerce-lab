import { firstValueFrom, Observable } from 'rxjs';
import { vi } from 'vitest';
import { Product } from '@modular-commerce-lab/catalog/models';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ProductService();
  });

  afterEach(() => vi.useRealTimers());

  async function response(request: Observable<Product[]>) {
    const result = firstValueFrom(request);
    await vi.advanceTimersByTimeAsync(500);
    return result;
  }

  it('should return the product list', async () => {
    const products = await response(service.getProducts());

    expect(products).toEqual([
      {
        id: '1',
        name: 'Product 1',
        price: 10.99,
        category: 'Category A',
        available: true,
      },
      {
        id: '2',
        name: 'Product 2',
        price: 15.49,
        category: 'Category B',
        available: false,
      },
      {
        id: '3',
        name: 'Product 3',
        price: 7.99,
        category: 'Category A',
        available: true,
      },
      {
        id: '4',
        name: 'Product 4',
        price: 22.5,
        category: 'Category C',
        available: true,
      },
      {
        id: '5',
        name: 'Product 5',
        price: 18.75,
        category: 'Category B',
        available: true,
      },
      {
        id: '6',
        name: 'Product 6',
        price: 12.25,
        category: 'Category A',
        available: false,
      },
      {
        id: '7',
        name: 'Product 7',
        price: 30.0,
        category: 'Category C',
        available: true,
      },
      {
        id: '8',
        name: 'Product 8',
        price: 9.99,
        category: 'Category B',
        available: true,
      },
    ]);
  });
  it('should search by name ignoring case and surrounding spaces', async () => {
    const products = await response(
      service.searchProducts('  pRoDuCt 2  '),
    );
    expect(products.map((product) => product.id)).toEqual(['2']);
  });

  it('should search by category', async () => {
    const products = await response(service.searchProducts('category b'));
    expect(products.map((product) => product.id)).toEqual(['2', '5', '8']);
  });

  it('should return all products for a blank search', async () => {
    expect(await response(service.searchProducts('  '))).toHaveLength(8);
  });

  it('should return no products when the search does not match', async () => {
    expect(await response(service.searchProducts('missing'))).toEqual([]);
  });
  it('should not emit until the simulated response arrives after 500 ms', () => {
    const next = vi.fn();
    const complete = vi.fn();
    service.searchProducts('Product 2').subscribe({ next, complete });
    expect(next).not.toHaveBeenCalled();
    vi.advanceTimersByTime(499);
    expect(next).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0][0].map((product: Product) => product.id)).toEqual(
      ['2'],
    );
    expect(complete).toHaveBeenCalledOnce();
  });

  it('should cancel the simulated response timer when unsubscribed', () => {
    const next = vi.fn();
    const subscription = service.searchProducts('Product 2').subscribe(next);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(100);
    subscription.unsubscribe();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(next).not.toHaveBeenCalled();
  });
});
