import {
  AllowNull,
  Column,
  createIndexDecorator,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
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

  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    field: "guild"
  })
  guildId!: string;

  @GuildFeatureIndex
  @ForeignKey(() => Guild)
  guild!: Guild;

  @GuildFeatureIndex
  @AllowNull(false)
  @Column(DataType.STRING(100))
  feature!: string;
}
