import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FeatureProductList } from '@modular-commerce-lab/feature-product-list';

@Component({
  imports: [FeatureProductList, RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'modular-commerce-lab';
}
