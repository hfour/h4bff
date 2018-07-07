import * as express from "express";
import { App, ContextualRouter } from "h4b2"; // from h4b2

import { FilesPlugin } from "./files-plugin";


export class MyApp extends App {
  constructor() {
    super()
    this.load(FilesPlugin);
  }

  start() {
    const expressApp = express();
    this.getSingleton(ContextualRouter).install("/", expressApp);
    console.log("listening on http://localhost:8080/");
    expressApp.listen(8080);
  }
}

let app = new MyApp();

app.start()