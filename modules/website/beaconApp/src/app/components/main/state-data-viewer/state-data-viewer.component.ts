import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { Sort } from "@angular/material/sort";
import { compare } from "../utils/compare";

@Component({
  selector: "app-state-data-viewer",
  templateUrl: "./state-data-viewer.component.html",
  styleUrl: "./state-data-viewer.component.css",
})
export class StateDataViewerComponent implements OnChanges {
  @Input({ required: true }) statesData: any;
  @Output() click: any = new EventEmitter<any>();
  protected data: any = null;

  ngOnChanges(changes: SimpleChanges): void {
    this.data = structuredClone(changes.statesData.currentValue);
  }

  stateSortData(sort: Sort) {
    if (!sort.direction) {
      this.data = structuredClone(this.statesData);
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
