"use client"
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import { fetchCrudList } from '@open-mercato/ui/backend/utils/crud'
import { useOrganizationScopeVersion } from '@open-mercato/shared/lib/frontend/useOrganizationScope'
import { useT } from '@open-mercato/shared/lib/i18n/context'

type ContractRow = {
  id: string
  contractNumber: string
  title: string
  contractType: string
  direction: string
  status: string
  effectiveDate: string | null
  endDate: string | null
  currencyCode: string | null
  updatedAt: string
}

type ContractsResponse = {
  items: ContractRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const PAGE_SIZE = 50

export default function ContractsTable() {
  const t = useT()
  const scopeVersion = useOrganizationScopeVersion()
  const [page, setPage] = React.useState(1)

  const columns = React.useMemo<ColumnDef<ContractRow>[]>(() => [
    { accessorKey: 'contractNumber', header: t('contracts.contracts.table.column.number', 'Number'), enableSorting: false, meta: { priority: 1 } },
    { accessorKey: 'title', header: t('contracts.contracts.table.column.title', 'Title'), enableSorting: false, meta: { priority: 1 } },
    { accessorKey: 'contractType', header: t('contracts.contracts.table.column.type', 'Type'), enableSorting: false, meta: { priority: 3 } },
    { accessorKey: 'status', header: t('contracts.contracts.table.column.status', 'Status'), enableSorting: false, meta: { priority: 2 } },
    { accessorKey: 'effectiveDate', header: t('contracts.contracts.table.column.effectiveDate', 'Effective'), enableSorting: false, meta: { priority: 4 } },
    { accessorKey: 'endDate', header: t('contracts.contracts.table.column.endDate', 'Ends'), enableSorting: false, meta: { priority: 4 } },
  ], [t])

  const { data, isLoading, error } = useQuery<ContractsResponse>({
    queryKey: ['contracts', page, scopeVersion],
    queryFn: async () => fetchCrudList<ContractRow>('contracts/contracts', {
      page: String(page),
      pageSize: String(PAGE_SIZE),
    }),
  })

  if (error) {
    return <div className="text-sm text-destructive">{t('contracts.contracts.table.error.generic', 'Failed to load contracts')}</div>
  }

  return (
    <DataTable
      title={t('contracts.contracts.table.title', 'Contracts')}
      titleHeadingLevel={1}
      columns={columns}
      data={data?.items ?? []}
      entityId="contracts:contract"
      extensionTableId="contracts.contracts.list"
      pagination={{
        page,
        pageSize: PAGE_SIZE,
        total: data?.total || 0,
        totalPages: data?.totalPages || 0,
        onPageChange: setPage,
      }}
      isLoading={isLoading}
    />
  )
}
