import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Product } from '@modular-commerce-lab/catalog/models';
import { ProductService } from '@modular-commerce-lab/data-access';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  switchMap,
} from 'rxjs';

type ProductState = {
  status: 'loading' | 'success' | 'error';
  products: Product[];
};

@Component({
  selector: 'lib-feature-product-list',
  imports: [AsyncPipe, CurrencyPipe, ReactiveFormsModule],
  templateUrl: './feature-product-list.html',
  styleUrl: './feature-product-list.scss',
})
export class FeatureProductList {
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  private readonly productService = inject(ProductService);

  protected readonly productState$: Observable<ProductState> =
    this.searchControl.valueChanges.pipe(
      map((query) => query.trim().toLowerCase()),
      debounceTime(300),
      startWith(''),
      distinctUntilChanged(),
      switchMap((query) =>
        this.productService.searchProducts(query).pipe(
          map((products): ProductState => ({ status: 'success', products })),
          // Keep the search stream alive so the next query can recover from an error.
          catchError(() => of<ProductState>({ status: 'error', products: [] })),
          startWith<ProductState>({ status: 'loading', products: [] }),
        ),
      ),
    );
}
