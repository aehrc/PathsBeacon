import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";

@Component({
  selector: "app-results-viewer",
  templateUrl: "./results-viewer.component.html",
  styleUrl: "./results-viewer.component.scss",
})
export class ResultsViewerComponent implements AfterViewInit {
  @Input({ required: true }) data: any;
  @Output() dataClick: any = new EventEmitter<any>();
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  protected displayedColumns: string[] = [
    "query_combination",
    "removed_combination",
    "sample_count",
  ];
  protected dataSource: MatTableDataSource<any>;

  constructor() {
    this.dataSource = new MatTableDataSource(this.data);
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes.data.currentValue)
    this.dataSource.data = changes.data.currentValue;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
