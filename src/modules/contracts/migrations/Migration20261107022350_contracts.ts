import { Migration } from '@mikro-orm/migrations';

export class Migration20261107022350_contracts extends Migration {

  override name = 'Migration20261107022350';

  override up(): void | Promise<void> {
    this.addSql(`create table "contracts" ("id" uuid not null default gen_random_uuid(), "organization_id" uuid not null, "tenant_id" uuid not null, "contract_number" text not null, "title" text not null, "contract_type" text not null, "direction" text not null default 'sell', "status" text not null default 'draft', "customer_entity_id" uuid null, "customer_snapshot" jsonb null, "owner_user_id" uuid null, "effective_date" date not null, "end_date" date null, "auto_renew" boolean not null default false, "renewal_term_months" int null, "notice_period_days" int null, "total_value" numeric(18,4) null, "currency_code" text null, "description" text null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "deleted_at" timestamptz null, primary key ("id"));`);
    this.addSql(`create index "contracts_end_date_idx" on "contracts" ("organization_id", "tenant_id", "end_date");`);
    this.addSql(`create index "contracts_status_idx" on "contracts" ("organization_id", "tenant_id", "status");`);
    this.addSql(`create index "contracts_customer_idx" on "contracts" ("customer_entity_id", "organization_id", "tenant_id");`);
    this.addSql(`create index "contracts_org_tenant_idx" on "contracts" ("organization_id", "tenant_id");`);
    this.addSql(`alter table "contracts" add constraint "contracts_number_unique" unique ("organization_id", "tenant_id", "contract_number");`);
  }

  override down(): void | Promise<void> {
    this.addSql(`drop table if exists "contracts";`);
  }

}
