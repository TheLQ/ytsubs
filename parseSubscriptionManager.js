const fs = require('fs');
const parseXml = require('@rgrove/parse-xml');
const http = require('https');

fs.readFile('subscription_manager.xml', /*return string instead of buffer*/"utf8", function processClientSecrets(err, content) {
    if (err) {
      console.log('Error loading subscription file: ' + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the YouTube API.
    parseSubscriptionFile(content);
  });

function parseChildren(children) {
    var newChildren = [...children]
    for (var i = newChildren.length - 1; i >= 0; i--) {
        const node = newChildren[i]
        if (node.type == 'text' && node.text.trim() == "") {
            newChildren.splice(i, 1)
        }
    }
    return newChildren
}

function parseSubscriptionFile(content) {
    const xml = parseXml(content);
    const opml = parseChildren(xml.children)[0]
    if (opml.name != "opml") {
        console.log("opml", opml)
        throw new Error("can't find opml")
    }
    const body = parseChildren(opml.children)[0]
    if (body.name != "body") {
        console.log("body", body)
        throw new Error("can't find body")
    }
    const parentOutline = parseChildren(body.children)[0]
    if (parentOutline.name != "outline") {
        console.log("parentOutline", body)
        throw new Error("can't find parentOutline")
    }

    // console.log(parentOutline)
    for(const outline of parseChildren(parentOutline.children)) {
        const name = outline.attributes.text
        const xmlUrl = outline.attributes.xmlUrl
        console.log(xmlUrl)
        downloadSubscriptions(name, xmlUrl)
    }
}

function downloadSubscriptions(name, xmlUrl) {
    const id = xmlUrl.match(/=([a-zA-Z0-9\-\_]+)/)[1]
    const file = fs.createWriteStream("cache_feed/" + id + ".xml");
    const request = http.get(xmlUrl, function(response) {
        response.pipe(file);
    });
}