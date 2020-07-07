import Discord, { ClientUser } from "discord.js";
import ms from "ms";
import fetch from "node-fetch";
import { Op } from "sequelize";
import config from "./config";
import Application from "./models/Application";
import ApplicationFeature from "./models/ApplicationFeature";
import Guild from "./models/Guild";
import OpenBump from "./OpenBump";
import Utils, { GuildMessage, RawGuildMessage } from "./Utils";

export enum MessageType {
  "REQUEST" = "REQUEST",
  "START" = "START",
  "FINISHED" = "FINISHED",
  "ERROR" = "ERROR"
}

export enum ErrorCode {
  "MISSING_SETUP" = "MISSING_SETUP",
  "COOLDOWN" = "COOLDOWN",
  "AUTOBUMP" = "AUTOBUMP",
  "NOT_FOUND" = "NOT_FOUND",
  "OTHER" = "OTHER"
}

export type SBLPPayload =
  | BumpRequest
  | BumpStartedResponse
  | BumpFinishedResponse
  | BumpErrorResponse;

export interface HTTPBumpRequest {
  guild: string;
  channel: string;
  user: string;
}

export interface OpenBumpFamilyBaseError {
  error: true;
  status: number;
  code: string;
  message?: string;
}

export type HTTPBumpResponse =
  | BumpFinishedResponse
  | BumpErrorResponse
  | OpenBumpFamilyBaseError;

export interface BumpRequest {
  type: MessageType.REQUEST;
  guild: string;
  channel: string;
  user: string;
}

export interface BumpStartedResponse {
  type: MessageType.START;
  response: string;
}

export interface BumpFinishedResponse {
  type: MessageType.FINISHED;
  response: string;
  amount?: number;
  nextBump: number;
  message?: string;
  error?: void;
}

export interface BumpErrorResponse {
  type: MessageType.ERROR;
  response: string;
  code: ErrorCode;
  nextBump?: number;
  message?: String;
  error?: void;
}

export class SBLPSchemaError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class SBLPBumpEntity {
  private sblp: SBLP;

  public id!: string;
  private mine: boolean;
  private providers: { [id: string]: SBLPPayload } = {};
  private updateHandlers: Array<() => void> = [];
  private finalHandlers: Array<(response: HTTPBumpResponse) => void> = [];
  public timeout = false;

  constructor(
    id: string | undefined,
    private provider: string,
    private http: boolean,
    private communication: { guild: string; channel: string } | undefined,
    private guild: string,
    private channel: string,
    private user: string
  ) {
    if (id) this.id = id;
    this.mine = provider === OpenBump.instance.client.user?.id;
    this.sblp = OpenBump.instance.sblp.registerEntity(this);
    if (this.mine) this.handleInside();
    else this.handleOutside();
  }

  public onUpdate(handler: () => void) {
    if (!this.updateHandlers.includes(handler))
      this.updateHandlers.push(handler);
  }

  public onFinal(handler: (response: HTTPBumpResponse) => void) {
    if (!this.finalHandlers.includes(handler)) this.finalHandlers.push(handler);
  }

  private triggerUpdate() {
    for (const handler of this.updateHandlers) handler();
  }

  private triggerFinal(response: HTTPBumpResponse) {
    for (const handler of this.finalHandlers) handler(response);
  }

  public getProviderStates() {
    return Object.keys(this.providers).map((provider) => ({
      provider,
      message: this.getProviderState(provider)
    }));
  }

  public getProviderState(provider: string) {
    let message = this.timeout ? "Timeout" : "Unknown";
    const lastPayload = this.providers[provider];
    if (lastPayload.type === MessageType.START && !this.timeout) {
      message = "Bumping...";
    } else if (lastPayload.type === MessageType.FINISHED) {
      if (lastPayload.amount) {
        message = `Successfully bumped [${lastPayload.amount} servers]`;
      } else {
        message = `Successfully bumped`;
      }
    } else if (lastPayload.type === MessageType.ERROR) {
      if (lastPayload.code === ErrorCode.COOLDOWN) {
        if (lastPayload.nextBump) {
          message = `Cooldown left [${ms(lastPayload.nextBump - Date.now(), {
            long: true
          })}]`;
        } else {
          message = `Cooldown left`;
        }
      } else if (lastPayload.code === ErrorCode.MISSING_SETUP) {
        message = `Not setup yet`;
      } else if (lastPayload.code === ErrorCode.AUTOBUMP) {
        message = `Autobump enabled`;
      } else if (lastPayload.code === ErrorCode.NOT_FOUND) {
        message = `Guild not found`;
      } else {
        if (lastPayload.message) {
          message = `Error: ${
            lastPayload.message.length > 24
              ? `${lastPayload.message.substring(0, 24)}...`
              : lastPayload.message
          }`;
        } else {
          message = `Unknown error`;
        }
      }
    } else if (!this.timeout) {
      message = `Loading...`;
    }
    return message;
  }

  public async handleInside() {
    await this.postBumpRequest();

    const guildDatabase = await Guild.findOne({ where: { id: this.guild } });

    const applications = await Application.findAll({
      where: {
        sblpEnabled: true,
        ...(!guildDatabase?.sandbox
          ? { sblpSandbox: { [Op.or]: [null, false] } }
          : {}),
        bot: {
          [Op.ne]: null
        }
      },
      include: [
        {
          model: ApplicationFeature,
          as: "features",
          where: {
            feature: "SBLP"
          }
        }
      ]
    });

    console.log("applications", applications.length);

    for (const application of applications) {
      this.postHTTPBumpRequest(application);
    }

    setTimeout(() => {
      if (this.sblp.isRegistered(this)) {
        // Timeout after 60 seconds
        this.timeout = true;
        this.triggerUpdate();
        this.updateHandlers = [];
        this.sblp.unregisterEntity(this);
        console.log("[SBLP] Unregistered entity after 60 seconds");
      }
    }, 60 * 1000);
  }

  private async postHTTPBumpRequest(application: Application) {
    console.log("before");
    if (
      !application.features.find(({ feature }) => feature === "SBLP") ||
      !application.sblpEnabled ||
      !application.bot
    )
      return;
    console.log("after");
    try {
      const prototypeStartResponse: BumpStartedResponse = {
        type: MessageType.START,
        response: "HTTP"
      };
      this.providers[application.bot] = prototypeStartResponse;

      let url = application.sblpBase;
      if (!url.endsWith("/")) url += "/";
      url += "request";

      console.log("url", url);

      const res: HTTPBumpResponse = await fetch(url, {
        method: "POST",
        headers: {
          authorization: application.sblpAuthorization,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          guild: this.guild,
          channel: this.channel,
          user: this.user
        })
      }).then((res) => res.json());

      console.log("response", res);

      if (this.timeout) return;

      if (res.error) {
        throw res;
      } else {
        this.providers[application.bot] = res;
      }
      this.triggerUpdate();
    } catch (error) {
      console.log("error", error);
      if (this.timeout) return;
      const prototypeErrorResponse: BumpErrorResponse = {
        type: MessageType.ERROR,
        response: "HTTP",
        code: ErrorCode.OTHER,
        message: `HTTP Error`
      };
      this.providers[application.bot] = prototypeErrorResponse;
    }
  }

  private async handleOutside() {
    // Inform bot that the process has been started
    if (!this.http) await this.postBumpStartedResponse();

    // Start bumping
    const payload = await SBLPBumpEntity.handleOutsideSharded(
      this.id,
      this.provider,
      this.guild,
      this.user
    );

    // Post payload
    if (!this.http) await this.post(payload);
    else this.triggerFinal(payload);
  }

  public static async handleOutsideSharded(
    id: string,
    provider: string,
    guildId: string,
    userId: string
  ) {
    const instance = OpenBump.instance;
    const sblp = instance.sblp;
    const guild = instance.client.guilds.cache.get(guildId);

    if (!guild)
      return sblp.createBumpErrorResponse(
        id,
        ErrorCode.NOT_FOUND,
        undefined,
        "Guild not found"
      );

    const guildDatabase = await Utils.ensureGuild(guild);

    if (
      guildDatabase.getFeatures().includes(Utils.Feature.AUTOBUMP) &&
      guildDatabase.autobump
    )
      return sblp.createBumpErrorResponse(
        id,
        ErrorCode.AUTOBUMP,
        undefined,
        "Autobump enabled"
      );

    const voted = await Utils.Lists.hasVotedTopGG(userId);

    const cooldown = guildDatabase.getCooldown(true, voted);
    const nextBump = guildDatabase.lastBumpedAt
      ? guildDatabase.lastBumpedAt.valueOf() + cooldown
      : 0;
    if (nextBump && nextBump > Date.now())
      return sblp.createBumpErrorResponse(
        id,
        ErrorCode.COOLDOWN,
        nextBump.valueOf(),
        "Cooldown"
      );

    const missing = Utils.Bump.getMissingValues(guild, guildDatabase);
    if (missing)
      return sblp.createBumpErrorResponse(
        id,
        ErrorCode.MISSING_SETUP,
        undefined,
        `Not setup yet`
      );

    // TODO: lastBumpedWith
    guildDatabase.lastBumpedAt = new Date();
    guildDatabase.lastBumpedBy = userId;
    guildDatabase.lastBumpedWith = provider;
    guildDatabase.totalBumps++;
    await guildDatabase.save();

    let bumpEmbed: Discord.MessageEmbedOptions;

    try {
      bumpEmbed = await Utils.Bump.getEmbed(guild, guildDatabase, userId);
    } catch (error) {
      return sblp.createBumpErrorResponse(
        id,
        ErrorCode.MISSING_SETUP,
        undefined,
        "Not setup yet"
      );
    }

    await Utils.Bump.bump(guildDatabase, bumpEmbed);

    return sblp.createBumpFinishedResponse(
      id,
      Date.now() + cooldown,
      undefined,
      "Success"
    );
  }

  public async receivePayload(
    provider: string,
    payload: BumpStartedResponse | BumpFinishedResponse | BumpErrorResponse
  ) {
    const providerData = this.providers[provider];
    if (
      providerData &&
      providerData.type !== MessageType.REQUEST &&
      providerData.response === "HTTP"
    )
      return;
    if (payload.type === MessageType.START) {
      // Another bump bot has started handling this request
      if (this.providers[provider])
        return void console.log(
          `[DEBUG] Ignoring a started payload from an already in-progress-bot (bot=${provider},payload.type)${payload.type})`
        );
      this.providers[provider] = payload;
      this.triggerUpdate();
    } else if (payload.type === MessageType.FINISHED) {
      // Another bump bot has finished handling this request
      this.providers[provider] = payload;
      this.triggerUpdate();
    } else if (payload.type === MessageType.ERROR) {
      // Another bump bot experied an error handling this request
      this.providers[provider] = payload;
      this.triggerUpdate();
    }
  }

  private async postBumpRequest() {
    const bumpRequest = this.sblp.createBumpRequest(
      this.guild,
      this.channel,
      this.user
    );
    const message = await this.post(bumpRequest);
    this.id = message || this.id;
    return;
  }

  private async postBumpStartedResponse() {
    const bumpStartedResponse = this.sblp.createBumpStartedResponse(this.id);
    return void (await this.post(bumpStartedResponse));
  }

  private async post(payload: SBLPPayload) {
    if (!this.communication?.guild || !this.communication.channel) return false;

    if (payload.type === MessageType.ERROR) {
      // TODO: Abort
      this.sblp.unregisterEntity(this);
      console.log(
        `[SBLP] Sent Error (message=${payload.message},id=${payload.response})`
      );
    } else if (payload.type === MessageType.FINISHED) {
      // TODO: Finish
      this.sblp.unregisterEntity(this);
      console.log(`[SBLP] Sent Finish (id=${payload.response})`);
    }

    return await OpenBump.instance.networkManager.emitMessage(
      this.communication.guild,
      this.communication.channel,
      JSON.stringify(payload, undefined, 2)
    );
  }

  private async debug(message: string) {
    if (!this.communication?.guild || !this.communication.channel) return false;

    return await OpenBump.instance.networkManager.emitMessage(
      this.communication.guild,
      this.communication.channel,
      message
    );
  }
}

export default class SBLP {
  private entities: Array<SBLPBumpEntity> = [];

  constructor(private instance: OpenBump) {}

  public isRegistered(entity: SBLPBumpEntity) {
    return this.entities.includes(entity);
  }

  public registerEntity(entity: SBLPBumpEntity) {
    if (!this.entities.includes(entity)) {
      this.entities.push(entity);
    }
    return this;
  }

  public unregisterEntity(entity: SBLPBumpEntity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
  }

  public getEntityById(id: string) {
    return this.entities.find((entity) => entity.id === id);
  }

  /**
   * Call this function when a message is received in any channel
   *
   * @param message The received message
   */
  public async onMessage(message: Discord.Message) {
    const author = message.author;
    if (!author.bot && !config.discord.admins.includes(author.id)) return; // Only allow bots and bot admins (debug)
    if (author instanceof ClientUser) return; // Ignore own messages
    if (!message.guild) return; // Only allow guild messages
    if (message.channel.type !== "text") return; // Only allow text channels
    if (
      config.settings.integration?.sblp.receive.includes(message.channel.id) ||
      (message.channel.parentID &&
        config.settings.integration?.sblp.receive.includes(
          message.channel.parentID
        ))
    ) {
      // Channel is a SBLP channel
      // Note: Open Bump will not use a whitelist system as it expects that only granted bots have access to the SBLP channel(s)

      const guildDatabase = await Guild.findOne({
        where: { id: message.guild.id }
      });

      const application = await Application.findOne({
        where: {
          bot: author.id,
          sblpEnabled: true,
          ...(!guildDatabase?.sandbox
            ? { sblpSandbox: { [Op.or]: [null, false] } }
            : {})
        },
        include: [
          {
            model: ApplicationFeature,
            as: "features",
            where: {
              feature: "SBLP"
            }
          }
        ]
      });
      if (application) return; // This bot uses communication over HTTP

      let payload: SBLPPayload;
      try {
        payload = JSON.parse(message.content);
      } catch (error) {
        // Invalid payload
        return void console.log(
          `[SBLP] Invalid payload received from ${author.tag} (${author.id}).`
        );
      }
      try {
        this.verifyPayload(payload);
      } catch (error) {
        if (error instanceof SBLPSchemaError) {
          // Invalid schema
          return void this.debug(
            message.channel,
            `[DEBUG] Invalid schema received: ${error.message}`
          );
        } else {
          // Unknown error
          return void console.log(
            `[SBLP] Unknown error occured while handling ${author.tag} (${author.id}).`
          );
        }
      }
      this.onPayload(
        message.author.id,
        payload,
        Utils.guildMessageToRaw(message as GuildMessage),
        false
      );
    }
  }

  private async debug(channel: Discord.TextChannel, message: string) {
    return await channel.send(message);
  }

  public async onPayload(
    provider: string,
    payload: SBLPPayload,
    message: RawGuildMessage,
    broadcasted: boolean
  ): Promise<void> {
    if (payload.type === MessageType.REQUEST) {
      const targetShardId = Utils.getShardId(
        payload.guild,
        this.instance.networkManager.total
      );
      if (this.instance.networkManager.id === targetShardId) {
        // Another bump bot is requesting this bot to bump a guild
        new SBLPBumpEntity(
          message.id,
          message.author.id,
          false,
          { guild: message?.guild?.id, channel: String(message?.channel?.id) },
          payload.guild,
          payload.channel,
          payload.user
        );
      } else {
        if (!broadcasted)
          this.instance.networkManager.emitSBLPOutside(
            provider,
            payload,
            message
          );
      }
    } else {
      // Another bump bot has started bumping a guild as requested by this bot
      const entity = this.getEntityById(payload.response);
      if (entity) entity.receivePayload(provider, payload);
      else if (!broadcasted)
        this.instance.networkManager.emitSBLPOutside(
          provider,
          payload,
          message
        ); // Only emit to other shards if message set (this = primary)
    }
  }

  public async onHTTPBumpRequest(
    application: Application,
    request: HTTPBumpRequest
  ): Promise<HTTPBumpResponse> {
    const entity = new SBLPBumpEntity(
      void 0,
      application.id,
      true,
      void 0,
      request.guild,
      request.channel,
      request.user
    );
    const response = await new Promise<HTTPBumpResponse>((resolve) =>
      entity.onFinal(resolve)
    );
    return response;
  }

  public createBumpRequest(
    guild: string,
    channel: string,
    user: string
  ): BumpRequest {
    return {
      type: MessageType.REQUEST,
      guild,
      channel,
      user
    };
  }

  public createBumpStartedResponse(response: string): BumpStartedResponse {
    return {
      type: MessageType.START,
      response
    };
  }

  public createBumpFinishedResponse(
    response: string,
    nextBump: number,
    amount?: number,
    message?: string
  ): BumpFinishedResponse {
    return {
      type: MessageType.FINISHED,
      response,
      amount,
      nextBump,
      message
    };
  }

  public createBumpErrorResponse(
    response: string,
    code: ErrorCode,
    nextBump?: number,
    message?: string
  ): BumpErrorResponse {
    return {
      type: MessageType.ERROR,
      response,
      code,
      nextBump,
      message
    };
  }

  /**
   * Verify the payload of a message
   */
  private verifyPayload(payload: SBLPPayload) {
    if (!payload || typeof payload !== "object")
      throw new SBLPSchemaError("payload");
    switch (payload.type) {
      case MessageType.REQUEST:
        if (!payload.guild || typeof payload.guild !== "string")
          throw new SBLPSchemaError("payload.guild");
        if (!payload.channel || typeof payload.channel !== "string")
          throw new SBLPSchemaError("payload.channel");
        if (!payload.user || typeof payload.user !== "string")
          throw new SBLPSchemaError("payload.user");
        break;
      case MessageType.START:
        if (!payload.response || typeof payload.response !== "string")
          throw new SBLPSchemaError("payload.response");
        break;
      case MessageType.FINISHED:
        if (!payload.response || typeof payload.response !== "string")
          throw new SBLPSchemaError("payload.response");
        if (payload.amount && typeof payload.amount !== "number")
          throw new SBLPSchemaError("payload.amount");
        if (!payload.nextBump || typeof payload.nextBump !== "number")
          throw new SBLPSchemaError("payload.nextBump");
        if (payload.message && typeof payload.message !== "string")
          throw new SBLPSchemaError("payload.message");
        break;
      case MessageType.ERROR:
        if (!payload.response || typeof payload.response !== "string")
          throw new SBLPSchemaError("payload.response");
        if (!payload.code || !Object.keys(ErrorCode).includes(payload.code))
          payload.code = ErrorCode.OTHER;
        if (payload.nextBump && typeof payload.nextBump !== "number")
          throw new SBLPSchemaError("payload.nextBump");
        if (payload.code === ErrorCode.COOLDOWN && !payload.nextBump)
          throw new SBLPSchemaError("payload.nextBump");
        if (payload.message && typeof payload.message !== "string")
          throw new SBLPSchemaError("payload.message");
        if (payload.code === ErrorCode.OTHER && !payload.message)
          throw new SBLPSchemaError("payload.message");
        break;
    }
  }
}
