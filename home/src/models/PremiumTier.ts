import {
  AllowNull,
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";
import PremiumTierFeature from "./PremiumTierFeature";

@Table({
  tableName: "PremiumTier",
  defaultScope: {
    include: [
      {
        model: PremiumTierFeature,
        as: "features"
      }
    ]
  }
})
export default class PremiumTier extends Model<PremiumTier> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  cost!: number;

  @Column(DataType.INTEGER)
  cooldown?: number;

  @HasMany(() => PremiumTierFeature)
  features!: Array<PremiumTierFeature>;
}
