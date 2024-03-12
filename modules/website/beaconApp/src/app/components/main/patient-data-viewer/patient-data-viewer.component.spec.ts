import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientDataViewerComponent } from './patient-data-viewer.component';

describe('PatientDataViewerComponent', () => {
  let component: PatientDataViewerComponent;
  let fixture: ComponentFixture<PatientDataViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatientDataViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PatientDataViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
