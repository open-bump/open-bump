import express from "express";
import * as http from "http";
import path from "path";
import socket from "socket.io";
import config from "./config";
import Hub from "./Hub";

export default class ServerManager {
  private app: express.Application;
  private http: http.Server;
  private io: socket.Server;

  constructor(private instance: Hub) {
    this.app = express();
    this.http = http.createServer(this.app);
    this.io = socket(this.http);

    this.app.get("/", (_req, res) =>
      res.sendFile(path.join(instance.directory, "test.html"))
    );

    this.register();
  }

  private register() {
    this.io.on("connection", (socket) => {
      console.log("a shard connected", socket);
    });
  }

  public async init() {
    const port = config.settings.port;
    await new Promise((resolve) => this.http.listen(port, resolve));
    console.log(`Listening on *:${port}`);
  }
}
