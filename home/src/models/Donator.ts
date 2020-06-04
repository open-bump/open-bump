import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";
import config from "../config";
import AssignedTier from "./AssignedTier";
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

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  patreon!: number;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  bonus!: number;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  nitroBoost!: boolean;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  nitroBoostInformed!: boolean;

  @HasMany(() => AssignedTier)
  assignedTiers!: Array<AssignedTier>;

  @Column(DataType.DATE)
  transitionStartedAt?: Date | null;

  @Column(DataType.BOOLEAN)
  transitionStartInformed?: boolean | null;

  @Column(DataType.DATE)
  transitionFixedAt?: Date | null;

  @Column(DataType.DATE)
  transitionEndedAt?: Date | null;

  @Column(DataType.STRING)
  transitionShard?: string | null;

  public getAmount() {
    let amount = 0;
    if (this.patreon) amount += this.patreon;
    if (this.bonus) amount += this.bonus;
    if (this.nitroBoost) amount += config.settings.nitroboost?.bonus || 0;
    return amount;
  }
}
