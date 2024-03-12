import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom, from, tap } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class AppConfigService {
  private appConfig: any;

  constructor(private http: HttpClient) {
    // TODO this is a hack
    this.loadAppConfig();
  }

  loadAppConfig() {
    return firstValueFrom(
      this.http.get("/assets/config.json").pipe(
        tap((data) => {
          this.appConfig = data;
        })
      )
    );
  }

  // This is an example property ... you can make it however you want.
  get apiBaseUrl() {
    if (!this.appConfig) {
      throw Error("Config file not loaded!");
    }
    return this.appConfig.apiBaseUrl;
  }
  get login() {
    if (!this.appConfig) {
      throw Error("Config file not loaded!");
    }
    return this.appConfig.login;
  }
}
