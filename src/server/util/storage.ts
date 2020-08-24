import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
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
            "channelName" text not null
        )`);
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
    let sql = undefined;
    try {
      await this.db.run("begin transaction");

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

      await this.db.run("commit");
    } catch (e) {
      await this.db.run("rollback");
      const input = JSON.stringify(videos, null, 4);
      throw new WrappedError(`failed to add videos\n${sql}\n${input}`, e);
    }
  }

  public async getVideos(): Promise<VideoStorage[]> {
    return await this.db.all("SELECT * from videos");
  }

  public async getVideosWithChannelName(): Promise<
    VideoStorage[] & SubscriptionStorage[]
  > {
    return await this.db.all(
      "SELECT * from videos INNER JOIN subscriptions ON subscriptions.channelId = videos.channelId;"
    );
  }

  public async addSubscriptions(subscriptions: SubscriptionStorage[]) {
    let sql = undefined;
    try {
      await this.db.run("begin transaction");

      const sqlPlaceholders = subscriptions.map(entry => "(?, ?)").join(", ");
      const sqlValues = [];
      for (const subscription of subscriptions) {
        sqlValues.push(subscription.channelId);
        sqlValues.push(subscription.channelName);
      }
      // upsert syntax
      sql =
        `INSERT INTO subscriptions (channelId, channelName) VALUES ${sqlPlaceholders}` +
        "ON CONFLICT(channelId) DO UPDATE SET name=excluded.name;";
      await this.db.run(sql, sqlValues);

      await this.db.run("commit");
    } catch (e) {
      await this.db.run("rollback");
      const input = JSON.stringify(subscriptions, null, 4);
      throw new WrappedError(
        `failed to add subscriptions\n${sql}\n${input}`,
        e
      );
    }
  }

  public async getSubscriptions(): Promise<SubscriptionStorage[]> {
    return await this.db.all("SELECT * from subscriptions");
  }
}
