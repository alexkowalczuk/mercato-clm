import { z } from 'zod'
import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import {
  createCrudOpenApiFactory,
  createPagedListResponseSchema,
  type CrudOpenApiOptions,
} from '@open-mercato/shared/lib/openapi/crud'

export const contractsCreatedSchema = z.object({ id: z.string().uuid() })
export const contractsOkSchema = z.object({ ok: z.literal(true) })

const buildContractsCrudOpenApi = createCrudOpenApiFactory({
  defaultTag: 'Contracts',
  defaultCreateResponseSchema: contractsCreatedSchema,
  defaultOkResponseSchema: contractsOkSchema,
  makeListDescription: ({ pluralLower }) =>
    `Returns a paginated collection of ${pluralLower} in the current tenant scope.`,
})

export function createContractsCrudOpenApi(options: CrudOpenApiOptions): OpenApiRouteDoc {
  return buildContractsCrudOpenApi(options)
}

export function createContractsPagedListResponseSchema(itemSchema: z.ZodTypeAny) {
  return createPagedListResponseSchema(itemSchema, { paginationMetaOptional: true })
}
