import { Component, ViewChild } from "@angular/core";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { HttpClient } from "@angular/common/http";
import { MatSort, Sort } from "@angular/material/sort";
import { ActivatedRoute } from "@angular/router";
import { Beacon } from "./main.interfaces";
import { AppConfigService } from "../../app.config.service";
import * as d3 from "d3";
import d3Tip from "d3-tip";
import { DownloadService } from "./main.service";
import { Router } from "@angular/router";
import { compare } from "./utils/compare";

@Component({
  selector: "app-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.css"],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class MainComponent {
  inputText: string = "";
  hits: any = [];
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private http: HttpClient,
    private appConfigService: AppConfigService,
    private downloadService: DownloadService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.params.subscribe((params) => (this.inputText = params.input));
    if (this.inputText) {
      this.query();
    }
  }
  ngOnInit() {
    this.hits.sort = this.sort;
  }

  loading: boolean = false;
  iupac: boolean = false;
  iupac_input: string = "False";
  copyText: string = "";
  sMin: any = null;
  sMax: any = null;
  eMin: any = null;
  eMax: any = null;
  sPos = [];
  splittedText = [];
  visualIndex: number;
  assemblyId: string = "";
  queryCombination: string | null = null;
  ref = "";
  alt = "";
  referenceName = [];
  start = [];
  refBases = [];
  altBases = [];
  refName = [];
  phylogenyPos = [];
  varType: string = null;
  stateVisilble: boolean = false;
  rootUrl: string = this.appConfigService.apiBaseUrl;
  login: boolean = this.appConfigService.login;
  url: string = "";
  expandedElement: Beacon | null;
  warning: string = "";
  alertMessage: string = "";
  displayedColumns: string[] = [
    "expand",
    "name",
    "updateDateTime",
    "variantCount",
    "callCount",
    "sampleCount",
    "totalSamples",
    "frequency",
    "accessions",
  ];
  innerDisplayedColumns: string[] = [
    "contig",
    "pos",
    "ref",
    "alt",
    "SIFT_score",
    "subSampleCount",
    "subFrequency",
  ];
  sampleData: { code: string; value: any; breakup: any }[] = [];
  dateData: { date: string; value: any; breakup: any; location: string }[] = [];
  hashState = {};
  states = [];
  filteredArray = [];
  accessionDetails = [];
  updateDateTime;
  ids: string[] = ["SampleCollectionDate", "Location"];
  queryData = {};
  vis: number = 0;
  pageOfItems: Array<any>;
  statePageOfItems: Array<any>;
  patientStatus: Array<any> = [];
  externalLink = "";

  onChange() {
    if (!this.iupac) {
      this.iupac = true;
      this.iupac_input = "True";
    } else {
      this.iupac = false;
      this.iupac_input = "False";
    }
  }
  download() {
    this.downloadService.downloadFile(
      this.accessionDetails,
      this.updateDateTime,
      this.inputText
    );
  }

  similaritySearch() {
    this.router.navigate(["search", this.inputText]);
  }

  navigate() {
    console.log(this.start);
    console.log(this.phylogenyPos.join(","));
    this.externalLink =
      "https://nextstrain.org/ncov/gisaid/global/all-time?gt=nuc." +
      this.phylogenyPos.join(",") +
      "&m=div";
    console.log(this.externalLink);

    window.open(this.externalLink, "_blank");
  }
  share() {
    var location = window.location;
    if (
      location.toString().split("/").pop() === "main" ||
      location.toString().split("/").pop() === "query"
    ) {
      this.copyText = window.location + "/" + this.inputText;
      navigator.clipboard
        .writeText(this.copyText)
        .then()
        .catch((e) => console.error(e));
    } else {
      navigator.clipboard
        .writeText(location.toString())
        .then()
        .catch((e) => console.error(e));
    }
  }
  sortData(sort: Sort, element) {
    console.log(element);
    let index;
    for (let i = 0; i < 3; i++) {
      if (element.datasetId === this.hits[i].datasetId) {
        index = i;
        const data = this.hits[i].info.variants.slice();
        if (!sort.active || sort.direction === "") {
          this.pageOfItems = data;
          return;
        }
        this.hits[i].info.variants = data.sort((a, b) => {
          const isAsc = sort.direction === "asc";
          switch (sort.active) {
            case "contig":
              return compare(a.contig, b.contig, isAsc);
            case "position":
              return compare(a.pos, b.pos, isAsc);
            case "ref":
              return compare(a.ref, b.ref, isAsc);
            case "alt":
              return compare(a.alt, b.alt, isAsc);
            case "SIFT_score":
              return compare(a.SIFT_score, b.SIFT_score, isAsc);
            case "sampleCount":
              return compare(a.sampleCount, b.sampleCount, isAsc);
            case "frequency":
              return compare(a.frequency, b.frequency, isAsc);
            default:
              return 0;
          }
        });
        continue;
      }
    }
  }

  onChangePage(pageOfItems: Array<any>) {
    // update current page of items
    this.pageOfItems = pageOfItems;
  }
  onChangeStatePage(statePageOfItems: Array<any>) {
    // update current page of items
    this.statePageOfItems = statePageOfItems;
  }

  refreshGraph() {
    this.graphDataGenerator(this.hits, this.visualIndex);
  }

  refresh() {
    var location = window.location;
    if (
      location.toString().split("/").pop() === "main" ||
      location.toString().split("/").pop() === "query"
    ) {
      window.location.reload();
    } else {
      if (this.login) {
        this.router.navigate(["main"]);
      } else {
        this.router.navigate(["query"]);
      }
    }
  }
  stateHistogram(state) {
    this.graphDataGenerator(this.hits, this.visualIndex, null, (state = state));
    this.vis = 1;
  }
  visual() {
    this.generateMap(
      this.sampleData,
      "choropleth",
      [
        " 0",
        " 1% - 5%",
        " 6% - 10%",
        "11% - 25%",
        "26% - 50%",
        "51% - 75%",
        "> 76%",
      ],
      [1, 6, 11, 26, 51, 76]
    );
    this.generateHistogram(this.dateData);
    this.vis = 1;
  }
  statesData(searchTerm, id) {
    console.log(searchTerm);
    console.log(id);
    this.hashState = {};
    this.states = [];
    if (searchTerm == "USA") {
      searchTerm = "United States";
    }
    if (searchTerm == "Ivory Coast") {
      searchTerm = "CotedIvoire";
    }
    var condition = new RegExp(searchTerm);
    let stateCounts = this.hits[0].info.sampleCounts.State;
    let filtered = Object.keys(stateCounts).reduce(function (r, e) {
      if (String(e).match(condition)) {
        r[e] = stateCounts[e];
      }
      return r;
    }, {});
    console.log(filtered);
    for (let stateKey in filtered) {
      if (filtered[String(stateKey)][0] !== 0) {
        let frequency = (
          (filtered[String(stateKey)][0] / filtered[String(stateKey)][1]) *
          100
        ).toFixed(2);
        this.states.push({
          regions: String(stateKey),
          count: filtered[String(stateKey)][0],
          frequency: frequency,
        });
      }
    }

    this.states.sort((a, b) => (a.regions > b.regions ? 1 : -1));
  }
  search(searches) {
    if (searches == "D614G") {
      this.sMin = this.sMax = this.eMin = this.eMax = null;
      this.inputText = "A23403G";
      this.iupac = false;
      this.iupac_input = "False";
      this.query();
    }
    if (searches == "Y453F") {
      this.sMin = this.sMax = this.eMin = this.eMax = null;
      this.inputText = "A22920T";
      this.iupac = false;
      this.iupac_input = "False";
      this.query();
    }
    if (searches == "spike") {
      this.inputText = null;
      this.sMin = this.eMin = 21563;
      this.sMax = this.eMax = 25384;
      this.ref = this.alt = "N";
      this.iupac = true;
      this.iupac_input = "True";
      this.query();
    }
    if (searches == "ORF6") {
      this.inputText = null;
      this.sMin = this.eMin = 27202;
      this.sMax = this.eMax = 27387;
      this.ref = this.alt = "N";
      this.iupac = true;
      this.iupac_input = "True";
      this.query();
    }
    if (searches == "UKV") {
      this.sMin = this.sMax = this.eMin = this.eMax = null;
      this.inputText =
        "A23063T&C23271A&C23604A&C23709T&T24506G&G24914C&C3267T&C5388A&T6954C&C27972T&G28048T&A28111G&G28280C&A28281T&T28282A&C28977T&ATACATG21764A&TTTA21990T&GTCTGGTTTT11287G";
      this.iupac = false;
      this.iupac_input = "False";
      this.query();
    }
  }

  parseMutationExpression(expression: string): [string, any[]] {
    const _expression = expression.replace(/\s/g, "");
    const varRegex =
      /^((?<refName>[0-9a-zA-Z]+)-)?(?<refBases>[a-z]+)(?<start>\d+)(?<altBases>[a-z]+)/i;
    const logicRegex = /[!&:()|]/;
    const queries: any[] = [];
    let combination: string = "";
    let index: number = 0;

    for (let pos = 0; pos < _expression.length; pos++) {
      const char = _expression[pos];

      if (char.match(logicRegex)) {
        // consume the groupings (parenthesis) and logic (!|)
        combination += char == ":" ? "&" : char;
      } else {
        // consume the mutation
        const remainder = _expression.slice(pos);
        const matches: any = remainder.match(varRegex);
        // must have a match starting here else skip
        if (matches) {
          queries.push(matches.groups);
          combination += index.toString();
          // jump over the match and increment index
          pos += matches[0].length - 1;
          index += 1;
        }
      }
    }

    return [combination, queries];
  }

  query() {
    this.assemblyId = "hCoV-19";
    this.start = [];
    this.refBases = [];
    this.altBases = [];
    this.refName = [];
    this.phylogenyPos = [];
    this.loading = true;

    if (this.sMin || this.sMax || this.eMin || this.eMax) {
      this.inputText = null;

      if (this.varType != null) {
        this.alt = null;
        this.queryData = {
          assemblyId: "hCoV-19",
          includeDatasetResponses: "ALL",
          referenceName: "1",
          referenceBases: this.ref.toUpperCase(),
          startMin: (this.sMin - 1).toString(),
          startMax: (this.sMax - 1).toString(),
          endMin: (this.eMin - 1).toString(),
          endMax: (this.eMax - 1).toString(),
          variantType: this.varType.toUpperCase(),
          iupac: this.iupac_input,
          sampleFields: [
            "SampleCollectionDate",
            "Location",
            "State",
            "Location_SampleCollectionDate",
            "State_SampleCollectionDate",
            "Patient.Status",
          ],
        };
      }
      if (this.alt != null) {
        this.varType = null;
        this.queryData = {
          assemblyId: "hCoV-19",
          includeDatasetResponses: "ALL",
          referenceName: "1",
          referenceBases: this.ref.toUpperCase(),
          alternateBases: this.alt.toUpperCase(),
          startMin: (this.sMin - 1).toString(),
          startMax: (this.sMax - 1).toString(),
          endMin: (this.eMin - 1).toString(),
          endMax: (this.eMax - 1).toString(),
          iupac: this.iupac_input,
          sampleFields: [
            "SampleCollectionDate",
            "Location",
            "State",
            "Location_SampleCollectionDate",
            "State_SampleCollectionDate",
            "Patient.Status",
          ],
        };
      }
    } else if (this.inputText != null) {
      try {
        let text = this.inputText.replace(/\&/g, ":");
        if (text.includes("~")) {
          // Using ~ as a delimiter for assemblyId
          [this.assemblyId, text] = text.split("~");
        }
        const [queryCombination, queries] = this.parseMutationExpression(text);
        this.queryCombination = queryCombination;

        queries.forEach((query: any) => {
          this.refName.push(query.refName || "1");
          this.start.push((parseInt(query.start) - 1).toString());
          this.refBases.push(query.refBases.toUpperCase());
          this.altBases.push(query.altBases.toUpperCase());
          this.phylogenyPos.push(
            `${query.start}${query.altBases.toUpperCase()}`
          );
        });
      } catch (err) {
        this.warning =
          "Incorrect search formatting - Please enter valid position.";
        this.loading = false;
        return;
      }

      this.queryData = {
        assemblyId: this.assemblyId,
        includeDatasetResponses: "ALL",
        referenceName: this.refName,
        start: this.start,
        referenceBases: this.refBases,
        alternateBases: this.altBases,
        iupac: this.iupac_input,
        sampleFields: [
          "SampleCollectionDate",
          "Location",
          "State",
          "Location_SampleCollectionDate",
          "State_SampleCollectionDate",
          "Patient.Status",
        ],
      };

      if (this.queryCombination) {
        this.queryData["queryCombination"] = this.queryCombination;
      }
    }

    this.url = this.rootUrl + "/query";
    console.log(this.queryData);
    this.getData(this.url, this.queryData);
  }

  reduceMetadata() {
    const jsonArray = this.hits.map(
      (entry: any) => entry.info.sampleCounts["Patient.Status"] || {}
    );
    const result = jsonArray.reduce((accumulator, current) => {
      Object.keys(current).forEach((key) => {
        const currentResult = current[key] || [0, 0];
        if (accumulator[key]) {
          accumulator[key][0] += currentResult[0];
          accumulator[key][1] += currentResult[1];
        } else {
          accumulator[key] = currentResult;
        }
      });
      return accumulator;
    }, {});
    this.patientStatus = [];
    // Grab the totals from first principles, in case there's some weirdness in the main sample counts
    let varSamples = Object.values(result).reduce<number>(
      (sum, value) => sum + value[0],
      0
    );
    let noVarSamples =
      Object.values(result).reduce<number>((sum, value) => sum + value[1], 0) -
      varSamples;
    Object.entries(result).forEach(([key, value]: [string, number[]]) => {
      if (value[1] > 0) {
        let casesWithVar = value[0];
        let casesNoVar = value[1] - casesWithVar;
        let controlsWithVar = varSamples - casesWithVar;
        let controlsNoVar = noVarSamples - casesNoVar;
        if (
          casesWithVar == 0 ||
          casesNoVar == 0 ||
          controlsWithVar == 0 ||
          controlsNoVar == 0
        ) {
          // perform Haldane-Anscombe correction
          casesWithVar += 0.5;
          casesNoVar += 0.5;
          controlsWithVar += 0.5;
          controlsNoVar += 0.5;
        }
        let logOddsRatioVal = Math.log(
          (casesWithVar * controlsNoVar) / (casesNoVar * controlsWithVar)
        );
        let logOddsErrorVal =
          1.96 *
          Math.sqrt(
            1 / casesWithVar +
              1 / casesNoVar +
              1 / controlsWithVar +
              1 / controlsNoVar
          );
        this.patientStatus.push({
          attribute: key,
          occurrences: value[0],
          total: value[1],
          percentage: (100.0 * value[0]) / value[1],
          logOddsRatio: logOddsRatioVal,
          logOddsError: logOddsErrorVal,
          significant: Math.abs(logOddsRatioVal) > logOddsErrorVal,
        });
      }
    });
  }

  getData(url, qData) {
    this.http.post(url, qData).subscribe(
      (response: Beacon) => {
        if (response.hasOwnProperty("s3Response")) {
          console.log(response);
          var newUrl = response.s3Response.presignedUrl;
          console.log(newUrl);
          this.http.get(newUrl).subscribe(
            (response: Beacon) => {
              console.log(response);
              if (response.hasOwnProperty("exists")) {
                this.warning = null;
                this.hits = response.datasetAlleleResponses;

                this.loading = false;
                const maxDatasetId: any = response.datasetAlleleResponses.sort(
                  (a, b) => b.callCount - a.callCount
                )[0];
                this.visualIndex = maxDatasetId.info.name;
                this.reduceMetadata();
                this.graphDataGenerator(this.hits, this.visualIndex);
                this.statesData("Indonesia", "IDN");
                this.filteredArray = response.datasetAlleleResponses.filter(
                  function (itm) {
                    return itm.datasetId == "gisaid";
                  }
                );
                console.log(this.filteredArray.length);
                if (this.filteredArray.length == 0) {
                  this.displayedColumns = [
                    "expand",
                    "name",
                    "updateDateTime",
                    "variantCount",
                    "callCount",
                    "sampleCount",
                    "totalSamples",
                    "frequency",
                  ];
                }
              } else {
                console.log(response);
                this.warning = "No Hits to display";
                this.hits = [];
                this.loading = false;
                this.visualIndex = 0;
                this.accessionDetails = [];
              }
            },
            (error) => {
              console.log(error);
              if (error.statusText == "Unknown Error") {
                this.warning =
                  "Query request timed out. Please contact administrator to run your query.";
              } else {
                this.warning = error.error.error.errorMessage;
              }
              this.hits = [];
              this.loading = false;
            }
          );
        } else if (response.hasOwnProperty("exists")) {
          this.warning = null;
          console.log(response.datasetAlleleResponses);
          this.hits = response.datasetAlleleResponses;
          this.loading = false;
          const maxDatasetId: any = response.datasetAlleleResponses.sort(
            (a, b) => b.callCount - a.callCount
          )[0];
          this.visualIndex = maxDatasetId.info.name;
          console.log(this.visualIndex);
          this.reduceMetadata();
          this.graphDataGenerator(this.hits, this.visualIndex);
          this.statesData("Indonesia", "IDN");
          this.filteredArray = response.datasetAlleleResponses.filter(function (
            itm
          ) {
            return itm.datasetId == "gisaid";
          });
          console.log(this.filteredArray);
          if (this.filteredArray.length == 0) {
            this.displayedColumns = [
              "expand",
              "name",
              "updateDateTime",
              "variantCount",
              "callCount",
              "sampleCount",
              "totalSamples",
              "frequency",
            ];
          }
        } else {
          console.log(response);
          this.warning = "No Hits to display";
          this.hits = [];
          this.loading = false;
          this.visualIndex = 0;
          this.accessionDetails = [];
        }
      },
      (error) => {
        console.log(error);
        this.hits = [];
        if (error.statusText == "Unknown Error") {
          this.warning =
            "Query request timed out. Please contact administrator to run your query.";
        } else {
          this.warning = error.error.error.errorMessage;
        }
        this.loading = false;
      }
    );
  }
  graphDataGenerator(hits, visIndex, location = null, state = null) {
    let index = hits.findIndex((x) => x.info.name === visIndex);
    if (hits[index].info.sampleCounts.hasOwnProperty("ID")) {
      this.accessionDetails = hits[index].info.sampleCounts.ID;
      this.updateDateTime = hits[index].info.updateDateTime;
    }
    let locationDetails = hits[index].info.sampleCounts.Location;
    let locationDateCounts =
      hits[index].info.sampleCounts.Location_SampleCollectionDate;
    let stateDateCounts =
      hits[index].info.sampleCounts.State_SampleCollectionDate;
    let dateCounts = hits[index].info.sampleCounts.SampleCollectionDate;
    let hashLoc = {};
    let hashDate = {};
    if (location == null && state == null) {
      this.sampleData = [];
      for (let key in locationDetails) {
        this.sampleData.push({
          code: String(key),
          value: (
            (locationDetails[String(key)][0] /
              locationDetails[String(key)][1]) *
            100
          ).toFixed(2),
          breakup: String(
            locationDetails[String(key)][0] +
              "/" +
              locationDetails[String(key)][1]
          ),
        });
      }
      this.dateData = [];
      for (let key in dateCounts) {
        this.dateData.push({
          date: String(key),
          value: (
            (dateCounts[String(key)][0] / dateCounts[String(key)][1]) *
            100
          ).toFixed(2),
          breakup: String(
            dateCounts[String(key)][0] + "/" + dateCounts[String(key)][1]
          ),
          location: "all",
        });
      }
      this.generateMap(
        this.sampleData,
        "choropleth",
        [
          " 0",
          " 1% - 5%",
          " 6% - 10%",
          "11% - 25%",
          "26% - 50%",
          "51% - 75%",
          "> 76%",
        ],
        [1, 6, 11, 26, 51, 76]
      );
      this.generateHistogram(this.dateData);
    } else if (state != null) {
      //Update Histogram when a region row is clicked

      var stateDateValues = stateDateCounts[state];
      this.dateData = [];
      for (let key in stateDateValues) {
        this.dateData.push({
          date: String(key),
          value: (
            (stateDateValues[String(key)][0] /
              stateDateValues[String(key)][1]) *
            100
          ).toFixed(2),
          breakup: String(
            stateDateValues[String(key)][0] +
              "/" +
              stateDateValues[String(key)][1]
          ),
          location: state,
        });
      }
      d3.selectAll("#choropleth").selectAll("svg").remove();
      this.generateHistogram(this.dateData);
    } else {
      //Update Histogram when location on map is clicked

      var locDateValues = locationDateCounts[location];
      console.log(locDateValues);
      this.dateData = [];
      for (let key in locDateValues) {
        this.dateData.push({
          date: String(key),
          value: (
            (locDateValues[String(key)][0] / locDateValues[String(key)][1]) *
            100
          ).toFixed(2),
          breakup: String(
            locDateValues[String(key)][0] + "/" + locDateValues[String(key)][1]
          ),
          location: location,
        });
      }
      this.generateMap(
        this.sampleData,
        "choropleth",
        [
          " 0",
          " 1% - 5%",
          " 6% - 10%",
          "11% - 25%",
          "26% - 50%",
          "51% - 75%",
          "> 76%",
        ],
        [1, 6, 11, 26, 51, 76]
      );
      this.generateHistogram(this.dateData);
    }
    var non = this.sampleData.find((o) => o.code === "None");
    console.log(non);
    if (typeof non !== "undefined") {
      var breakValue = non["breakup"].split("/")[0];
      if (breakValue != 0) {
        this.alertMessage =
          breakValue + " samples have inconsistent country name.";
      } else {
        this.alertMessage = "";
      }
    }
  }

  generateMap(sampleData, divID, labels, domain) {
    d3.select(".legendThreshold").remove();
    d3.select("#" + divID)
      .selectAll("svg")
      .remove();
    let width = 600;
    let height = 400;
    let lowColor = "#ccdef0";
    let highColor = "#225487"; //'#477fb6'

    let svg = d3
      .selectAll("#" + divID)
      .append("svg:svg")
      .attr("width", width)
      .attr("height", height)
      .call(
        d3.zoom().on("zoom", function () {
          svg.attr("transform", d3.event.transform);
        })
      );
    // Map and projection
    let map = svg.append("g").attr("class", "countries");

    let projection = d3
      .geoMercator()
      .scale(width / 2.7 / Math.PI)
      .translate([width / 2, height / 1.6]);
    let path = d3.geoPath().projection(projection);

    // Data and color scale
    let data = d3.map();

    let tip = d3Tip()
      .attr("class", "d3-tip")
      .offset([0, 0])
      .html(function (d) {
        let breakup;
        sampleData.forEach(function (n) {
          if (d.id == n.code) {
            breakup = n.breakup;
          }
        });
        if (d.properties.name == "England") {
          return "United Kingdom : " + d.value + "%";
        } else {
          if (typeof breakup === "undefined") {
            return d.properties.name + ": No data (" + d.value + "%)";
          } else {
            return d.properties.name + ": " + breakup + " (" + d.value + "%)";
          }
        }
      });
    svg.call(tip);
    let self = this;

    d3.json("assets/geojson/world.geojson")
      .then(function (topo: any) {
        sampleData.forEach(function (d) {
          data.set(d.code, +d.value);
        });
        let range_low = 0,
          range_high = d3.max(topo.features, function (d: any) {
            return data.get(d.id);
          });
        let color = d3
          .scaleLinear<string>()
          .range([lowColor, highColor])
          .domain([range_low, Number(range_high)])
          .interpolate(d3.interpolateLab);

        // Draw the map  topoJson.feature(topo, countries).features
        map
          .selectAll("path")
          .data(topo.features)
          .enter()
          .append("path")
          .attr("id", function (d: any) {
            d.value = data.get(d.id) || 0;
            return d.value;
          })
          .attr("d", path)
          .style("fill", function (d: any) {
            if (typeof data.get(d.id) === "undefined") {
              return "#f2f4f5"; //#f7f9fa color like
            } else {
              return color(d.value);
            }
          })
          .on("mouseover", tip.show)
          .on("mouseleave", tip.hide)
          .on("mouseout", tip.hide)
          .on("click", function (d: any) {
            Array.prototype.forEach.call(
              document.querySelectorAll(".d3-tip"),
              (t) => t.parentNode.removeChild(t)
            );
            console.log(d);
            self.statesData(d.properties.name, d.id);
            self.graphDataGenerator(self.hits, self.visualIndex, d.id);
          });

        //title
        map
          .append("text")
          .attr("x", width / 2)
          .attr("y", 15)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .style("fill", "black")
          .style("stroke", "none")
          .text("Geographic distribution of searched variant");

        // add a legend
        var w = 140,
          h = 150;

        var key = map
          .append("svg")
          .attr("width", w)
          .attr("height", h)
          .attr("class", "legendThreshold");

        var legend = key
          .append("defs")
          .append("svg:linearGradient")
          .attr("id", "gradient")
          .attr("x1", "100%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "100%")
          .attr("spreadMethod", "pad");

        legend
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", highColor)
          .attr("stop-opacity", 1);

        legend
          .append("stop")
          .attr("offset", "100%")
          .attr("stop-color", lowColor)
          .attr("stop-opacity", 1);

        key
          .append("rect")
          .attr("width", w - 110)
          .attr("height", h)
          .style("fill", "url(#gradient)")
          .attr("transform", "translate(0,10)");

        var y = d3
          .scaleLinear()
          .range([h, 0])
          .domain([range_low, Number(range_high)]);

        var yAxis = d3.axisRight(y);

        key
          .append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(40,10)")
          .call(yAxis);
      })
      .catch(function (error) {
        console.log(error);
      });
  }
  generateHistogram(sampleData) {
    d3.selectAll("#histogram").selectAll("svg").remove();
    sampleData = sampleData.sort((a, b) => a.date.localeCompare(b.date));
    let width = 600;
    let height = 400;
    let margin = { top: 20, right: 20, bottom: 30, left: 50 };

    let svg = d3
      .selectAll("#histogram")
      .append("svg")
      .attr("width", width - 50)
      .attr("height", height);

    let x = d3
      .scaleBand()
      .rangeRound([0, width - 100])
      .padding(0.1);
    let y = d3.scaleLinear().rangeRound([height - 50, 20]);
    let g = svg.append("g").attr("transform", "translate(50,0)");

    x.domain(sampleData.map((d) => d.date));
    y.domain([0, 100]);
    let tip = d3Tip()
      .attr("class", "d3-tip")
      .offset([-12, 0])
      .html(function (d) {
        return d.breakup + " (" + d.value + "%)";
      });
    svg.call(tip);

    g.append("g")
      .attr("class", "axis axis-x")
      .attr("transform", "translate(0,350)")
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-25)");

    g.append("g").attr("class", "axis axis-y").call(d3.axisLeft(y).ticks(5));

    g.selectAll(".bar")
      .data(sampleData)
      .enter()
      .append("rect")
      .attr("class", "transparentBar")
      .attr("x", (d) => x(d["date"]))
      .attr("y", 345)
      .attr("width", x.bandwidth())
      .attr("height", 5)
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide);

    g.selectAll(".bar")
      .data(sampleData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d["date"]))
      .attr("y", (d) => y(d["value"]))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - 50 - y(d["value"]))
      .on("mouseover", tip.show)
      .on("mouseout", tip.hide);

    //title
    g.append("text")
      .data(sampleData)
      .attr("x", width / 3)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(function (d: any) {
        if (d.location == "all") {
          return "Frequency over time for searched variant ";
        } else {
          return "Frequency over time for " + d.location;
        }
      });
  }
}
