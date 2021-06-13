export type GetUrlCallback = (url: string, body: string) => void;

export function getUrlWeb(url: string, callback: GetUrlCallback): void {
    const oReq = new XMLHttpRequest();
    oReq.addEventListener("load", () => {
        if (oReq.status === 200) {
            const text = oReq.responseText;
            callback(url, text);
        } else {
            throw new Error("Error " + oReq.status + " fetching url " + url);
        }
    });
    oReq.open("GET", url);
    oReq.send();
}

export function getUrlMultiple(
    urlFetcher: (url: string, callback: GetUrlCallback) => void,
    concurrentDownloads: number,
    urls: string[],
    urlCallback: GetUrlCallback,
    doneCallback: () => void
): void {
    // urls must be unique or else it breaks further counting
    const uniqueSet = new Set(urls);
    if (uniqueSet.size !== urls.length) {
        throw new Error("urls are not unique");
    }

    const urlsOrigLength = urls.length;
    // must be var so reference is the same in all callbacks
    const parsedUrls: string[] = [];
    const remainingUrls = [...urls];

    for (let i = 0; i <= concurrentDownloads; i++) {
        const fetcherCallback: GetUrlCallback = (fetchedUrl, fetchedBody) => {
            try {
                urlCallback(fetchedUrl, fetchedBody);
            } catch (error) {
                console.error("failed on " + fetchedUrl);
                throw error;
            }

            const nextUrl: string | undefined = remainingUrls.pop();
            console.log(
                "parsedUrls " + parsedUrls.length + " channels " + urlsOrigLength
            );
            parsedUrls.push(fetchedUrl);
            if (nextUrl === undefined) {
                if (parsedUrls.length === urlsOrigLength) {
                    doneCallback();
                }
            } else {
                urlFetcher(nextUrl, fetcherCallback);
            }
        };

        const url: string | undefined = remainingUrls.pop();
        if (url === undefined) {
            break;
        }
        urlFetcher(url, fetcherCallback);
    }
}
