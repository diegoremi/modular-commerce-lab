import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ProductService } from '@modular-commerce-lab/data-access';
import { catchError, map, of } from 'rxjs';

@Component({
  selector: 'lib-feature-product-list',
  imports: [AsyncPipe, CurrencyPipe],
  templateUrl: './feature-product-list.html',
  styleUrl: './feature-product-list.scss',
})
export class FeatureProductList {
  protected readonly productState$ = inject(ProductService)
    .getProducts()
    .pipe(
      map((products) => ({ products, error: false })),
      catchError(() => of({ products: [], error: true })),
    );
}
