import {
  AfterCreate,
  AllowNull,
  Column,
  DataType,
  Default,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";
import { Transaction } from "sequelize/types";
import AssignedTier from "./AssignedTier";
import BumpData from "./BumpData";
import GuildFeature from "./GuildFeature";

@Table({
  tableName: "Guild",
  defaultScope: {
    include: [
      {
        model: GuildFeature,
        as: "features"
      },
      {
        model: BumpData,
        as: "bumpData"
      }
    ]
  },
  scopes: {
    feedMetaOnly: {
      attributes: ["id", "feed", "nsfw"],
      include: [{ model: GuildFeature, as: "features" }]
    }
  }
})
export default class Guild extends Model<Guild> {
  // Discord Snowflake
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING(20))
  id!: string;

  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING(20))
  feed?: string;

  @HasMany(() => GuildFeature)
  features!: Array<GuildFeature>;

  @HasOne(() => BumpData)
  bumpData!: BumpData;

  @Column(DataType.STRING)
  prefix!: string;

  @Column(DataType.BOOLEAN)
  autobump!: boolean;

  @Column(DataType.STRING(20))
  lastBumpedBy!: string;

  @Column(DataType.DATE)
  lastBumpedAt!: Date;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  totalBumps!: number;

  @Column(DataType.BOOLEAN)
  nsfw!: boolean;

  @HasMany(() => AssignedTier)
  assignedTiers!: Array<AssignedTier>;

  @AfterCreate
  public static async afterCreateHook(
    entity: Guild,
    { transaction }: { transaction?: Transaction }
  ) {
    const bumpData = await BumpData.create({ transaction });
    await entity.$set("bumpData", bumpData, { transaction });
  }
}
