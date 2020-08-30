import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { ISqlite } from "sqlite/build/interfaces";
import { promiseAllThrow } from "./apputil";
import { WrappedError } from "./error";
import util from "util";
import { Context } from "..";
import _ from "lodash";

export interface VideoStorage {
  videoId: string;
  channelId: string;
  published: string;
  title: string;
  description: string;
}

export interface SubscriptionStorageSimple {
  channelId: string;
  channelName: string;
  lastUpdated?: string;
}

export interface SubscriptionStorage extends SubscriptionStorageSimple {
  groups?: string;
  groupsArray: string[];
}

export interface ChannelGroup {
  groupName: string;
}

export interface ChannelGroupMapping {
  channelId: string;
  groupName: string;
}

type DB = Database<sqlite3.Database, sqlite3.Statement>;

export type GetVideoOptions = {
  group?: string;
  channelId?: string;
  limit?: number;
};

type GetChannelOptions = {
  notUpdatedIn?: string;
};

export class Storage {
  public static async create(dbpath: string) {
    const db = await open({
      filename: dbpath,
      driver: sqlite3.Database
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
            "lastScanned" varchar(26)
        )`);
    } catch (e) {
      throw new WrappedError("Failed to create subscriptions table", e);
    }

    try {
      await db.run(`
        create table if not exists "channelGroup" (
            "groupName" text not null primary key
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

    return new Storage(db);
  }

  private db: DB;

  private constructor(db: DB) {
    this.db = db;
  }

  public async addVideos(videos: VideoStorage[]) {
    if (videos.length == 0) {
      return;
    }
    let sql = undefined;
    // let txActive = false;
    try {
      // await this.db.run("begin transaction");
      // txActive = true;

      const sqlPlaceholders = videos.map(entry => "(?, ?, ?, ?, ?)").join(", ");
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

  public async getVideos(
    options: GetVideoOptions
  ): Promise<VideoStorage[] & SubscriptionStorage[]> {
    let sql = "";
    try {
      const sqlPlaceholders: any[] = [];
      let having = "";
      let where = "";

      if (options.group != undefined) {
        having = " HAVING groups LIKE ?";
        sqlPlaceholders.push(`%${options.group}%`);
      }

      if (options.channelId != undefined) {
        where = " WHERE videos.channelId = ?";
        sqlPlaceholders.push(options.channelId);
      }

      sql = `
      SELECT 
        *,
        group_concat(groupName) as groups
      FROM videos
      LEFT JOIN channelGroupMap USING (channelId)
      LEFT JOIN subscriptions USING (channelId)
      ${where}
      GROUP BY videos.videoId
      ${having}
      ORDER BY datetime(published) DESC
      LIMIT ?
      `;
      sqlPlaceholders.push(options.limit);

      return await this.db.all(sql, sqlPlaceholders);
    } catch (e) {
      const debugOpts = JSON.stringify(options);
      throw new WrappedError(`Failed to get videos\n${sql}\n${debugOpts}`, e);
    }
  }

  public async addSubscriptions(subscriptions: SubscriptionStorageSimple[]) {
    if (subscriptions.length == 0) {
      return;
    }
    let sql = undefined;
    // let txActive = false;
    try {
      // await this.db.run("begin transaction");
      // txActive = true;

      const sqlPlaceholders = subscriptions.map(entry => "(?, ?)").join(", ");
      const sqlValues = [];
      for (const subscription of subscriptions) {
        sqlValues.push(subscription.channelId);
        sqlValues.push(subscription.channelName);
      }
      // upsert syntax
      sql =
        `INSERT INTO subscriptions (channelId, channelName) VALUES ${sqlPlaceholders}` +
        "ON CONFLICT(channelId) DO UPDATE SET channelName=excluded.channelName;";
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
      ORDER BY channelName
      `;

      return await this.db.all(sql);
    } catch (e) {
      throw new WrappedError(`failed to get subscriptions\n${sql}`, e);
    }
  }

  public async setSubscriptionsUpdated(
    channelIds: string[]
  ): Promise<ISqlite.RunResult<sqlite3.Statement>> {
    try {
      const sqlPlaceholders = channelIds.map(entry => "?").join(",");
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

  public async getChannelGroups() {
    try {
      return await this.db.all(`SELECT * FROM channelGroup`);
    } catch (e) {
      throw new WrappedError("failed to get channel groups", e);
    }
  }

  public async addChannelGroups(channelGroups: ChannelGroup[]) {
    return await this.upsert(
      channelGroups,
      (row, result) => {
        result.push(row.groupName);
      },
      // PRIMARY KEY will throw errors on duplicates, which is what we want for now
      sqlPlaceholders => `INSERT INTO channelgroup (groupName) VALUES (?)`
    );
  }

  public async addChannelGroupMapping(groupMappings: ChannelGroupMapping[]) {
    return await this.upsert(
      groupMappings,
      (row, result) => {
        result.push(row.channelId);
        result.push(row.groupName);
      },
      sqlPlaceholders =>
        `INSERT INTO channelGroupMap (channelId, groupName) VALUES ${sqlPlaceholders} ON CONFLICT DO NOTHING`
    );
  }

  public async removeChannelGroupMapping(groupMappings: ChannelGroupMapping[]) {
    // no real easy way to do batching
    for (const groupMapping of groupMappings) {
      await this.db.run(
        "DELETE FROM channelGroupMap WHERE groupName = ? AND channelId = ?",
        [groupMapping.groupName, groupMapping.channelId]
      );
    }
  }

  private async upsert<T>(
    rows: T[],
    valueMapper: (row: T, result: any[]) => void,
    query: (sqlPlaceholders: string) => string
  ) {
    if (rows.length == 0) {
      return;
    }
    let sql = undefined;
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
      if (rows.length == 1) {
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
