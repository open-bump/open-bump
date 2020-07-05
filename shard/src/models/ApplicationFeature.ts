import {
  AllowNull,
  BelongsTo,
  Column,
  createIndexDecorator,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";
import Application from "./Application";

const ApplicationFeatureIndex = createIndexDecorator({
  type: "UNIQUE",
  unique: true
});

@Table({
  tableName: "ApplicationFeature"
})
export default class ApplicationFeature extends Model<ApplicationFeature> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => Application)
  @ApplicationFeatureIndex
  @AllowNull(false)
  @Column
  applicationId!: string;

  @BelongsTo(() => Application)
  application!: Application;

  @ApplicationFeatureIndex
  @AllowNull(false)
  @Column(DataType.STRING(100))
  feature!: string;
}
