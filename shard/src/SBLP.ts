import Discord from "discord.js";
import config from "./config";
import OpenBump from "./OpenBump";

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

export default class SBLP {
  constructor(private instance: OpenBump) {}

  /**
   * Call this function when a message is received in any channel
   *
   * @param message The received message
   */
  public onMessage(message: Discord.Message) {
    const author = message.author;
    if (!author.bot) return; // Only allow bots
    if (
      config.settings.integration?.sblp.channels.includes(message.channel.id)
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
            `[SBLP] Invalid schema received from ${author.tag} (${author.id}).`
          );
        } else {
          // Unknown error
          return void console.log(
            `[SBLP] Unknown error occured while handling ${author.tag} (${author.id}).`
          );
        }
      }
      if (payload.type === MessageType.REQUEST) {
        // Another bump bot is requesting this bot to bump a guild
      } else if (payload.type === MessageType.START) {
        // Another bump bot has started bumping a guild as requested by this bot
      } else if (payload.type === MessageType.FINISHED) {
        // Another bump bot has finished
      } else if (payload.type === MessageType.ERROR) {
        // Another bump bot has experienced an error during a SBLP related operation
      }
    }
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
