import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { Router, NavigationStart } from "@angular/router";

import { environment } from "../../../environments/environment";
import { OKTA_AUTH, OktaAuthStateService } from "@okta/okta-angular";
import { OktaSignIn } from "@okta/okta-signin-widget";
import { AuthState, OktaAuth } from "@okta/okta-auth-js";
import { Subscription } from "rxjs";

@Component({
  selector: "app-login",
  template: `<div id="okta-signin-container"></div>`,
  styles: [],
})
export class LoginComponent implements OnInit, OnDestroy {
  protected signIn = new OktaSignIn({
    baseUrl: environment.okta.url,
  });
  protected authState: Subscription;

  constructor(
    @Inject(OKTA_AUTH) private oktaAuth: OktaAuth,
    private authStateService: OktaAuthStateService,
    private router: Router
  ) {
    // Show the widget when prompted, otherwise remove it from the DOM.
    this.router.events.forEach((event) => {
      if (event instanceof NavigationStart) {
        switch (event.url) {
          case "/login":
          case "/main":
            break;
          default:
            this.signIn.remove();
            break;
        }
      }
    });
  }

  ngOnInit() {
    this.authState = this.authStateService.authState$.subscribe(
      (state: AuthState) => {
        if (state.isAuthenticated) {
          this.router.navigate(["/main"]);
        }
      }
    );
    this.signIn
      .renderEl({
        el: "#okta-signin-container",
      })
      .then((res) => {
        if (res.status === "SUCCESS") {
          console.log(res);

          this.oktaAuth.signInWithRedirect({ sessionToken: res.session.token });
          this.signIn.hide();
        }
      })
      .catch((err) => {
        throw err;
      });
  }

  ngOnDestroy(): void {
      this.authState.unsubscribe();
  }
}
