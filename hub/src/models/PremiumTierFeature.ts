import {
  AllowNull,
  Column,
  createIndexDecorator,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  BelongsTo
} from "sequelize-typescript";
import PremiumTier from "./PremiumTier";

const PremiumTierFeatureIndex = createIndexDecorator({
  type: "UNIQUE",
  unique: true
});

@Table({
  tableName: "PremiumTierFeature",
  defaultScope: {
    attributes: ["feature"]
  }
})
export default class PremiumTierFeature extends Model<PremiumTierFeature> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => PremiumTier)
  @PremiumTierFeatureIndex
  @AllowNull(false)
  @Column
  premiumTierId!: string;

  @BelongsTo(() => PremiumTier)
  premiumTier!: PremiumTier;

  @PremiumTierFeatureIndex
  @AllowNull(false)
  @Column(DataType.STRING(100))
  feature!: string;
}
