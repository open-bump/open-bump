import {
  AllowNull,
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
      BumpData
    ]
  }
})
export default class Guild extends Model<Guild> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING(20))
  feed!: string;

  @HasMany(() => GuildFeature)
  features!: Array<GuildFeature>;

  @ForeignKey(() => BumpData)
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
  static async afterCreateHook(instance: Guild, _propertyName: string) {
      await instance.$set('bumpData', await BumpData.create());
  }
}
