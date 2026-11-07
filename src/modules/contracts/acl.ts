export const features = [
  { id: 'contracts.contracts.view', title: 'View contracts', module: 'contracts' },
  {
    id: 'contracts.contracts.manage',
    title: 'Manage contracts',
    module: 'contracts',
    dependsOn: ['contracts.contracts.view'],
  },
]

export default features
