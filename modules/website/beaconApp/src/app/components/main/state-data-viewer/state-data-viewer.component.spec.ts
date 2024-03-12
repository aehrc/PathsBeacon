import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StateDataViewerComponent } from './state-data-viewer.component';

describe('StateDataViewerComponent', () => {
  let component: StateDataViewerComponent;
  let fixture: ComponentFixture<StateDataViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StateDataViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StateDataViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
