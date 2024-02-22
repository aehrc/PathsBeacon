import { BrowserModule } from "@angular/platform-browser";
import { NgModule, APP_INITIALIZER } from "@angular/core";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { AppConfigService } from "./app.config.service";
import { AboutComponent } from "./components/about/about.component";
import { MainComponent } from "./components/main/main.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { MatSortModule } from "@angular/material/sort";
import { LoginComponent } from "./components/login/login.component";
import { OktaAuthModule, OKTA_CONFIG, OktaConfig } from "@okta/okta-angular";
// import { JwPaginationModule } from "jw-angular-pagination";
//import { JwPaginationComponent } from 'jw-angular-pagination';
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { MatIconModule } from "@angular/material/icon";
import { DownloadService } from "./components/main/main.service";
import { SearchComponent } from "./components/search/search.component";
import { environment } from "./../environments/environment";
import { StrepifunComponent } from "./components/strepifun/strepifun.component";
import * as PlotlyJS from "plotly.js-dist-min";
import { PlotlyModule } from "angular-plotly.js";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSelectModule } from "@angular/material/select";
import { MatTableModule } from "@angular/material/table";
import { MatCardModule } from "@angular/material/card";
import { MatInputModule } from "@angular/material/input";
import { MatOptionModule } from "@angular/material/core";
import { OktaAuth } from "@okta/okta-auth-js";
import { Router } from "@angular/router";
import { PatientDataViewerComponent } from "./components/main/patient-data-viewer/patient-data-viewer.component";
import { StateDataViewerComponent } from "./components/main/state-data-viewer/state-data-viewer.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatPaginatorModule } from "@angular/material/paginator";
import { ResultsViewerComponent } from './components/search/results-viewer/results-viewer.component';

PlotlyModule.plotlyjs = PlotlyJS;

const authConfig = {
  issuer: `${environment.okta.url}/oauth2/default`,
  redirectUri: `/implicit/callback`,
  clientId: environment.okta.clientId,
};
const oktaAuth = new OktaAuth(authConfig);
const onAuthRequired = (oktaAuth, injector, options) => {
  const router = injector.get(Router);
  router.navigate(["/login"]);
};

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    AboutComponent,
    LoginComponent,
    //  JwPaginationComponent,
    SearchComponent,
    StrepifunComponent,
    PatientDataViewerComponent,
    StateDataViewerComponent,
    ResultsViewerComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatCheckboxModule,
    BrowserAnimationsModule,
    MatPaginatorModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatTooltipModule,
    FormsModule,
    MatSelectModule,
    HttpClientModule,
    MatTableModule,
    MatSortModule,
    MatOptionModule,
    NgbModule,
    MatIconModule,
    // JwPaginationModule,
    PlotlyModule,
    OktaAuthModule.forRoot({ oktaAuth, onAuthRequired }),
  ],
  providers: [
    // {
    //   provide: OKTA_CONFIG,
    //   useValue: { oktaAuth },
    // },
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [AppConfigService],
      useFactory: (appConfigService: AppConfigService) => {
        return () => {
          //Make sure to return a promise!
          return appConfigService.loadAppConfig();
        };
      },
    },
    DownloadService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
