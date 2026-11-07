export const metadata = {
  requireAuth: true,
  requireFeatures: ['contracts.contracts.manage'],
  pageTitle: 'Edit contract',
  pageTitleKey: 'contracts.contracts.edit.title',
  pageGroup: 'Contracts',
  pageGroupKey: 'contracts.nav.group',
  breadcrumb: [
    { label: 'Contracts', labelKey: 'contracts.contracts.page.title', href: '/backend/contracts' },
    { label: 'Edit', labelKey: 'contracts.contracts.edit.title' },
  ],
}
