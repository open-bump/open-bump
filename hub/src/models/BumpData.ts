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
import Guild from "./Guild";

@Table({
  tableName: "BumpData"
})
export default class BumpData extends Model<BumpData> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Guild)
  @Column
  guildId!: string;

  @BelongsTo(() => Guild)
  guild!: Guild;

  @Column(DataType.TEXT)
  description?: string | null;

  @Column(DataType.STRING)
  invite?: string | null;

  @Column(DataType.STRING)
  banner?: string | null;

  @Column(DataType.INTEGER)
  color?: number | null;
}
