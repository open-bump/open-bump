import {
  AllowNull,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";

@Table({
  tableName: "BumpData"
})
export default class BumpData extends Model<BumpData> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @Column(DataType.STRING)
  description!: string;

  @Column(DataType.STRING)
  invite!: string;

  @Column(DataType.STRING)
  banner!: string;

  @Column(DataType.INTEGER)
  color!: number;
}
