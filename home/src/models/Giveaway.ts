import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";
import GiveawayRequirement from "./GiveawayRequirement";
import Guild from "./Guild";

@Table({
  tableName: "Giveaway",
  defaultScope: {
    include: [{ model: GiveawayRequirement, as: "requirements" }]
  }
})
export default class Giveaway extends Model<Giveaway> {
  // Discord Snowflake (Message)
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING(20))
  id!: string;

  @ForeignKey(() => Guild)
  @AllowNull(false)
  @Column
  guildId!: string;

  @BelongsTo(() => Guild)
  guild!: Guild;

  @AllowNull(false)
  @Column(DataType.STRING(20))
  channel!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  prize!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  time!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  winnersCount!: number;

  @HasMany(() => GiveawayRequirement)
  requirements!: Array<GiveawayRequirement>;

  @Column(DataType.DATE)
  endedAt?: Date;

  @Column(DataType.STRING(20))
  createdBy!: string;

  @Column(DataType.STRING(20))
  cancelledBy!: string;

  @Column(DataType.DATE)
  lastRefreshedAt!: Date;

  public ended() {
    return Boolean(this.endedAt || this.cancelledBy);
  }
}
