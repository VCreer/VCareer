import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WriteCv } from '../write-cv';

describe('WriteCv', () => {
  let component: WriteCv;
  let fixture: ComponentFixture<WriteCv>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WriteCv]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WriteCv);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
