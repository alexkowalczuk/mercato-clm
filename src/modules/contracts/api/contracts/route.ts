import { z } from 'zod'
import { makeCrudRoute } from '@open-mercato/shared/lib/crud/factory'
import { escapeLikePattern } from '@open-mercato/shared/lib/db/escapeLikePattern'
import { Contract } from '../../data/entities'
import {
  contractCreateSchema,
  contractListSchema,
  contractUpdateSchema,
  dayToDate,
  toDay,
  type ContractListQuery,
} from '../../data/validators'
import {
  contractsCreatedSchema,
  contractsOkSchema,
  createContractsCrudOpenApi,
  createContractsPagedListResponseSchema,
} from '../openapi'

const ENTITY_ID = 'contracts:contract' as const

const listFields = [
  'id',
  'contract_number',
  'title',
  'contract_type',
  'direction',
  'status',
  'customer_entity_id',
  'owner_user_id',
  'effective_date',
  'end_date',
  'auto_renew',
  'renewal_term_months',
  'notice_period_days',
  'total_value',
  'currency_code',
  'description',
  'organization_id',
  'tenant_id',
  'created_at',
  // Required for optimistic locking: the edit form derives the version header from `updatedAt`.
  'updated_at',
]

// API sort keys are camelCase; the query engine sorts on database column names.
const sortFieldMap: Record<string, string> = {
  contractNumber: 'contract_number',
  title: 'title',
  status: 'status',
  effectiveDate: 'effective_date',
  endDate: 'end_date',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
}

function toIso(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const parsed = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** Row from the query engine (snake_case columns) → stable camelCase API item. */
function toContractListItem(item: Record<string, unknown>) {
  return {
    id: String(item.id),
    contractNumber: item.contract_number as string,
    title: item.title as string,
    contractType: item.contract_type as string,
    direction: item.direction as string,
    status: item.status as string,
    customerEntityId: (item.customer_entity_id as string | null) ?? null,
    ownerUserId: (item.owner_user_id as string | null) ?? null,
    effectiveDate: toDay(item.effective_date),
    endDate: toDay(item.end_date),
    autoRenew: Boolean(item.auto_renew),
    renewalTermMonths: toNullableNumber(item.renewal_term_months),
    noticePeriodDays: toNullableNumber(item.notice_period_days),
    totalValue: item.total_value === null || item.total_value === undefined ? null : String(item.total_value),
    currencyCode: (item.currency_code as string | null) ?? null,
    description: (item.description as string | null) ?? null,
    createdAt: toIso(item.created_at),
    updatedAt: toIso(item.updated_at),
  }
}

const contractListItemSchema = z.object({
  id: z.string().uuid(),
  contractNumber: z.string(),
  title: z.string(),
  contractType: z.string(),
  direction: z.string(),
  status: z.string(),
  customerEntityId: z.string().uuid().nullable(),
  ownerUserId: z.string().uuid().nullable(),
  effectiveDate: z.string().nullable(),
  endDate: z.string().nullable(),
  autoRenew: z.boolean(),
  renewalTermMonths: z.number().nullable(),
  noticePeriodDays: z.number().nullable(),
  totalValue: z.string().nullable(),
  currencyCode: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
})

export const { metadata, GET, POST, PUT, DELETE } = makeCrudRoute({
  metadata: {
    GET: { requireAuth: true, requireFeatures: ['contracts.contracts.view'] },
    POST: { requireAuth: true, requireFeatures: ['contracts.contracts.manage'] },
    PUT: { requireAuth: true, requireFeatures: ['contracts.contracts.manage'] },
    DELETE: { requireAuth: true, requireFeatures: ['contracts.contracts.manage'] },
  },
  orm: {
    entity: Contract,
    idField: 'id',
    orgField: 'organizationId',
    tenantField: 'tenantId',
    softDeleteField: 'deletedAt',
  },
  indexer: { entityType: ENTITY_ID },
  list: {
    schema: contractListSchema,
    entityId: ENTITY_ID,
    fields: listFields,
    sortFieldMap,
    buildFilters: async (query: ContractListQuery) => {
      const filters: Record<string, unknown> = {}
      if (query.id) filters.id = { $eq: query.id }
      if (query.status) filters.status = { $eq: query.status }
      if (query.contractType) filters.contract_type = { $eq: query.contractType }
      if (query.customerEntityId) filters.customer_entity_id = { $eq: query.customerEntityId }
      if (query.search) {
        const term = `%${escapeLikePattern(query.search)}%`
        filters.$or = [{ contract_number: { $ilike: term } }, { title: { $ilike: term } }]
      }
      return filters
    },
    transformItem: (item: Record<string, unknown>) => toContractListItem(item),
  },
  create: {
    schema: contractCreateSchema,
    mapToEntity: (input) => ({
      contractNumber: input.contractNumber,
      title: input.title,
      contractType: input.contractType,
      direction: input.direction,
      status: input.status,
      customerEntityId: input.customerEntityId ?? null,
      ownerUserId: input.ownerUserId ?? null,
      effectiveDate: dayToDate(input.effectiveDate),
      endDate: input.endDate ? dayToDate(input.endDate) : null,
      autoRenew: input.autoRenew,
      renewalTermMonths: input.renewalTermMonths ?? null,
      noticePeriodDays: input.noticePeriodDays ?? null,
      totalValue: input.totalValue ?? null,
      currencyCode: input.currencyCode ?? null,
      description: input.description ?? null,
    }),
    response: (entity) => ({ id: String(entity.id) }),
  },
  update: {
    schema: contractUpdateSchema,
    getId: (input) => input.id,
    applyToEntity: (entity, input) => {
      if (input.contractNumber !== undefined) entity.contractNumber = input.contractNumber
      if (input.title !== undefined) entity.title = input.title
      if (input.contractType !== undefined) entity.contractType = input.contractType
      if (input.direction !== undefined) entity.direction = input.direction
      if (input.status !== undefined) entity.status = input.status
      if (input.customerEntityId !== undefined) entity.customerEntityId = input.customerEntityId
      if (input.ownerUserId !== undefined) entity.ownerUserId = input.ownerUserId
      if (input.effectiveDate !== undefined) entity.effectiveDate = dayToDate(input.effectiveDate)
      if (input.endDate !== undefined) entity.endDate = input.endDate ? dayToDate(input.endDate) : null
      if (input.autoRenew !== undefined) entity.autoRenew = input.autoRenew
      if (input.renewalTermMonths !== undefined) entity.renewalTermMonths = input.renewalTermMonths
      if (input.noticePeriodDays !== undefined) entity.noticePeriodDays = input.noticePeriodDays
      if (input.totalValue !== undefined) entity.totalValue = input.totalValue
      if (input.currencyCode !== undefined) entity.currencyCode = input.currencyCode
      if (input.description !== undefined) entity.description = input.description
    },
    response: () => ({ ok: true }),
  },
  del: {
    idFrom: 'body',
    softDelete: true,
    response: () => ({ ok: true }),
  },
})

export const openApi = createContractsCrudOpenApi({
  resourceName: 'Contract',
  pluralName: 'Contracts',
  querySchema: contractListSchema,
  listResponseSchema: createContractsPagedListResponseSchema(contractListItemSchema),
  create: {
    schema: contractCreateSchema,
    responseSchema: contractsCreatedSchema,
    description: 'Creates a contract in the current organization.',
  },
  update: {
    schema: contractUpdateSchema,
    responseSchema: contractsOkSchema,
    description: 'Updates a contract.',
  },
  del: {
    schema: z.object({ id: z.string().uuid() }),
    responseSchema: contractsOkSchema,
    description: 'Soft-deletes a contract.',
  },
})
