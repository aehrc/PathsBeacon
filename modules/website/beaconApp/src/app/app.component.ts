import { Component, Inject } from "@angular/core";
import { OKTA_AUTH, OktaAuthStateService } from "@okta/okta-angular";
import { OktaAuth, AuthState } from "@okta/okta-auth-js";
import { AppConfigService } from "./app.config.service";
import { Router } from "@angular/router";
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "beaconApp";
  isAuthenticated: boolean;
  login: boolean;

  constructor(
    @Inject(OKTA_AUTH) private oktaAuth: OktaAuth,
    private authStateService: OktaAuthStateService,
    private appConfigService: AppConfigService
  ) {}

  ngOnInit() {
    this.login = this.appConfigService.login;
    this.authStateService.authState$.subscribe((state: AuthState) => {
      this.isAuthenticated = state.isAuthenticated;
    });
  }

  logout() {
    this.oktaAuth.signOut({ postLogoutRedirectUri: "" });
  }
}
