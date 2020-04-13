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

  @Column(DataType.INTEGER)
  patreon!: number;

  @Column(DataType.INTEGER)
  bonus!: number;

  @HasMany(() => AssignedTier)
  assignedTiers!: Array<AssignedTier>;

  public getAmount() {
    let amount = 0;
    if (this.patreon) amount += this.patreon;
    if (this.bonus) amount += this.bonus;
    return amount;
  }
}
