import { SuccessfulParsedMessage } from "discord-command-parser";
import { MessageEmbedOptions } from "discord.js";
import moment from "moment";
import { table } from "table";
import Command from "../Command";
import Application from "../models/Application";
import Guild from "../models/Guild";
import Utils, { GuildMessage } from "../Utils";

export default class ApplicationCommand extends Command {
  public name = "application";
  public aliases = ["applications", "app", "apps"];
  public syntax = "application [page|id [token]]";
  public description = "Manage your applications";
  public vanished = true;

  public async run(
    { message, arguments: args }: SuccessfulParsedMessage<GuildMessage>,
    guildDatabase: Guild
  ) {
    const { channel, author, guild } = message;

    const entriesPerPage = 10;

    const targetPage = args.length ? Number(args[0]) : 1;
    if (isNaN(targetPage) || targetPage <= 0) {
      const application = args.length
        ? await Application.findOne({
            where: { id: args[0], userId: author.id }
          })
        : null;

      if (application) {
        if (args.length === 1) {
          const embed: MessageEmbedOptions = {
            color: Utils.Colors.BLUE,
            title: `${Utils.Emojis.ROBOT} Application Info`,
            description:
              `**Name:** ${application.name}\n` +
              `**Owner:** <@${application.userId}>\n` +
              `**Features:** ${
                application.features
                  .map((feature) => `\`${feature.feature}\``)
                  .join(" ") || "*No features*"
              }\n` +
              `**Created:** ${moment(application.createdAt).format(
                "MMMM Do YYYY"
              )}`,
            fields: [
              {
                name: "Syntax",
                value: `- \`${Utils.getPrefix(guildDatabase)}${
                  this.name
                } <id> token\`- View the application's token`
              }
            ],
            footer: {
              text: `ID: ${application.id}`
            }
          };
          return void (await channel.send({ embed }));
        } else if (args.length === 2) {
          if (args[1] === "token") {
            let embed: MessageEmbedOptions = {
              color: Utils.Colors.GREEN,
              title: `${Utils.Emojis.CHECK} Application Token`,
              description: `\`\`\`${application.token}\`\`\``,
              footer: {
                text: `You received this DM because you requested an application token on the server ${guild.name}.`
              }
            };
            try {
              const message = await author.send({ embed });
              embed = {
                color: Utils.Colors.GREEN,
                title: `${Utils.Emojis.CHECK} Application Token`,
                description: `You have received a DM with your application's token. **[Open DMs](${message.url})**.`
              };
              return void (await channel.send({ embed }));
            } catch (error) {
              embed = {
                color: Utils.Colors.RED,
                title: `${Utils.Emojis.XMARK} Application Token`,
                description: `The bot was not able to send you a DM. Please enable your DMs.`
              };
              return void (await channel.send({ embed }));
            }
          } else return void (await this.sendSyntax(message, guildDatabase));
        } else return void (await this.sendSyntax(message, guildDatabase));
      } else {
        const embed: MessageEmbedOptions = {
          color: Utils.Colors.RED,
          title: `${Utils.Emojis.XMARK} Error`,
          description: `Application \`${args[0]}\` does not exist or you do not have access to it.`
        };
        return void (await channel.send({ embed }));
      }
    }

    const applications = await Application.findAndCountAll({
      where: { userId: author.id },
      limit: entriesPerPage,
      offset: (targetPage - 1) * entriesPerPage
    });
    const totalPages = Math.ceil(applications.count / entriesPerPage);

    if (!totalPages) {
      const embed: MessageEmbedOptions = {
        color: Utils.Colors.BLUE,
        title: `${Utils.Emojis.INFORMATION} Applications`,
        description: `You do not have access to any applications.`
      };
      return void (await channel.send({ embed }));
    }

    let description = `Page **${targetPage}** of **${totalPages}** total pages; showing **${applications.rows.length}** of **${applications.count}** entries.`;

    if (applications.rows.length) {
      const data = [["Name", "ID"]];
      for (const application of applications.rows) {
        data.push([application.name, application.id]);
      }
      description += `\`\`\`${table(data)}\`\`\`\n`;
    } else {
      description += "\n\nThis page does not exist.\n\n";
    }

    description += `Use \`${Utils.getPrefix(guildDatabase)}${
      this.name
    } <page>\` to switch page.`;

    const embed: MessageEmbedOptions = {
      color: Utils.Colors.BLUE,
      title: `${Utils.Emojis.INFORMATION} Applications`,
      description
    };
    return void (await channel.send({ embed }));
  }
}
