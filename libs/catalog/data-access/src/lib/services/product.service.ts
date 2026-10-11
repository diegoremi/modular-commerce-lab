import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Product } from '@modular-commerce-lab/models';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  public getProducts(): Observable<Product[]> {
    // Simulate fetching products from an API or database
    const products: Product[] = [
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
    ];
    return of(products);
  }
}
