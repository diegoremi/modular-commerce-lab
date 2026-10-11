import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Product } from '@modular-commerce-lab/catalog/models';
import { ProductService } from '@modular-commerce-lab/data-access';
import {
  catchError,
  defer,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  switchMap,
  timer,
} from 'rxjs';

type ProductState = {
  status: 'debouncing' | 'loading' | 'success' | 'error';
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
      startWith(''),
      distinctUntilChanged(),
      // Cancel immediately on a new term, including during the debounce window.
      switchMap((query, index) => {
        const term$ =
          index === 0 ? of(query) : timer(300).pipe(map(() => query));
        const request$ = term$.pipe(
          switchMap((term) =>
            defer(() => this.productService.searchProducts(term)).pipe(
              map(
                (products): ProductState => ({ status: 'success', products }),
              ),
              // Catch inside the request so subsequent searches can recover.
              catchError(() =>
                of<ProductState>({ status: 'error', products: [] }),
              ),
              startWith<ProductState>({ status: 'loading', products: [] }),
            ),
          ),
        );
        return index === 0
          ? request$
          : request$.pipe(
              startWith<ProductState>({ status: 'debouncing', products: [] }),
            );
      }),
    );
}
