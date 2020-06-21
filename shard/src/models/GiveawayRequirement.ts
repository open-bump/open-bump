import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";
import Giveaway from "./Giveaway";

@Table({
  tableName: "GiveawayRequirement"
})
export default class GiveawayRequirement extends Model<GiveawayRequirement> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Giveaway)
  @AllowNull(false)
  @Column
  giveawayId!: string;

  @BelongsTo(() => Giveaway)
  giveaway!: Giveaway;

  @AllowNull(false)
  @Column(DataType.ENUM("GUILD", "ROLE", "VOTE"))
  type!: "GUILD" | "ROLE" | "VOTE";

  @Column(DataType.STRING)
  target?: string;

  @Column(DataType.STRING)
  invite?: string;
}
