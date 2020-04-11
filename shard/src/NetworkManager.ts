import bcrypt from "bcryptjs";
import io from "socket.io-client";
import config from "./config";
import OpenBump from "./OpenBump";

export default class NetworkManager {
  private socket!: SocketIOClient.Socket;

  constructor(private instance: OpenBump) {}

  public async init() {
    const token = config.discord.token;
    const hashed = bcrypt.hashSync(token, bcrypt.genSaltSync(10));

    this.socket = io("http://localhost:3000", {
      query: { authorization: hashed, shard: config.discord.shard }
    });
    this.socket.on("connect", () => {
      console.log("Websocket connected");
    });
  }
}
