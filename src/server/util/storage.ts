import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { promiseAllThrow } from "./apputil";
import { WrappedError } from "./error";
import util from "util";
import { Context } from "..";

interface IVideoStorage {
  videoId: string;
  channelId: string;
  published: string;
  title: string;
  description: string;
}

export interface SubscriptionStorage {
  channelId: string;
  name: string;
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
          "published" varchar(11) not null,
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
            "name" text not null
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

  public async addVideos(videos: IVideoStorage[]) {
    await this.db.run("begin transaction");

    const stmt = await this.db.prepare(
      "insert into videos (videoId, channelId, published, title, description) values (?, ?, ?, ?, ?)"
    );
    await promiseAllThrow(
      videos.map(video =>
        stmt.run(
          video.videoId,
          video.channelId,
          video.published,
          video.title,
          video.description
        )
      ),
      "failed to send statements"
    );

    await this.db.run("commit");
  }

  public async getVideos(): Promise<IVideoStorage[]> {
    return await this.db.all("SELECT * from videos");
  }

  public async addSubscriptions(subscriptions: SubscriptionStorage[]) {
    let sql = undefined;
    try {
      await this.db.run("begin transaction");

      const sqlPlaceholders = subscriptions.map(entry => "(?, ?)").join(", ");
      const sqlValues = [];
      for (const subscription of subscriptions) {
        sqlValues.push(subscription.channelId);
        sqlValues.push(subscription.name);
      }
      // upsert syntax
      sql = `INSERT INTO subscriptions (channelId, name) VALUES ${sqlPlaceholders} ON CONFLICT(channelId) DO UPDATE SET name=excluded.name;`;
      await this.db.run(sql, sqlValues);

      await this.db.run("commit");
    } catch (e) {
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
