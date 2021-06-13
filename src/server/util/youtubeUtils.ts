import parseXml from "@rgrove/parse-xml";
import fs from "fs";
import { WrappedError } from "./error";

import { SubscriptionStorageSimple, VideoStorage } from "./storage";

export const feedUrlPrefix =
  "https://www.youtube.com/feeds/videos.xml?channel_id=";

/**
 * Parse subscription list from https://www.youtube.com/subscription_manager
 * @param xmlContent
 */
export function parseSubscriptionsOpml(
  xmlContent: string
): SubscriptionStorageSimple[] {
  const xml = parseXml(xmlContent);
  const opml = filterChildrenFormatting(xml.children)[0] as parseXml.XmlElement;
  if (opml.name !== "opml") {
    console.log("opml", opml);
    throw new Error("can't find opml");
  }
  const body = filterChildrenFormatting(
    opml.children
  )[0] as parseXml.XmlElement;
  if (body.name !== "body") {
    console.log("body", body);
    throw new Error("can't find body");
  }
  const parentOutline = filterChildrenFormatting(
    body.children
  )[0] as parseXml.XmlElement;
  if (parentOutline.name !== "outline") {
    console.log("parentOutline", body);
    throw new Error("can't find parentOutline");
  }

  return (
    filterChildrenFormatting(parentOutline.children) as parseXml.XmlElement[]
  ).map((outline) => {
    if (outline.attributes.text !== outline.attributes.title) {
      throw new Error("Expected title and text to match " + outline);
    }
    const channelName = outline.attributes.text;

    let channelId = outline.attributes.xmlUrl;
    if (outline.attributes.xmlUrl.indexOf(feedUrlPrefix) === -1) {
      throw new Error(`unexpected url ${channelId}`);
    }
    channelId = channelId.substr(feedUrlPrefix.length);

    return {
      channelId,
      channelName,
    };
  });
}

export function parseChannelFeed(xmlContent: string): VideoStorage[] {
  try {
    const xml = parseXml(xmlContent);
    const feed = filterChildrenFormatting(
      xml.children
    )[0] as parseXml.XmlElement;
    if (feed.name !== "feed") {
      console.log("feed", feed);
      throw new Error("can't find feed");
    }

    const videos: VideoStorage[] = [];
    for (const entry of filterChildrenFormatting(
      feed.children
    ) as parseXml.XmlElement[]) {
      let videoId;
      let channelId;
      let title;
      let published;
      let description;
      try {
        if (entry.name !== "entry") {
          continue;
        }

        for (const entryChild of filterChildrenFormatting(
          entry.children
        ) as parseXml.XmlElement[]) {
          if (entryChild.name === "yt:videoId") {
            videoId = getChildText(entryChild);
          } else if (entryChild.name === "yt:channelId") {
            channelId = getChildText(entryChild);
          } else if (entryChild.name === "published") {
            published = getChildText(entryChild);
          } else if (entryChild.name === "title") {
            title = getChildText(entryChild);
          } else if (entryChild.name === "media:group") {
            for (const mediaChild of filterChildrenFormatting(
              entryChild.children
            ) as parseXml.XmlElement[]) {
              if (mediaChild.name === "media:description") {
                description = "";
                for (const descriptionNode of mediaChild.children) {
                  if (descriptionNode.type !== "text") {
                    throw new Error("expected only text node in description");
                  }
                  description += (descriptionNode as parseXml.XmlText).text;
                }
                break;
              }
            }
          }
        }
      } catch (e) {
        throw new WrappedError(`failed in video ${videoId}`, e);
      }

      if (
        !videoId ||
        !channelId ||
        !title ||
        !published ||
        description === undefined
      ) {
        throw new Error(
          "missing data for entry\n" +
            `videoId ${videoId}\n` +
            `channelId ${channelId}\n` +
            `title ${title}\n` +
            `published ${published}\n` +
            `description ${description}\n`
        );
      }

      videos.push({
        channelId,
        description,
        published,
        title,
        videoId,
      });
    }

    return videos;
  } catch (e) {
    fs.promises.writeFile("error.xml", xmlContent);
    throw new WrappedError("Failed to import xml, wrote to error.xml", e);
  }
}

/**
 * Remove spacing text nodes from XML formatting
 * @param children
 */
function filterChildrenFormatting(
  children: parseXml.XmlNode[]
): parseXml.XmlNode[] {
  const newChildren = [...children];
  for (let i = newChildren.length - 1; i >= 0; i--) {
    const node = newChildren[i];
    if (node.type === "text" && (node as parseXml.XmlText).text.trim() === "") {
      newChildren.splice(i, 1);
    }
  }
  return newChildren;
}

function getChildText(element: parseXml.XmlElement, failOnEmpty = true) {
  if (element.children.length !== 1) {
    throw new Error("too many children");
  }
  const child = element.children[0] as parseXml.XmlText;
  if (child.type !== "text") {
    throw new Error("expected text node");
  }
  const text = child.text.trim();
  if (failOnEmpty && text === "") {
    throw new Error("empty text node?");
  }
  return text;
}
