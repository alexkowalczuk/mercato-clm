import { OptionalProps } from '@mikro-orm/core'
import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy'

export const CONTRACT_STATUSES = ['draft', 'in_review', 'approved', 'active', 'expired', 'terminated'] as const
export type ContractStatus = (typeof CONTRACT_STATUSES)[number]

export const CONTRACT_DIRECTIONS = ['sell', 'buy'] as const
export type ContractDirection = (typeof CONTRACT_DIRECTIONS)[number]

/**
 * Contract repository record (CLM phase 1).
 *
 * - The counterparty is stored as a plain `customer_entity_id` plus a frozen
 *   `customer_snapshot`: cross-module ORM relations are not allowed.
 * - `effective_date` / `end_date` are calendar days (`date` columns), not
 *   instants, so a contract "ending 2026-12-31" ends on that day in every zone.
 * - The notice deadline is derived (`end_date - notice_period_days`), never stored.
 * - `updated_at` drives optimistic locking for the edit form.
 */
@Entity({ tableName: 'contracts' })
@Index({ name: 'contracts_org_tenant_idx', properties: ['organizationId', 'tenantId'] })
@Index({ name: 'contracts_customer_idx', properties: ['customerEntityId', 'organizationId', 'tenantId'] })
@Index({ name: 'contracts_status_idx', properties: ['organizationId', 'tenantId', 'status'] })
@Index({ name: 'contracts_end_date_idx', properties: ['organizationId', 'tenantId', 'endDate'] })
@Unique({ name: 'contracts_number_unique', properties: ['organizationId', 'tenantId', 'contractNumber'] })
export class Contract {
  [OptionalProps]?: 'direction' | 'status' | 'autoRenew' | 'createdAt' | 'updatedAt'

  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  @Property({ name: 'organization_id', type: 'uuid' })
  organizationId!: string

  @Property({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string

  @Property({ name: 'contract_number', type: 'text' })
  contractNumber!: string

  @Property({ type: 'text' })
  title!: string

  @Property({ name: 'contract_type', type: 'text' })
  contractType!: string

  @Property({ type: 'text', default: 'sell' })
  direction: ContractDirection = 'sell'

  @Property({ type: 'text', default: 'draft' })
  status: ContractStatus = 'draft'

  @Property({ name: 'customer_entity_id', type: 'uuid', nullable: true })
  customerEntityId?: string | null

  @Property({ name: 'customer_snapshot', type: 'jsonb', nullable: true })
  customerSnapshot?: Record<string, unknown> | null

  @Property({ name: 'owner_user_id', type: 'uuid', nullable: true })
  ownerUserId?: string | null

  @Property({ name: 'effective_date', type: 'date' })
  effectiveDate!: Date

  @Property({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date | null

  @Property({ name: 'auto_renew', type: 'boolean', default: false })
  autoRenew: boolean = false

  @Property({ name: 'renewal_term_months', type: 'integer', nullable: true })
  renewalTermMonths?: number | null

  @Property({ name: 'notice_period_days', type: 'integer', nullable: true })
  noticePeriodDays?: number | null

  @Property({ name: 'total_value', type: 'numeric', precision: 18, scale: 4, nullable: true })
  totalValue?: string | null

  @Property({ name: 'currency_code', type: 'text', nullable: true })
  currencyCode?: string | null

  @Property({ type: 'text', nullable: true })
  description?: string | null

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()

  @Property({ name: 'deleted_at', type: Date, nullable: true })
  deletedAt?: Date | null
}
