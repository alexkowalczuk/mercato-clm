"use client"
import * as React from 'react'
import { CrudForm, type CrudField, type CrudFormGroup } from '@open-mercato/ui/backend/CrudForm'
import { createCrud } from '@open-mercato/ui/backend/utils/crud'
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
