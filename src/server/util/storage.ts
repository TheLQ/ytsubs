import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { ISqlite } from "sqlite/build/interfaces";
import { promiseAllThrow } from "./apputil";
import { WrappedError } from "./error";
import util from "util";
import { Context } from "..";

export interface VideoStorage {
  videoId: string;
  channelId: string;
  published: string;
  title: string;
  description: string;
}

export interface SubscriptionStorage {
  channelId: string;
  channelName: string;
  lastUpdated?: string;
}

type DB = Database<sqlite3.Database, sqlite3.Statement>;

export class Storage {
  public static async create(dbpath: string) {
    const db = await open({
      filename: dbpath,
      driver: sqlite3.Database
    });

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
      db.run(
        'DELETE FROM subscriptions WHERE channelId="UCGib-bLlq8HTRp2YaEESxeg"'
      );
    } catch (e) {
      throw new WrappedError("Failed to create videos table", e);
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

  public async getVideos(): Promise<VideoStorage[]> {
    return await this.db.all("SELECT * from videos");
  }

  public async getVideosWithChannelName(
    limit: number
  ): Promise<VideoStorage[] & SubscriptionStorage[]> {
    return await this.db.all(
      "SELECT * from videos" +
        " INNER JOIN subscriptions ON subscriptions.channelId = videos.channelId" +
        " ORDER BY datetime(published) DESC" +
        ` LIMIT ${limit}`
    );
  }

  public async addSubscriptions(subscriptions: SubscriptionStorage[]) {
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

  public async getSubscriptions(
    options?: subscriptionOptions
  ): Promise<SubscriptionStorage[]> {
    let query = "SELECT * from subscriptions";
    if (options?.notUpdatedIn) {
      query += ` WHERE lastScanned IS NULL or datetime(lastScanned) < datetime('now','${options.notUpdatedIn}')`;
    }
    return await this.db.all(query);
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
}

type subscriptionOptions = {
  notUpdatedIn?: string;
};
