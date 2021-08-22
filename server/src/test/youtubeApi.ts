import { IVueData } from "../web/vue";

const YOUTUBE_CLIENT_ID =
  "816720081291-3nbo9llrvja6fia9n8c4qgl8sqbvif13.apps.googleusercontent.com";
const YOUTUBE_API_KEY = "3i3ER927GXc74glWm4zyXXtc";
const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";
const YOUTUBE_DISCOVERY =
  "https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest";

export function youtubeInit(vueData: IVueData) {
  console.log("initClient");
  gapi.auth2.init({ client_id: YOUTUBE_CLIENT_ID }).then(
    googleAuth => {
      // Listen for sign-in state changes.
      googleAuth.isSignedIn.listen(isSignedIn => {
        youtubeOnSignin(vueData, isSignedIn);
      });

      // Handle the initial sign-in state.
      youtubeOnSignin(vueData, googleAuth.isSignedIn.get());
    },
    (error: any) => {
      console.error("failed to init gapi in onError", error);
    }
  );
}

function youtubeOnSignin(vueData: IVueData, isLoggedIn: boolean) {
  console.log("youtube signed in: " + isLoggedIn);
  vueData.youtube.signedIn = isLoggedIn;
}

function youtubeSignin() {
  // try {
  //   console.log("login");
  //   gapi.auth2
  //     .getAuthInstance()
  //     .signIn({scope: YOUTUBE_SCOPE }).then(,);
  //   console.log("logged in");
  // } catch (error) {
  //   console.error("failed to login", error);
  //   return;
  // }
  // try {
  //   console.log("load");
  //   gapi.client.setApiKey(YOUTUBE_API_KEY);
  //   await gapi.client.load(YOUTUBE_DISCOVERY);
  //   console.log("loaded api");
  // } catch (error) {
  //   console.error("failed to load api");
  //   return;
  // }
}
