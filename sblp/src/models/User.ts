import {
  AllowNull,
  Column,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";
import Application from "./Application";

@Table({
  tableName: "User"
})
export default class User extends Model<User> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING(20))
  id!: string;

  @Column(DataType.STRING)
  accessToken!: string;

  @Column(DataType.STRING)
  refreshToken!: string;

  @HasMany(() => Application)
  applications!: Array<Application>;
}
