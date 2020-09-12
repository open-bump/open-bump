import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";

@Table({
  tableName: "TopGGBot"
})
export default class TopGGBot extends Model<TopGGBot> {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING(20))
  id!: string;

  @Column(DataType.STRING)
  username?: string | null;

  @Column(DataType.STRING)
  discriminator?: string | null;

  @Column(DataType.STRING)
  invite?: string | null;

  @Column(DataType.STRING)
  support?: string | null;
}
