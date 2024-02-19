import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppConfigService } from './app.config.service';
import { AboutComponent } from './components/about/about.component';
import { MainComponent } from './components/main/main.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from  '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { HttpClientModule } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import { LoginComponent } from './components/login/login.component';
import { OktaAuthModule } from '@okta/okta-angular';
import { JwPaginationModule } from 'jw-angular-pagination';
//import { JwPaginationComponent } from 'jw-angular-pagination';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MatIconModule} from '@angular/material/icon';
import { DownloadService } from './components/main/main.service';
import { SearchComponent } from './components/search/search.component';
import { environment } from './../environments/environment';
import { StrepifunComponent } from './components/strepifun/strepifun.component';
import * as PlotlyJS from 'plotly.js-dist-min';
import { PlotlyModule } from 'angular-plotly.js';

PlotlyModule.plotlyjs = PlotlyJS;


@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    AboutComponent,
    LoginComponent,
//  JwPaginationComponent,
    SearchComponent,
    StrepifunComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    FormsModule,
    MatSelectModule,
    HttpClientModule,
    MatTableModule,
    MatSortModule,
    NgbModule,
    MatIconModule,
    JwPaginationModule,
    PlotlyModule,
    OktaAuthModule.initAuth({
      issuer: `${environment.okta.url}/oauth2/default`,
      redirectUri: `${environment.cloudfront_url}/implicit/callback`,
      clientId: environment.okta.clientId
    })
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [AppConfigService],
      useFactory: (appConfigService: AppConfigService) => {
        return () => {
          //Make sure to return a promise!
          return appConfigService.loadAppConfig();
        };
      }
    },
    DownloadService

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
