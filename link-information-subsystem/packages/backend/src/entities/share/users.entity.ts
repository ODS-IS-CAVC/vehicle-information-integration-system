import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";
import { compareSync, hashSync } from "bcryptjs";
import dayjs from "dayjs";

@Entity({ schema: "share", name: "users" })
export class Users extends BaseEntity {
  @PrimaryColumn({ name: "id" })
  id: number;

  @Column("varchar", { name: "login_id" })
  loginId: string;

  @Column("varchar", { name: "password", select: false })
  _password: string;
  set password(password: string) {
    this._password = hashSync(password, 4);
  }
  isSamePassword(password: string): boolean {
    return compareSync(password, this._password);
  }

  @Column("integer", { name: "user_type" })
  userType: number;

  @Column("date", { name: "expire_date" })
  expireDate: string;
  /** 有効期限切れの場合はTrue返却 */
  get isExpired(): boolean {
    return dayjs(this.expireDate).isBefore(Date.now(), "date");
  }

  @Column("varchar", { name: "email_address" })
  emailAddress: string;

  @Column("varchar", { name: "telephone_number" })
  telephoneNumber: string;

  @Column("timestamp", { name: "created_at" })
  createdAt: Date;

  @Column("timestamp", { name: "updated_at" })
  updatedAt: Date;
}
