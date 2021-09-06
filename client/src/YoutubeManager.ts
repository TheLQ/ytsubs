import { alertAndThrow } from "./util/httputils";
import { assertNotBlank } from "../../server/src/common/util/langutils";
import { MutationTypes, YsStore } from "./VueStore";

const SCOPE = "https://www.googleapis.com/auth/youtube.readonly";

// These are globals but gapi itself is global so testing is hard anyway
let store: YsStore;
let GoogleAuth: gapi.auth2.GoogleAuth | null = null;

export function init(myStore: YsStore) {
  store = myStore;
  GoogleAuth = null;

  if (window.location.hostname == "ytsubs.xana.sh") {
    window.addEventListener("load", loadGapi);
  } else {
    console.log(
      "gapi skipping init because not running on production hostname"
    );
  }
}

function loadGapi() {
  console.log("gapi init after window.load");
  // TODO: Add gapi load error handling
  gapi.load("client:auth2", {
    callback: initYoutubeClient,
    onerror: function () {
      alert("gapi.client failed to load!");
    },
    timeout: 5000,
    ontimeout: function () {
      alert("gapi.client could not load in a timely manner!");
    },
  });
}

async function initYoutubeClient() {
  // must not throw errors in this function because gapi doesn't log them!
  try {
    console.log("youtube client start");
    const yotubeClientId = assertNotBlank(
      import.meta.env.VITE_YOUTUBE_CLIENTID,
      "cannot load youtube clientid"
    );
    await gapi.client.init({
      /**
       * The "client side" docs use both clientId and apiKey but testing fails with 400 invalid key!
       * Github examples only uses apiKey
       * Only clientId works too and seems relatively less secretive
       */
      clientId: yotubeClientId,
      discoveryDocs: [
        "https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest",
      ],
      scope: SCOPE,
    });
    console.log("youtube client initted");

    GoogleAuth = gapi.auth2.getAuthInstance();

    // update ui when applying sign in/out
    GoogleAuth.isSignedIn.listen(onSignInChange);

    // update ui with current state
    onSignInChange();

    console.log("youtube client setup complete");
  } catch (error) {
    throw alertAndThrow(error, "failed to init gapi");
  }
}

function onSignInChange() {
  if (GoogleAuth == null) {
    throw new Error("state error");
  }
  const user = GoogleAuth.currentUser.get();
  const isAuthorized = user.hasGrantedScopes(SCOPE);
  if (isAuthorized) {
    store.commit(MutationTypes.YOUTUBE_SIGNIN, {
      signedIn: true,
      name: user.getBasicProfile().getName(),
      profileImage: user.getBasicProfile().getImageUrl(),
    });
  } else {
    store.commit(MutationTypes.YOUTUBE_SIGNOUT, undefined);
  }
}

export function toggleSignIn() {
  if (GoogleAuth == null) {
    throw new Error("google auth disabled");
  }

  if (GoogleAuth.isSignedIn.get()) {
    // User is authorized and has clicked "Sign out" button.
    GoogleAuth.signOut();
  } else {
    // User is not signed in. Start Google auth flow.
    GoogleAuth.signIn();
  }
}

export function revokeAccess() {
  if (GoogleAuth == null) {
    throw new Error("google auth disabled");
  }
  GoogleAuth.disconnect();
}

function assertApiSuccesful(response: gapi.client.Response<unknown>): void {
  if (response.status != 200 || response.statusText != "OK") {
    console.error(
      `GAPI failed ${response.status} ${response.statusText}`,
      response
    );
    throw new Error(`GAPI failed ${response.status} ${response.statusText}`);
  }
}

export async function getAllChannels(
  callback: (page: gapi.client.youtube.Subscription[]) => Promise<void>
): Promise<void> {
  // avoid flashing the loading screen on and off with an always active message
  let jobLoadingMessage = "Loading all subscriptions";
  store.commit(MutationTypes.LOADING_ADD, jobLoadingMessage);

  let page = 0;
  let total = -1;
  let pageToken = "";
  while (true) {
    let loadingMessage = `Loading subscriptions page ${page + 1}`;
    if (total != -1) {
      loadingMessage += ` total ${total}`;
    }
    store.commit(MutationTypes.LOADING_ADD, loadingMessage);

    const request = await gapi.client.youtube.subscriptions.list({
      part: "snippet",
      mine: true,
      maxResults: 50,
      pageToken: pageToken == "" ? undefined : pageToken,
    });
    assertApiSuccesful(request);
    const res = request.result;
    console.debug("GAPI call result page " + page, res);
    page++;

    if (!res.items || res.items.length == 0) {
      throw new Error("state error, empty results");
    }
    await callback(res.items);

    store.commit(MutationTypes.LOADING_DONE, loadingMessage);

    if (res.nextPageToken) {
      pageToken = res.nextPageToken;
    } else {
      break;
    }
  }

  store.commit(MutationTypes.LOADING_DONE, jobLoadingMessage);
}
