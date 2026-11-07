import { z } from 'zod'
import { CONTRACT_DIRECTIONS, CONTRACT_STATUSES } from './entities'

export const CONTRACT_TYPES = ['msa', 'nda', 'sow', 'service_agreement', 'other'] as const

/**
 * A contract date is a calendar day (`yyyy-MM-dd`), never an instant.
 * It is stored in a `date` column and carried as a string in the API so no
 * time zone can shift it (see the API key expiry bug, issue #8968).
 */
export const contractDaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a calendar day in yyyy-MM-dd format')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`)
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  }, 'Not a valid calendar day')

/** Decimal amount as a string to keep numeric(18,4) precision (no float rounding). */
const amountSchema = z
  .union([z.number(), z.string()])
  .transform((value) => String(value).trim())
  .refine((value) => /^-?\d{1,14}(\.\d{1,4})?$/.test(value), 'Expected a decimal amount with up to 4 decimal places')

const currencySchema = z.string().regex(/^[A-Z]{3}$/, 'Expected an ISO 4217 currency code, e.g. USD')

const contractFields = {
  contractNumber: z.string().trim().min(1).max(64),
  title: z.string().trim().min(1).max(200),
  contractType: z.enum(CONTRACT_TYPES),
  direction: z.enum(CONTRACT_DIRECTIONS),
  status: z.enum(CONTRACT_STATUSES),
  customerEntityId: z.string().uuid().nullable(),
  ownerUserId: z.string().uuid().nullable(),
  effectiveDate: contractDaySchema,
  endDate: contractDaySchema.nullable(),
  autoRenew: z.boolean(),
  renewalTermMonths: z.number().int().min(1).max(120).nullable(),
  noticePeriodDays: z.number().int().min(0).max(3650).nullable(),
  totalValue: amountSchema.nullable(),
  currencyCode: currencySchema.nullable(),
  description: z.string().max(5000).nullable(),
}

type DateRangeInput = { effectiveDate?: string | null; endDate?: string | null }
type AmountInput = { totalValue?: string | null; currencyCode?: string | null }

const endNotBeforeStart = (input: DateRangeInput) =>
  !input.effectiveDate || !input.endDate || input.endDate >= input.effectiveDate

const currencyWhenAmount = (input: AmountInput) =>
  input.totalValue === undefined || input.totalValue === null || Boolean(input.currencyCode)

export const contractCreateSchema = z
  .object({
    contractNumber: contractFields.contractNumber,
    title: contractFields.title,
    contractType: contractFields.contractType,
    direction: contractFields.direction.default('sell'),
    status: contractFields.status.default('draft'),
    customerEntityId: contractFields.customerEntityId.optional(),
    ownerUserId: contractFields.ownerUserId.optional(),
    effectiveDate: contractFields.effectiveDate,
    endDate: contractFields.endDate.optional(),
    autoRenew: contractFields.autoRenew.default(false),
    renewalTermMonths: contractFields.renewalTermMonths.optional(),
    noticePeriodDays: contractFields.noticePeriodDays.optional(),
    totalValue: contractFields.totalValue.optional(),
    currencyCode: contractFields.currencyCode.optional(),
    description: contractFields.description.optional(),
  })
  .refine(endNotBeforeStart, { message: 'End date cannot be before the effective date', path: ['endDate'] })
  .refine(currencyWhenAmount, { message: 'Currency is required when a value is set', path: ['currencyCode'] })

export const contractUpdateSchema = z
  .object({
    id: z.string().uuid(),
    contractNumber: contractFields.contractNumber.optional(),
    title: contractFields.title.optional(),
    contractType: contractFields.contractType.optional(),
    direction: contractFields.direction.optional(),
    status: contractFields.status.optional(),
    customerEntityId: contractFields.customerEntityId.optional(),
    ownerUserId: contractFields.ownerUserId.optional(),
    effectiveDate: contractFields.effectiveDate.optional(),
    endDate: contractFields.endDate.optional(),
    autoRenew: contractFields.autoRenew.optional(),
    renewalTermMonths: contractFields.renewalTermMonths.optional(),
    noticePeriodDays: contractFields.noticePeriodDays.optional(),
    totalValue: contractFields.totalValue.optional(),
    currencyCode: contractFields.currencyCode.optional(),
    description: contractFields.description.optional(),
  })
  .refine(endNotBeforeStart, { message: 'End date cannot be before the effective date', path: ['endDate'] })

export const contractListSchema = z.object({
  id: z.string().uuid().optional(),
  ids: z.string().optional(),
  search: z.string().trim().max(200).optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
  contractType: z.enum(CONTRACT_TYPES).optional(),
  customerEntityId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
  sortField: z
    .enum(['contractNumber', 'title', 'status', 'effectiveDate', 'endDate', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
})

export type ContractCreateInput = z.infer<typeof contractCreateSchema>
export type ContractUpdateInput = z.infer<typeof contractUpdateSchema>
export type ContractListQuery = z.infer<typeof contractListSchema>

/** `yyyy-MM-dd` → Date at UTC midnight, the framework's convention for date-only columns. */
export function dayToDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`)
}

/** Date column value (Date or string from the driver) → `yyyy-MM-dd`. */
export function toDay(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10)
  const text = String(value)
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null
}
