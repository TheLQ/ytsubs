import sqlite from "sqlite";

interface IVideoStorage {
  videoId: string;
  channelId: string;
  published: string;
  title: string;
  description: string;
}

export class Storage {
  public static async create(dbpath: string) {
    const db = await sqlite.open(dbpath);

    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='{videos}';"
    );
    if (tableExists.length !== 1) {
      console.log("creating database");
      await db.run(`
        create table if not exists "videos" (
            "videoId" varchar(11) not null,
            "channelId" varchar(22) not null,
            "published" varchar(11) not null,
            "title" text not null,
            "description" text not null
        )
        `);
    }
    return new Storage(db);
  }

  private db: sqlite.Database;

  private constructor(db: sqlite.Database) {
    this.db = db;
  }

  public async addVideos(videos: IVideoStorage[]) {
    this.db.run("begin transaction");

    for (const video of videos) {
      this.db.run(
        "insert into videos (videoId, channelId, published, title, description) values (?, ?, ?, ?, ?)",
        video.videoId,
        video.channelId,
        video.published,
        video.title,
        video.description
      );
    }

    this.db.run("commit");
  }

  public async getVideos(): Promise<IVideoStorage[]> {
    return await this.db.get("SELECT * from videos");
  }
}
