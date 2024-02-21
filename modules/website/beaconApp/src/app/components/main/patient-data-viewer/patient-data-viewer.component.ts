import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Sort } from "@angular/material/sort";
import { compare } from "../utils/compare";

@Component({
  selector: "app-patient-data-viewer",
  templateUrl: "./patient-data-viewer.component.html",
  styleUrl: "./patient-data-viewer.component.css",
})
export class PatientDataViewerComponent implements OnChanges {
  @Input({ required: true }) patientStatus: any;
  protected data: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    this.data = structuredClone(changes.patientStatus.currentValue);
  }

  patientStatusSortData(sort: Sort) {
    if (!sort.direction) {
      this.data = structuredClone(this.patientStatus);
      return;
    }

    this.data.sort((a, b) =>
      compare(
        a[sort.active] || 0,
        b[sort.active] || 0,
        sort.direction === "asc"
      )
    );
  }
}
