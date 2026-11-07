export const metadata = {
  requireAuth: true,
  requireFeatures: ['contracts.contracts.manage'],
  pageTitle: 'New contract',
  pageTitleKey: 'contracts.contracts.create.title',
  pageGroup: 'Contracts',
  pageGroupKey: 'contracts.nav.group',
  pageOrder: 101,
  icon: 'file-text',
  breadcrumb: [
    { label: 'Contracts', labelKey: 'contracts.contracts.page.title', href: '/backend/contracts' },
    { label: 'New contract', labelKey: 'contracts.contracts.create.title' },
  ],
}
