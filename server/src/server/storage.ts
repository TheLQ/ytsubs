import _, { cond, includes } from "lodash";
import moment from "moment";
import { Database, open } from "sqlite";
import { ISqlite } from "sqlite/build/interfaces";
import sqlite3 from "sqlite3";
import { optionsCors } from ".";
import { WrappedError } from "../common/util/error";
import {
  ChannelGroup,
  ChannelGroupMapping,
  VideoStorage,
  GetVideoOptions,
  GetChannelOptions,
  GetVideosResult,
  SubscriptionStorageSimple,
  SubscriptionStorage,
  GROUP_MAGIC_NONE,
} from "../common/util/storage";
import util from "util";
import e from "express";
import logger from "./util/logger";

const log = logger("server/storage");

type DB = Database;

/**
 * Persistent Database API
 */
export class Storage {
  public static async create(dbpath: string) {
    const db = await open({
      driver: sqlite3.Database,
      filename: dbpath,
    });

    try {
      await db.run(`PRAGMA foreign_keys = ON`);
    } catch (e) {
      throw new WrappedError("Failed to enable foreign keys", e);
    }

    try {
      await db.run(`
      create table if not exists "videos" (
          "videoId" varchar(11) not null primary key,
          "channelId" varchar(22) not null,
          "published" varchar(26) not null,
          "title" text not null,
          "description" text not null
      )`);
    } catch (e) {
      throw new WrappedError("Failed to create videos table", e);
    }

    try {
      await db.run(`
        create table if not exists "subscriptions" (
            "channelId" varchar(22) not null primary key,
            "channelName" text not null,
            "lastScanned" varchar(26),
            thumbnailMedium  TEXT,
            thumbnailDefault TEXT,
            thumbnailHigh    TEXT,
            channelDescription      TEXT
        )`);
    } catch (e) {
      throw new WrappedError("Failed to create subscriptions table", e);
    }

    try {
      await db.run(`
        create table if not exists "channelGroup" (
            "groupName" text not null primary key,
            "color" varchar(6)
        )`);
    } catch (e) {
      throw new WrappedError("Failed to create channelGroup table", e);
    }

    try {
      await db.run(`
        create table if not exists "channelGroupMap" (
            "channelId" text not null,
            "groupName" text not null,
            FOREIGN KEY(groupName) REFERENCES channelGroup(groupName)
            FOREIGN KEY(channelId) REFERENCES subscriptions(channelId)
            UNIQUE(channelId, groupName)
        )`);
    } catch (e) {
      throw new WrappedError("Failed to create channelGroupMap table", e);
    }

    try {
      await db.run(`
        create table if not exists "options" (
            "key" text not null,
            "value" text not null,
            UNIQUE(key)
        )`);
    } catch (e) {
      throw new WrappedError("Failed to create options table", e);
    }

    return new Storage(db);
  }

  private db: DB;

  private constructor(db: DB) {
    this.db = db;
  }

  public async addVideos(videos: VideoStorage[]) {
    if (videos.length === 0) {
      return;
    }
    let sql = null;
    // let txActive = false;
    try {
      // await this.db.run("begin transaction");
      // txActive = true;

      const sqlPlaceholders = videos
        .map((entry) => "(?, ?, ?, ?, ?)")
        .join(", ");
      const sqlValues = [];
      for (const video of videos) {
        sqlValues.push(video.videoId);
        sqlValues.push(video.channelId);
        sqlValues.push(video.published);
        sqlValues.push(video.title);
        sqlValues.push(video.description);
      }

      // upsert syntax
      sql =
        `INSERT INTO videos (videoId, channelId, published, title, description) VALUES ${sqlPlaceholders}` +
        "ON CONFLICT(videoId) DO UPDATE SET title=excluded.title, description=excluded.description;";
      await this.db.run(sql, sqlValues);

      // await this.db.run("commit");
    } catch (e) {
      // if (txActive) {
      //   await this.db.run("rollback");
      // }
      const input = JSON.stringify(videos, null, 4);
      throw new WrappedError(`failed to add videos\n${sql}\n${input}`, e);
    }
  }

  public async getVideosOnly(): Promise<VideoStorage[]> {
    return await this.db.all("SELECT * from videos");
  }

  public async getVideos(options: GetVideoOptions): Promise<GetVideosResult[]> {
    let sql = "";
    try {
      const sqlPlaceholders: any[] = [];

      const whereConditions: string[] = [];
      if (options.channelId !== undefined) {
        whereConditions.push("videos.channelId = ?");
        sqlPlaceholders.push(options.channelId);
      }
      if (options.publishedAfter !== undefined) {
        whereConditions.push("datetime(published) < datetime(?)");
        sqlPlaceholders.push(options.publishedAfter);
      }
      const whereQuery =
        whereConditions.length == 0
          ? ""
          : " WHERE " + whereConditions.join(" AND ");

      const havingConditions: string[] = [];
      if (options.groups !== undefined && options.groups.length > 0) {
        // Include = *any* channel contains the groups
        // Exclude = *no* channel contains the groups
        const havingIncluded = [];
        const havingExcluded = [];
        for (const filter of options.groups) {
          if (filter.name == GROUP_MAGIC_NONE) {
            if (filter.included) {
              havingIncluded.push("groups IS NULL");
            } else {
              havingExcluded.push("groups IS NOT NULL");
            }
          } else {
            if (filter.included) {
              havingIncluded.push("groups LIKE ?");
            } else {
              havingExcluded.push("groups NOT LIKE ?");
            }
            sqlPlaceholders.push(`%${filter.name}%`);
          }
        }

        if (havingIncluded.length > 0) {
          havingConditions.push("(" + havingIncluded.join(" OR ") + ")");
        }
        // having is joined with AND so re-use it
        for (const excluded of havingExcluded) {
          havingConditions.push(excluded);
        }
      }
      const havingQuery =
        havingConditions.length == 0
          ? ""
          : " HAVING " + havingConditions.join(" AND ");

      sql = `
      SELECT
        *,
        group_concat(groupName) as groups
      FROM videos
      LEFT JOIN channelGroupMap USING (channelId)
      LEFT JOIN subscriptions USING (channelId)
      ${whereQuery}
      GROUP BY videos.videoId
      ${havingQuery}
      ORDER BY datetime(published) DESC
      LIMIT ?
      `;
      sqlPlaceholders.push(options.limit);

      log.debug("sql" + sql);
      log.debug("place \n" + sqlPlaceholders.join("\n"));

      const result = await this.db.all(sql, sqlPlaceholders);
      log.debug("returned " + result.length);
      for (const row of result) {
        row.publishedRelative = moment(row.published).fromNow();
      }
      return result;
    } catch (e) {
      const debugOpts = JSON.stringify(options);
      throw new WrappedError(`Failed to get videos\n${sql}\n${debugOpts}`, e);
    }
  }

  public async addSubscriptions(subscriptions: SubscriptionStorageSimple[]) {
    if (subscriptions.length === 0) {
      return;
    }
    let sql = null;
    // let txActive = false;
    try {
      // await this.db.run("begin transaction");
      // txActive = true;

      let sqlPlaceholders = "(" + Array(6).fill("?").join(",") + ")";
      sqlPlaceholders = Array(subscriptions.length)
        .fill(sqlPlaceholders)
        .join(",");

      const sqlValues = [];
      for (const subscription of subscriptions) {
        sqlValues.push(subscription.channelId);
        sqlValues.push(subscription.channelName);
        sqlValues.push(subscription.thumbnailMedium);
        sqlValues.push(subscription.thumbnailDefault);
        sqlValues.push(subscription.thumbnailHigh);
        sqlValues.push(subscription.channelDescription);
      }
      // upsert syntax
      sql = `INSERT INTO subscriptions (channelId, channelName, thumbnailMedium, thumbnailDefault, thumbnailHigh, channelDescription) VALUES ${sqlPlaceholders}
        ON CONFLICT(channelId) DO UPDATE SET
        channelName=excluded.channelName,
        thumbnailMedium = excluded.thumbnailMedium,
        thumbnailDefault = excluded.thumbnailDefault,
        thumbnailHigh = excluded.thumbnailHigh,
        channelDescription = excluded.channelDescription;";
        `;
      await this.db.run(sql, sqlValues);

      // await this.db.run("commit");
    } catch (e) {
      // if (txActive) {
      //   await this.db.run("rollback");
      // }
      const input = JSON.stringify(subscriptions, null, 4);
      throw new WrappedError(
        `failed to add subscriptions\n${sql}\n${input}`,
        e
      );
    }
  }

  public async getSubscriptionsSimple() {
    let sql: string = "";
    try {
      sql = "SELECT * FROM subscriptions";
      return await this.db.all(sql);
    } catch (e) {
      throw new WrappedError(`failed to get subscriptions\n${sql}`, e);
    }
  }

  public async getSubscriptions(
    options?: GetChannelOptions
  ): Promise<SubscriptionStorage[]> {
    let sql: string = "";
    try {
      let where = "";
      if (options?.notUpdatedIn) {
        where += ` WHERE lastScanned IS NULL or datetime(lastScanned) < datetime('now','${options.notUpdatedIn}')`;
      }

      sql = `
      SELECT
        *,
        group_concat(groupName) as groups
      FROM subscriptions
      LEFT JOIN channelGroupMap USING (channelId)
      GROUP BY subscriptions.channelId
      ORDER BY channelName COLLATE NOCASE
      `;

      return await this.db.all(sql);
    } catch (e) {
      throw new WrappedError(`failed to get subscriptions\n${sql}`, e);
    }
  }

  public async setSubscriptionsUpdated(
    channelIds: string[]
  ): Promise<ISqlite.RunResult> {
    try {
      const sqlPlaceholders = channelIds.map((entry) => "?").join(",");
      return await this.db.run(
        `UPDATE subscriptions SET lastScanned=datetime('now') WHERE channelId IN (${sqlPlaceholders})`,
        channelIds
      );
    } catch (e) {
      throw new WrappedError(
        `Failed to update subscriptions for ${channelIds}`,
        e
      );
    }
  }

  public async getChannelGroups(): Promise<ChannelGroup[]> {
    try {
      return await this.db.all(`SELECT * FROM channelGroup ORDER BY groupName`);
    } catch (e) {
      throw new WrappedError("failed to get channel groups", e);
    }
  }

  public async setGroupColor(channelGroup: string, color: string) {
    try {
      return await this.db.run(
        `UPDATE channelGroup SET color = (?) WHERE groupName = ?`,
        color,
        channelGroup
      );
    } catch (e) {
      throw new WrappedError("failed to get channel groups", e);
    }
  }

  public async addChannelGroup(groupName: string): Promise<void> {
    const res = await this.db.run(
      "INSERT INTO channelgroup (groupName) VALUES (?)",
      [groupName]
    );
    if (res.changes != 1) {
      throw new Error(
        `Failed to insert group ${groupName} rows affected ${res.changes}`
      );
    }
  }

  public async removeChannelGroup(groupName: string): Promise<void> {
    const res = await this.db.run(
      "DELETE FROM channelgroup WHERE groupName = ?",
      [groupName]
    );
    if (res.changes != 1) {
      throw new Error(
        `Failed to delete group ${groupName} rows affected ${res.changes}`
      );
    }
  }

  public async addChannelGroupMapping(
    groupMappings: ChannelGroupMapping[]
  ): Promise<void> {
    return await this.upsert(
      groupMappings,
      (row, result) => {
        result.push(row.channelId);
        result.push(row.groupName);
      },
      (sqlPlaceholders) =>
        `INSERT INTO channelGroupMap (channelId, groupName) VALUES ${sqlPlaceholders} ON CONFLICT DO NOTHING`
    );
  }

  public async removeChannelGroupMapping(
    groupMappings: ChannelGroupMapping[]
  ): Promise<void> {
    // no real easy way to do batching
    for (const groupMapping of groupMappings) {
      const res = await this.db.run(
        "DELETE FROM channelGroupMap WHERE groupName = ? AND channelId = ?",
        [groupMapping.groupName, groupMapping.channelId]
      );
      if (res.changes != 1) {
        throw new Error(
          `Failed to delete ${groupMapping.channelId} group ${groupMapping.groupName} rows affected ${res.changes}`
        );
      }
    }
  }

  public async getOption(key: string): Promise<string | null> {
    const result = await this.db.all(
      "SELECT value FROM options WHERE key = ?",
      [key]
    );
    if (result.length === 0) {
      return null;
    } else if (result.length > 1) {
      throw new Error("Found multiple keys?");
    }
    return result[0].value;
  }

  public async setOption(key: string, value: string): Promise<void> {
    return await this.upsert(
      [null],
      (row, result) => {
        result.push(key, value);
      },
      (sqlPlaceholders) => `INSERT INTO options (key, value) VALUES (?, ?)`
    );
  }

  private async upsert<T>(
    rows: T[],
    valueMapper: (row: T, result: any[]) => void,
    query: (sqlPlaceholders: string) => string
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }
    let sql = null;
    // let txActive = false;
    try {
      // await this.db.run("begin transaction");
      // txActive = true;

      const firstRowValues: any[] = [];
      valueMapper(rows[0], firstRowValues);
      const placeholder =
        "(" + _.fill(Array(firstRowValues.length), "?").join(", ") + ")";

      let sqlPlaceholders = placeholder;
      let sqlValues = firstRowValues;
      if (rows.length === 1) {
        sqlPlaceholders = placeholder;
        sqlValues = firstRowValues;
      } else {
        sqlPlaceholders = _.fill(Array(rows.length), placeholder).join(", ");

        let first = true;
        for (const row of rows) {
          if (first) {
            // inited with first row's values
            first = false;
            continue;
          }
          valueMapper(row, sqlValues);
        }
      }

      // upsert syntax
      sql = query(sqlPlaceholders);
      await this.db.run(sql, sqlValues);

      // await this.db.run("commit");
    } catch (e) {
      // if (txActive) {
      //   await this.db.run("rollback");
      // }
      const input = JSON.stringify(rows, null, 4);
      throw new WrappedError(`failed to add rows\n${sql}\n${input}`, e);
    }
  }
}
