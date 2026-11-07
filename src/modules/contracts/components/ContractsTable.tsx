"use client"
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import type { LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy'
import type { SortingState } from '@tanstack/react-table'
import { DataTable } from '@open-mercato/ui/backend/DataTable'
import type { FilterValues } from '@open-mercato/ui/backend/FilterBar'
import { Button } from '@open-mercato/ui/primitives/button'
import { fetchCrudList } from '@open-mercato/ui/backend/utils/crud'
import { useOrganizationScopeVersion } from '@open-mercato/shared/lib/frontend/useOrganizationScope'
import { useT } from '@open-mercato/shared/lib/i18n/context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type ContractRow = {
  id: string
  contractNumber: string
  title: string
  customerName: string | null
  totalValue: string | null
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
const CONTRACT_TYPES = ['msa', 'nda', 'sow', 'service_agreement', 'other']
const STATUSES = ['draft', 'in_review', 'approved', 'active', 'expired', 'terminated']

export default function ContractsTable() {
  const t = useT()
  const router = useRouter()
  const scopeVersion = useOrganizationScopeVersion()
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const [filterValues, setFilterValues] = React.useState<FilterValues>({})
  const [sorting, setSorting] = React.useState<SortingState>([])

  const columns = React.useMemo<ColumnDef<ContractRow>[]>(() => [
    { accessorKey: 'contractNumber', header: t('contracts.contracts.table.column.number', 'Number'), meta: { priority: 1 } },
    { accessorKey: 'title', header: t('contracts.contracts.table.column.title', 'Title'), meta: { priority: 1 } },
    { accessorKey: 'customerName', header: t('contracts.contracts.table.column.customer', 'Customer'), enableSorting: false, cell: ({ getValue }) => (getValue() as string | null) ?? '—', meta: { priority: 2 } },
    { accessorKey: 'totalValue', header: t('contracts.contracts.table.column.value', 'Value'), enableSorting: false, cell: ({ row }) => (row.original.totalValue ? `${row.original.totalValue} ${row.original.currencyCode ?? ''}`.trim() : '—'), meta: { priority: 3 } },
    { accessorKey: 'contractType', header: t('contracts.contracts.table.column.type', 'Type'), enableSorting: false, cell: ({ getValue }) => { const value = String(getValue() ?? ''); return t(`contracts.contracts.type.${value}`, value) }, meta: { priority: 3 } },
    { accessorKey: 'status', header: t('contracts.contracts.table.column.status', 'Status'), cell: ({ getValue }) => { const value = String(getValue() ?? ''); return t(`contracts.contracts.status.${value}`, value) }, meta: { priority: 2 } },
    { accessorKey: 'effectiveDate', header: t('contracts.contracts.table.column.effectiveDate', 'Effective'), cell: ({ getValue }) => (getValue() as string | null) ?? '—', meta: { priority: 4 } },
    { accessorKey: 'endDate', header: t('contracts.contracts.table.column.endDate', 'Ends'), cell: ({ getValue }) => (getValue() as string | null) ?? '—', meta: { priority: 4 } },
  ], [t])

  const queryParams = React.useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
    const sort = sorting[0]
    if (sort) {
      params.set('sortField', sort.id)
      params.set('sortDir', sort.desc ? 'desc' : 'asc')
    }
    if (search.trim()) params.set('search', search.trim())
    if (typeof filterValues.status === 'string' && filterValues.status) params.set('status', filterValues.status)
    if (typeof filterValues.contractType === 'string' && filterValues.contractType) params.set('contractType', filterValues.contractType)
    return params.toString()
  }, [page, search, filterValues, sorting])

  const { data, isLoading, error } = useQuery<ContractsResponse>({
    queryKey: ['contracts', queryParams, scopeVersion],
    queryFn: async () => fetchCrudList<ContractRow>('contracts/contracts', Object.fromEntries(new URLSearchParams(queryParams))),
  })

  if (error) {
    return <div className="text-sm text-destructive">{t('contracts.contracts.table.error.generic', 'Failed to load contracts')}</div>
  }

  return (
    <DataTable
      title={t('contracts.contracts.table.title', 'Contracts')}
      titleHeadingLevel={1}
      actions={(
        <Button asChild>
          <Link href="/backend/contracts/create">{t('contracts.contracts.table.actions.create', 'New contract')}</Link>
        </Button>
      )}
      columns={columns}
      data={data?.items ?? []}
      entityId="contracts:contract"
      extensionTableId="contracts.contracts.list"
      searchValue={search}
      onSearchChange={(value) => {
        setSearch(value)
        setPage(1)
      }}
      searchPlaceholder={t('contracts.contracts.table.search.placeholder', 'Search by number or title…')}
      searchAlign="right"
      filters={[
        {
          id: 'status',
          label: t('contracts.contracts.table.filters.status', 'Status'),
          type: 'select',
          options: STATUSES.map((value) => ({ value, label: t(`contracts.contracts.status.${value}`, value) })),
        },
        {
          id: 'contractType',
          label: t('contracts.contracts.table.filters.contractType', 'Type'),
          type: 'select',
          options: CONTRACT_TYPES.map((value) => ({ value, label: t(`contracts.contracts.type.${value}`, value) })),
        },
      ]}
      filterValues={filterValues}
      onFiltersApply={(values: FilterValues) => {
        setFilterValues(values)
        setPage(1)
      }}
      onFiltersClear={() => {
        setFilterValues({})
        setPage(1)
      }}
      sortable
      sorting={sorting}
      onSortingChange={(next) => {
        setSorting(next)
        setPage(1)
      }}
      pagination={{
        page,
        pageSize: PAGE_SIZE,
        total: data?.total || 0,
        totalPages: data?.totalPages || 0,
        onPageChange: setPage,
      }}
      isLoading={isLoading}
      onRowClick={(row) => router.push(`/backend/contracts/${row.id}/edit`)}
    />
  )
}
