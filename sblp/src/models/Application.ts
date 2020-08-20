import {
  AllowNull,
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique
} from "sequelize-typescript";
import ApplicationService from "./ApplicationService";

@Table({
  tableName: "Application",
  scopes: {
    full: {
      include: [
        {
          model: ApplicationService,
          as: "services",
          include: [
            {
              model: Application,
              as: "target"
            }
          ]
        }
      ]
    }
  }
})
export default class Application extends Model<Application> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  host!: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(20))
  bot!: string;

  @Column(DataType.STRING)
  base?: string | null;

  @HasMany(() => ApplicationService)
  services!: Array<ApplicationService>;

  @Column(DataType.STRING)
  token!: string;

  public getBase() {
    let url = this.base;
    if (!url?.endsWith("/")) url += "/";
    return url;
  }
}
