import Discord, { ClientUser } from "discord.js";
import config from "./config";
import OpenBump from "./OpenBump";
import Utils, { GuildMessage } from "./Utils";

export enum MessageType {
  "REQUEST" = "REQUEST",
  "START" = "START",
  "FINISHED" = "FINISHED",
  "ERROR" = "ERROR"
}

export enum ErrorCode {
  "MISSING_SETUP" = "MISSING_SETUP",
  "COOLDOWN" = "COOLDOWN",
  "OTHER" = "OTHER"
}

export type SBLPPayload =
  | BumpRequest
  | BumpStartedResponse
  | BumpFinishedResponse
  | BumpErrorResponse;

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
}

export interface BumpErrorResponse {
  type: MessageType.ERROR;
  response: string;
  code: ErrorCode;
  nextBump?: number;
  message?: String;
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

  constructor(
    id: string | null,
    private provider: Discord.User,
    private communication: { guild: string; channel: string },
    private guild: string,
    private channel: string,
    private user: string
  ) {
    if (id) this.id = id;
    this.mine = provider instanceof Discord.ClientUser;
    if (!this.mine && !id)
      throw new Error(
        "Invalid input to SBLPBumpEntity: Others requests need an ID passed."
      );
    this.sblp = OpenBump.instance.sblp.registerEntity(this);
    if (this.mine) this.handleInside();
    else this.handleOutside();
  }

  public async handleInside() {
    await this.postBumpRequest();
  }

  private async handleOutside() {
    // Inform bot that the process has been started
    await this.postBumpStartedResponse();

    // Start bumping
    const payload = await SBLPBumpEntity.handleOutsideSharded(
      this.id,
      this.guild,
      this.user
    );

    // Post payload
    await this.post(payload);
  }

  public static async handleOutsideSharded(
    id: string,
    guildId: string,
    userId: string
  ) {
    const instance = OpenBump.instance;
    const sblp = instance.sblp;
    const guild = instance.client.guilds.cache.get(guildId);

    if (!guild)
      return sblp.createBumpErrorResponse(
        id,
        ErrorCode.OTHER,
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
        ErrorCode.OTHER,
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
        `Missing Setup`
      );

    // TODO: lastBumpedWith
    guildDatabase.lastBumpedAt = new Date();
    guildDatabase.lastBumpedBy = userId;
    guildDatabase.totalBumps++;
    await guildDatabase.save();

    let bumpEmbed: Discord.MessageEmbedOptions;

    try {
      bumpEmbed = await Utils.Bump.getEmbed(guild, guildDatabase, userId);
    } catch (error) {
      return sblp.createBumpErrorResponse(
        id,
        ErrorCode.OTHER,
        undefined,
        "Unexpected Error"
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
    if (payload.type === MessageType.START) {
      // Another bump bot has started handling this request
      if (this.providers[provider])
        return void console.log(
          "[SBLP] Ignoring a started payload from an already in-progress-bot"
        );
      this.providers[provider] = payload;
      // TODO: Toggle event
    } else if (payload.type === MessageType.FINISHED) {
      // Another bump bot has finished handling this request
      if (!this.providers[provider])
        return void console.log(
          "[SBPL] Received a finished payload from a not-in-progress-bot"
        );
      this.providers[provider] = payload;
      // TODO: Toggle event
    } else if (payload.type === MessageType.ERROR) {
      // Another bump bot experied an error handling this request
      this.providers[provider] = payload;
      // TODO: Toggle event
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
}

export default class SBLP {
  private entities: Array<SBLPBumpEntity> = [];

  constructor(private instance: OpenBump) {}

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
  public onMessage(message: Discord.Message) {
    const author = message.author;
    if (!author.bot && !config.discord.admins.includes(author.id)) return; // Only allow bots and bot admins (debug)
    if (author instanceof ClientUser) return; // Ignore own messages
    if (!message.guild) return; // Only allow guild messages
    if (message.channel.type !== "text") return; // Only allow text channels
    if (
      config.settings.integration?.sblp.receive.includes(message.channel.id)
    ) {
      // Channel is a SBLP channel
      // Note: Open Bump will not use a whitelist system as it expects that only granted bots have access to the SBLP channel(s)

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
          return void console.log(
            `[SBLP] Invalid schema received from ${author.tag} (${author.id}): ${error.message}`
          );
        } else {
          // Unknown error
          return void console.log(
            `[SBLP] Unknown error occured while handling ${author.tag} (${author.id}).`
          );
        }
      }
      this.onPayload(message.author.id, payload, message as GuildMessage);
    }
  }

  public onPayload(
    provider: string,
    payload: SBLPPayload,
    message: GuildMessage
  ): void;
  public onPayload(
    provider: string,
    payload: BumpStartedResponse | BumpFinishedResponse | BumpErrorResponse,
    message?: undefined
  ): void;
  public onPayload(
    provider: string,
    payload: SBLPPayload,
    message?: GuildMessage
  ): void {
    if (payload.type === MessageType.REQUEST) {
      if (message) {
        // Another bump bot is requesting this bot to bump a guild
        new SBLPBumpEntity(
          message.id,
          message.author,
          { guild: message.guild?.id, channel: message.channel.id },
          payload.guild,
          payload.channel,
          payload.user
        );
      }
    } else {
      // Another bump bot has started bumping a guild as requested by this bot
      const entity = this.getEntityById(payload.response);
      if (entity) entity.receivePayload(provider, payload);
      else if (message)
        this.instance.networkManager.emitSBLPOutside(provider, payload); // Only emit to other shards if message set (this = primary)
    }
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
          throw new SBLPSchemaError("payload.code");
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
