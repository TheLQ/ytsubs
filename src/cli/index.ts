import nanoexpress from "nanoexpress";
import { resolve } from "path";
import { Storage } from "./storage";

async function startApp() {
  const storage = await Storage.create("./client/database.sqlite");

  startWeb(storage);
}

function startWeb(storage: Storage) {
  const app = nanoexpress();

  // error handlers

  app.setErrorHandler((err, req, res) => {
    console.log("error handler");
    res.end(err.message);
    return res;
  });

  app.setNotFoundHandler((res, req) => {
    console.log("notfound error");
    res.end("you accessing to missing route??");
    return res;
  });

  app.setValidationErrorHandler((errors, req, res) => {
    console.log("validation error");
    res.end("validation errors, " + JSON.stringify(errors));
  });

  // routes

  app.static("/", resolve("dist"));

  app.get("/videos", (req, res) => {
    return storage.getVideos();
  });

  // done

  app.listen(8080);
}
