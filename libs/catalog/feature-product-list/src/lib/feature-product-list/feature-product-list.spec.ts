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
});
