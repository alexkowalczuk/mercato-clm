"use client"
import * as React from 'react'
import { CrudForm, type CrudField, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud, updateCrud, deleteCrud, fetchCrudList } from '@open-mercato/ui/backend/utils/crud'
import { withFlash } from '@open-mercato/ui/backend/utils/flash'
import { ErrorMessage, RecordNotFoundState } from '@open-mercato/ui/backend/detail'
import { useT } from '@open-mercato/shared/lib/i18n/context'

const ENTITY_ID = 'contracts:contract'
const LIST_HREF = '/backend/contracts'

type Translate = ReturnType<typeof useT>

const CONTRACT_TYPES = ['msa', 'nda', 'sow', 'service_agreement', 'other']
const DIRECTIONS = ['sell', 'buy']
const STATUSES = ['draft', 'in_review', 'approved', 'active', 'expired', 'terminated']

function useContractFields(t: Translate): CrudField[] {
  return React.useMemo<CrudField[]>(() => [
    { id: 'contractNumber', label: t('contracts.contracts.form.fields.contractNumber', 'Contract number'), type: 'text', required: true, layout: 'half' },
    { id: 'title', label: t('contracts.contracts.form.fields.title', 'Title'), type: 'text', required: true },
    {
      id: 'contractType',
      label: t('contracts.contracts.form.fields.contractType', 'Type'),
      type: 'select',
      required: true,
      layout: 'half',
      options: CONTRACT_TYPES.map((value) => ({ value, label: t(`contracts.contracts.type.${value}`, value) })),
    },
    {
      id: 'direction',
      label: t('contracts.contracts.form.fields.direction', 'Direction'),
      type: 'select',
      layout: 'half',
      options: DIRECTIONS.map((value) => ({ value, label: t(`contracts.contracts.direction.${value}`, value) })),
    },
    {
      id: 'status',
      label: t('contracts.contracts.form.fields.status', 'Status'),
      type: 'select',
      layout: 'half',
      options: STATUSES.map((value) => ({ value, label: t(`contracts.contracts.status.${value}`, value) })),
    },
    { id: 'effectiveDate', label: t('contracts.contracts.form.fields.effectiveDate', 'Effective date'), type: 'datepicker', required: true, layout: 'half' },
    { id: 'endDate', label: t('contracts.contracts.form.fields.endDate', 'End date'), type: 'datepicker', layout: 'half' },
    { id: 'currencyCode', label: t('contracts.contracts.form.fields.currencyCode', 'Currency'), type: 'text', layout: 'half' },
    { id: 'description', label: t('contracts.contracts.form.fields.description', 'Description'), type: 'textarea' },
  ], [t])
}

function useContractGroups(t: Translate): CrudFormGroup[] {
  return React.useMemo<CrudFormGroup[]>(() => [
    { id: 'details', title: t('contracts.contracts.form.groups.details', 'Details'), column: 1, fields: ['contractNumber', 'title', 'contractType', 'direction', 'description'] },
    { id: 'terms', title: t('contracts.contracts.form.groups.terms', 'Terms'), column: 2, fields: ['status', 'effectiveDate', 'endDate', 'currencyCode'] },
  ], [t])
}

export function ContractCreateForm() {
  const t = useT()
  const fields = useContractFields(t)
  const groups = useContractGroups(t)
  const successRedirect = React.useMemo(
    () => `${LIST_HREF}?flash=${encodeURIComponent(t('contracts.contracts.form.flash.created', 'Contract created'))}&type=success`,
    [t],
  )

  return (
    <CrudForm
      title={t('contracts.contracts.form.create.title', 'New contract')}
      titleHeadingLevel={1}
      backHref={LIST_HREF}
      entityId={ENTITY_ID}
      fields={fields}
      groups={groups}
      initialValues={{ direction: 'sell', status: 'draft', currencyCode: 'USD' }}
      submitLabel={t('contracts.contracts.form.create.submit', 'Create contract')}
      cancelHref={LIST_HREF}
      successRedirect={successRedirect}
      onSubmit={async (vals) => {
        const body = vals as Record<string, unknown>
        await createCrud('contracts/contracts', { ...body, endDate: body.endDate || null })
      }}
    />
  )
}

type ContractRecord = {
  id: string
  contractNumber: string
  title: string
  contractType: string
  direction: string
  status: string
  effectiveDate: string | null
  endDate: string | null
  currencyCode: string | null
  description: string | null
  updatedAt: string | null
}

type ContractFormValues = {
  id: string
  contractNumber: string
  title: string
  contractType: string
  direction: string
  status: string
  effectiveDate?: string
  endDate?: string
  currencyCode: string
  description: string
  updatedAt?: string | null
}

function toContractFormValues(item: ContractRecord): ContractFormValues {
  return {
    id: item.id,
    contractNumber: item.contractNumber,
    title: item.title,
    contractType: item.contractType,
    direction: item.direction,
    status: item.status,
    effectiveDate: item.effectiveDate ?? undefined,
    endDate: item.endDate ?? undefined,
    currencyCode: item.currencyCode ?? '',
    description: item.description ?? '',
    updatedAt: item.updatedAt ?? null,
  }
}

export function ContractEditForm({ id }: { id: string }) {
  const t = useT()
  const [initial, setInitial] = React.useState<ContractFormValues | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [err, setErr] = React.useState<string | null>(null)
  const [isNotFound, setIsNotFound] = React.useState(false)
  const fields = useContractFields(t)
  const groups = useContractGroups(t)
  const successRedirect = React.useMemo(
    () => `${LIST_HREF}?flash=${encodeURIComponent(t('contracts.contracts.form.flash.saved', 'Contract saved'))}&type=success`,
    [t],
  )
  const deleteRedirect = React.useMemo(
    () => withFlash(LIST_HREF, t('contracts.contracts.form.flash.deleted', 'Contract deleted'), 'success'),
    [t],
  )

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setErr(null)
      setIsNotFound(false)
      try {
        const data = await fetchCrudList<ContractRecord>('contracts/contracts', { ids: String(id), pageSize: 50 })
        const item = data?.items?.find((row) => row.id === id)
        if (!item) {
          if (!cancelled) setIsNotFound(true)
          return
        }
        if (!cancelled) setInitial(toContractFormValues(item))
      } catch (error: unknown) {
        if (!cancelled) {
          if ((error as { status?: number }).status === 404) {
            setIsNotFound(true)
          } else {
            setErr(error instanceof Error && error.message ? error.message : t('contracts.contracts.form.error.load', 'Failed to load contract'))
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, t])

  const fallbackInitialValues = React.useMemo<ContractFormValues>(() => ({
    id,
    contractNumber: '',
    title: '',
    contractType: 'other',
    direction: 'sell',
    status: 'draft',
    currencyCode: '',
    description: '',
    updatedAt: null,
  }), [id])

  if (isNotFound) {
    return (
      <RecordNotFoundState
        label={t('contracts.contracts.form.error.notFound', 'Contract not found')}
        backHref={LIST_HREF}
        backLabel={t('contracts.contracts.form.actions.backToList', 'Back to contracts')}
      />
    )
  }

  if (err) return <ErrorMessage label={err} />

  return (
    <CrudForm<ContractFormValues>
      title={t('contracts.contracts.form.edit.title', 'Edit contract')}
      titleHeadingLevel={1}
      backHref={LIST_HREF}
      entityId={ENTITY_ID}
      fields={fields}
      groups={groups}
      initialValues={initial ?? fallbackInitialValues}
      submitLabel={t('contracts.contracts.form.edit.submit', 'Save changes')}
      cancelHref={LIST_HREF}
      successRedirect={successRedirect}
      deleteRedirect={deleteRedirect}
      isLoading={loading}
      loadingMessage={t('contracts.contracts.form.loading', 'Loading contract…')}
      onSubmit={async (vals) => {
        const body = vals as Record<string, unknown>
        await updateCrud('contracts/contracts', { ...body, endDate: body.endDate || null })
      }}
      onDelete={async () => { await deleteCrud('contracts/contracts', String(id)) }}
    />
  )
}
