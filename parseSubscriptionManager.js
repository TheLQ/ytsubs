const fs = require("fs");
const http = require("https");

fs.readFile(
  "subscription_manager.xml",
  /*return string instead of buffer*/ "utf8",
  function processClientSecrets(err, content) {
    if (err) {
      console.log("Error loading subscription file: " + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the YouTube API.
    parseSubscriptionFile(content);
  }
);

function downloadSubscriptions(name, xmlUrl) {
  const id = xmlUrl.match(/=([a-zA-Z0-9\-\_]+)/)[1];
  const file = fs.createWriteStream("cache_feed/" + id + ".xml");
  const request = http.get(xmlUrl, function(response) {
    response.pipe(file);
  });
}
