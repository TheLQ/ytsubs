import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import { promiseAllThrow } from "./apputil";
import { WrappedError } from "./error";

interface IVideoStorage {
  videoId: string;
  channelId: string;
  published: string;
  title: string;
  description: string;
}

interface SubscriptionStorage {
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
          "videoId" varchar(11) not null,
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
            "channelId" varchar(22) not null,
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
    const value = await this.db.get("SELECT * from videos");
    if (value == undefined) {
      return [];
    } else {
      return value;
    }
  }

  public async addSubscriptions(subscriptions: SubscriptionStorage[]) {
    await this.db.run("begin transaction");

    const stmt = await this.db.prepare(
      "insert into subscriptions (channelId, name) values (?, ?)"
    );
    await promiseAllThrow(
      subscriptions.map(subscription =>
        stmt.run(subscription.channelId, subscription.name)
      ),
      "failed to send statements"
    );

    await this.db.run("commit");
  }

  public async getSubscriptions(): Promise<SubscriptionStorage[]> {
    const value = await this.db.get("SELECT * from videos");
    if (value == undefined) {
      return [];
    } else {
      return value;
    }
  }
}
