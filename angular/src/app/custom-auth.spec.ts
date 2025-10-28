import { TestBed } from '@angular/core/testing';

import { CustomAuth } from './custom-auth';

describe('CustomAuth', () => {
  let service: CustomAuth;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomAuth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
