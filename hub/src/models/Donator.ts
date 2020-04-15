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

  @HasMany(() => AssignedTier)
  assignedTiers!: Array<AssignedTier>;

  @Column(DataType.DATE)
  transitionStartedAt?: Date;

  @Column(DataType.BOOLEAN)
  transitionStartInformed?: boolean;

  @Column(DataType.DATE)
  transitionFixedAt?: Date;

  @Column(DataType.DATE)
  transitionEndedAt?: Date;

  @Column(DataType.BOOLEAN)
  transitionEndInformed?: boolean;

  @Column(DataType.STRING)
  transitionShard?: string;

  public getAmount() {
    let amount = 0;
    if (this.patreon) amount += this.patreon;
    if (this.bonus) amount += this.bonus;
    return amount;
  }
}
