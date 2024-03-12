import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { MatSort, Sort } from "@angular/material/sort";
import { compare } from "../utils/compare";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";

@Component({
  selector: "app-state-data-viewer",
  templateUrl: "./state-data-viewer.component.html",
  styleUrl: "./state-data-viewer.component.scss",
})
export class StateDataViewerComponent implements OnChanges, AfterViewInit {
  @Input({ required: true }) statesData: any;
  @Output() stateClick: any = new EventEmitter<any>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  protected displayedColumns: string[] = ["regions", "count", "frequency"];
  protected dataSource: MatTableDataSource<any>;

  constructor() {
    this.dataSource = new MatTableDataSource(this.statesData);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.dataSource.data = changes.statesData.currentValue;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
