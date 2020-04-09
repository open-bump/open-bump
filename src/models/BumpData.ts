import {
  AllowNull,
  Column,
  DataType,
  Default,
  HasOne,
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

  @HasOne(() => Guild, "bumpDataId")
  guild!: Guild;

  @Column(DataType.TEXT)
  description!: string;

  @Column(DataType.STRING)
  invite!: string;

  @Column(DataType.STRING)
  banner!: string;

  @Column(DataType.INTEGER)
  color!: number;
}
