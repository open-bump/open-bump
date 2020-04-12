import {
  AllowNull,
  Column,
  DataType,
  HasOne,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";
import Donator from "./Donator";

@Table({
  tableName: "User",
  defaultScope: {
    include: [{ model: Donator, as: "donator" }]
  }
})
export default class User extends Model<User> {
  // Discord Snowflake
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING(20))
  id!: string;

  @HasOne(() => Donator)
  donator!: Donator;
}
