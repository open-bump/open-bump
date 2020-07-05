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
import Donator from "./Donator";
import Guild from "./Guild";
import PremiumTier from "./PremiumTier";

@Table({
  tableName: "AssignedTier",
  scopes: {
    default: {}
  }
})
export default class AssignedTier extends Model<AssignedTier> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Donator)
  @AllowNull(false)
  @Column
  donatorId!: string;

  @BelongsTo(() => Donator)
  donator!: Donator;

  @ForeignKey(() => Guild)
  @AllowNull(false)
  @Column
  guildId!: string;

  @BelongsTo(() => Guild)
  guild!: Guild;

  @ForeignKey(() => PremiumTier)
  @AllowNull(false)
  @Column
  premiumTierId!: number;

  @BelongsTo(() => PremiumTier)
  premiumTier!: PremiumTier;
}

setTimeout(() => {
  AssignedTier.addScope(
    "default",
    {
      include: [
        {
          model: PremiumTier,
          as: "premiumTier"
        },
        {
          model: Guild,
          as: "guild"
        }
      ]
    },
    { override: true }
  );
});
