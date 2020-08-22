import App from "uWebSockets.js";
import { resolve } from "path";
import { Storage } from "./storage";

async function startApp() {
  const storage = await Storage.create("./client/database.sqlite");

  startWeb(storage);
}

function startWeb(storage: Storage) {
  const app = App.App();

  // error handlers

  // app.setErrorHandler((err, req, res) => {
  //   console.log("error handler");
  //   res.end(err.message);
  //   return res;
  // });

  // app.setNotFoundHandler((res, req) => {
  //   console.log("notfound error");
  //   res.end("you accessing to missing route??");
  //   return res;
  // });

  // app.setValidationErrorHandler((errors, req, res) => {
  //   console.log("validation error");
  //   res.end("validation errors, " + JSON.stringify(errors));
  // });

  // routes

  // app.static("/", resolve("dist"));
  app.get("/*", (res, req) => {
    res.end("Hello World!");
  });

  app.get("/videos", (req, res) => {
    return storage.getVideos();
  });

  // done

  let port = 8080;
  app.listen(port, token => {
    if (token) {
      console.log("Listening to port " + port);
    } else {
      console.log("Failed to listen to port " + port);
    }
  });
}

startApp();
