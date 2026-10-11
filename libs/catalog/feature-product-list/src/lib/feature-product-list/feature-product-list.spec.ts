import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureProductList } from './feature-product-list';

describe('FeatureProductList', () => {
  let component: FeatureProductList;
  let fixture: ComponentFixture<FeatureProductList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureProductList],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureProductList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the eight products from the service', () => {
    const products = fixture.nativeElement.querySelectorAll(
      '.product',
    ) as NodeListOf<HTMLElement>;

    expect(products).toHaveLength(8);
    expect(
      Array.from(
        products,
        (product) => product.querySelector('h2')?.textContent,
      ),
    ).toEqual(Array.from({ length: 8 }, (_, index) => `Product ${index + 1}`));
    expect(products[0].textContent).toContain('10.99');
    expect(products[0].textContent).toContain('Category A');
    expect(products[0].textContent).toContain('Disponible');
    expect(products[1].textContent).toContain('No disponible');
  });
});
