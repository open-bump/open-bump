import {
  AllowNull,
  BelongsTo,
  Column,
  createIndexDecorator,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";
import Giveaway from "./Giveaway";
import User from "./User";

const GiveawayParticipantIndex = createIndexDecorator({
  type: "UNIQUE",
  unique: true
});

@Table({
  tableName: "GiveawayParticipant"
})
export default class GiveawayParticipant extends Model<GiveawayParticipant> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Giveaway)
  @GiveawayParticipantIndex
  @AllowNull(false)
  @Column
  giveawayId!: string;

  @BelongsTo(() => Giveaway)
  giveaway!: Giveaway;

  @ForeignKey(() => User)
  @GiveawayParticipantIndex
  @AllowNull(false)
  @Column
  userId!: string;

  @BelongsTo(() => User)
  user!: User;
}
