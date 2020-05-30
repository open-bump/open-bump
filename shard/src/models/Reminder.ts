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
import Guild from "./Guild";
import User from "./User";

const ReminderIndex = createIndexDecorator({
  type: "UNIQUE",
  unique: true
});

@Table({
  tableName: "Reminder"
})
export default class Reminder extends Model<Reminder> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Guild)
  @ReminderIndex
  @AllowNull(false)
  @Column
  guildId!: string;

  @BelongsTo(() => Guild)
  guild!: Guild;

  @ForeignKey(() => User)
  @ReminderIndex
  @AllowNull(false)
  @Column
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @AllowNull(false)
  @Column(DataType.STRING(20))
  channel!: string;

  @Column(DataType.BOOLEAN)
  voted!: boolean;
}
