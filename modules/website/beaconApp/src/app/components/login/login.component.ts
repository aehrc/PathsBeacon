import { Component, Inject, OnInit } from "@angular/core";
import { Router, NavigationStart } from "@angular/router";

import { environment } from "./../../../environments/environment";
import { OKTA_AUTH } from "@okta/okta-angular";
import { OktaSignIn } from "@okta/okta-signin-widget";
import { OktaAuth } from "@okta/okta-auth-js";
import "@okta/okta-signin-widget/css/okta-sign-in.min.css";

@Component({
  selector: "app-login",
  template: `<div id="okta-signin-container"></div>`,
  styles: [],
})
export class LoginComponent implements OnInit {
  protected signIn = new OktaSignIn({
    baseUrl: environment.okta.url,
  });

  constructor(@Inject(OKTA_AUTH) private oktaAuth: OktaAuth, router: Router) {
    // Show the widget when prompted, otherwise remove it from the DOM.
    router.events.forEach((event) => {
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
}
