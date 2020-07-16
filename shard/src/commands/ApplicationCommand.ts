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
  public syntax = "application [page|id [token|sblp [toggle|setbase <base>]]";
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
          const prefix = Utils.getPrefix(guildDatabase);
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
                value:
                  `- \`${prefix}${this.name} <id> token\`- View the  token\n` +
                  `- \`${prefix}${this.name} <id> sblp\` - View the SBLP settings`
              }
            ],
            footer: {
              text: `ID: ${application.id}`
            }
          };
          return void (await channel.send({ embed }));
        } else if (args.length >= 2) {
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
          } else if (args[1] === "sblp") {
            if (
              application.features.find(
                (feature) => feature.feature === "SBLP"
              ) &&
              application.bot
            ) {
              if (args.length === 2) {
                const prefix = Utils.getPrefix(guildDatabase);
                const embed: MessageEmbedOptions = {
                  color: Utils.Colors.BLUE,
                  title: `${Utils.Emojis.INFORMATION} SBLP`,
                  description:
                    `**Status:** ${
                      application.sblpEnabled ? "Enabled" : "Disabled"
                    }\n` +
                    `**Base URL:** ${application.base || "*No base URL*"}`,
                  fields: [
                    {
                      name: "Syntax",
                      value:
                        `- \`${prefix}${this.name} <id> sblp toggle\`- Toggle SBLP\n` +
                        `- \`${prefix}${this.name} <id> sblp setbase <base>\` - Set the base URL`
                    }
                  ]
                };
                return void (await channel.send({ embed }));
              } else {
                if (args[2] === "toggle") {
                  application.sblpEnabled = !application.sblpEnabled;
                  await application.save();
                  const embed: MessageEmbedOptions = {
                    color: Utils.Colors.GREEN,
                    title: `${Utils.Emojis.CHECK} SBLP has been ${
                      application.sblpEnabled ? "enabled" : "disabled"
                    }`,
                    description: `Make sure to also set a base URL using \`${Utils.getPrefix(
                      guildDatabase
                    )}${
                      this.name
                    } <id> sblp <setbase> <base>\`, or your bot will not receive bump requests.`
                  };
                  return void (await channel.send({ embed }));
                } else if (args[2] === "setbase" && args.length === 4) {
                  const newBase = args[3];
                  application.base = newBase;
                  await application.save();

                  const embed = {
                    color: Utils.Colors.GREEN,
                    title: `${Utils.Emojis.CHECK} Base URL has been updated`,
                    description: `__**New Base URL:**__ ${newBase}`
                  };
                  return void (await channel.send({ embed }));
                } else
                  return void (await this.sendSyntax(message, guildDatabase));
              }
            } else {
              const embed: MessageEmbedOptions = {
                color: Utils.Colors.RED,
                title: `${Utils.Emojis.XMARK} Forbidden`,
                description: `This application does not have access to SBLP settings.`
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
