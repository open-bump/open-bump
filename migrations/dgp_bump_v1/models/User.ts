import {
  AfterCreate,
  AllowNull,
  Column,
  DataType,
  HasOne,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";
import { Transaction } from "sequelize/types";
import Donator from "./Donator";

@Table({
  tableName: "User"
})
export default class User extends Model<User> {
  // Discord Snowflake
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING(20))
  id!: string;

  @HasOne(() => Donator)
  donator?: Donator;

  @AfterCreate
  public static async afterCreateHook(
    entity: User,
    { transaction }: { transaction?: Transaction }
  ) {
    const donator: Donator = await entity.$create(
      "donator",
      {},
      { transaction }
    );
    entity.donator = donator;
  }
}

setTimeout(() => {
  User.addScope("default", { include: [{ model: Donator, as: "donator" }] });
});
