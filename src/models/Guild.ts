import {
  AllowNull,
  BeforeCreate,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  AfterCreate
} from "sequelize-typescript";
import { Transaction } from "sequelize/types";
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
  feed!: string;

  @HasMany(() => GuildFeature)
  features!: Array<GuildFeature>;

  @ForeignKey(() => BumpData)
  @Column
  bumpDataId!: string;

  @BelongsTo(() => BumpData)
  bumpData!: BumpData;

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

  @AfterCreate
  public static async afterCreateHook(
    entity: Guild,
    { transaction }: { transaction?: Transaction }
  ) {
    const bumpData = await BumpData.create({ transaction });
    await entity.$set("bumpData", bumpData, { transaction });
  }
}
