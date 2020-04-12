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
import User from "./User";

@Table({
  tableName: "Donator"
})
export default class Donator extends Model<Donator> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => User)
  @Column
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @Column(DataType.INTEGER)
  amount!: number;

  @Column(DataType.INTEGER)
  bonus!: number;
}
