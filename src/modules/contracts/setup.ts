import type { ModuleSetupConfig } from '@open-mercato/shared/modules/setup'

/**
 * Default role grants for the contracts module.
 *
 * Applied when a tenant is initialized. For tenants that already exist, run
 * `yarn mercato auth sync-role-acls` after changing these grants.
 */
export const setup: ModuleSetupConfig = {
  defaultRoleFeatures: {
    superadmin: ['contracts.*'],
    admin: ['contracts.*'],
    employee: ['contracts.contracts.view'],
  },
}

export default setup
