import fs from "fs";
import google_pkg from "googleapis";
const { google } = google_pkg;
import { OAuth2Client } from "googleapis-common";
import readline from "readline";
import parseXml from "@rgrove/parse-xml";
import { SubscriptionStorage } from "./storage";

type YTCallback = (auth: OAuth2Client) => void;

const OAuth2 = google.auth.OAuth2;

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
const SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"];
const TOKEN_DIR =
  (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) +
  "/.credentials/";
const TOKEN_PATH = TOKEN_DIR + "youtube-nodejs-quickstart.json";

export function init(callback: YTCallback) {
  // Load client secrets from a local file.
  fs.readFile("client_secret.json", "utf8", function processClientSecrets(
    err,
    content
  ) {
    if (err) {
      console.log("Error loading client secret file: " + err);
      return;
    }
    // Authorize a client with the loaded credentials, then call the YouTube API.
    authorize(JSON.parse(content), callback);
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials: any, callback: YTCallback) {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, "utf8", (err, token) => {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client: OAuth2Client, callback: YTCallback) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url: ", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oauth2Client.getToken(code, (err, token) => {
      if (err || token == null) {
        console.log("Error while trying to retrieve access token", err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token: any) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code !== "EEXIST") {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
    if (err) {
      throw err;
    }
    console.log("Token stored to " + TOKEN_PATH);
  });
  console.log("Token stored to " + TOKEN_PATH);
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
export function getChannel(auth: OAuth2Client) {
  const service = google.youtube("v3");
  service.channels.list(
    {
      auth,
      forUsername: "GoogleDevelopers",
      part: "snippet,contentDetails,statistics"
    },
    (err, response) => {
      if (err || response == null) {
        console.log("The API returned an error: " + err);
        return;
      }
      const channels = response.data.items;
      if (channels === undefined || channels.length === 0) {
        console.log("No channel found.");
      } else {
        console.log(
          "This channel's ID is %s. Its title is '%s', and " +
            "it has %s views.",
          channels[0].id,
          channels[0].snippet.title,
          channels[0].statistics.viewCount
        );
      }
    }
  );
}

export function parseSubscriptionFile(content: string): SubscriptionStorage[] {
  const xml = parseXml(content);
  const opml = parseChildren(xml.children)[0];
  if (opml.name != "opml") {
    console.log("opml", opml);
    throw new Error("can't find opml");
  }
  const body = parseChildren(opml.children)[0];
  if (body.name != "body") {
    console.log("body", body);
    throw new Error("can't find body");
  }
  const parentOutline = parseChildren(body.children)[0];
  if (parentOutline.name != "outline") {
    console.log("parentOutline", body);
    throw new Error("can't find parentOutline");
  }

  return parseChildren(parentOutline.children).map(outline => {
    if (outline.attributes.text != outline.attributes.title) {
      throw new Error("Expected title and text to match " + outline);
    }
    const name = outline.attributes.text;

    const urlPrefix = "https://www.youtube.com/feeds/videos.xml?channel_id=";
    let channelId = outline.attributes.xmlUrl;
    if (outline.attributes.xmlUrl.indexOf(urlPrefix) == -1) {
      throw new Error(`unexpected url ${channelId}`);
    }
    channelId = channelId.substr(urlPrefix.length);

    return {
      channelId,
      name
    };
  });
}

/**
 * ??????
 * @param children
 */
function parseChildren(children: any) {
  var newChildren = [...children];
  for (var i = newChildren.length - 1; i >= 0; i--) {
    const node = newChildren[i];
    if (node.type == "text" && node.text.trim() == "") {
      newChildren.splice(i, 1);
    }
  }
  return newChildren;
}
