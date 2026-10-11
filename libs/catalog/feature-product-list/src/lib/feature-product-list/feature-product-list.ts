import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ProductService } from '@modular-commerce-lab/data-access';

@Component({
  selector: 'lib-feature-product-list',
  imports: [AsyncPipe],
  templateUrl: './feature-product-list.html',
  styleUrl: './feature-product-list.scss',
})
export class FeatureProductList {
  protected readonly products$ = inject(ProductService).getProducts();
}
