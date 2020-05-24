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
import Guild from "./Guild";

const GuildFeatureIndex = createIndexDecorator({
  type: "UNIQUE",
  unique: true
});

@Table({
  tableName: "GuildFeature"
})
export default class GuildFeature extends Model<GuildFeature> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Guild)
  @GuildFeatureIndex
  @AllowNull(false)
  @Column
  guildId!: string;

  @BelongsTo(() => Guild)
  guild!: Guild;

  @GuildFeatureIndex
  @AllowNull(false)
  @Column(DataType.STRING(100))
  feature!: string;
}
