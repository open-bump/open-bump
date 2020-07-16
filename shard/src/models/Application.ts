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
import ApplicationFeature from "./ApplicationFeature";
import User from "./User";

@Table({
  tableName: "Application",
  defaultScope: {
    include: [{ model: ApplicationFeature, as: "features" }]
  }
})
export default class Application extends Model<Application> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @ForeignKey(() => User)
  @Column
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  token!: string;

  @Column(DataType.STRING(20))
  bot!: string;

  @HasMany(() => ApplicationFeature)
  features!: Array<ApplicationFeature>;

  @Column(DataType.BOOLEAN)
  sblpEnabled!: boolean;

  @Column(DataType.STRING)
  base!: string;

  @Column(DataType.STRING)
  authorization!: string;

  @Column(DataType.BOOLEAN)
  sblpSandbox!: boolean;

  @Column(DataType.BOOLEAN)
  shareEnabled!: boolean;

  public getBase() {
    let url = this.base;
    if (!url.endsWith("/")) url += "/";
    return url;
  }
}
