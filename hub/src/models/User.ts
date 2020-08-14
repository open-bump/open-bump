import {
  AfterCreate,
  AllowNull,
  Column,
  DataType,
  Default,
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

  @Column(DataType.DATE)
  lastVotedAt?: Date | null;

  @Column(DataType.DATE)
  lastBumpedAt?: Date | null;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  bumpsSinceCaptcha!: number;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  requireCaptcha!: boolean;

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
