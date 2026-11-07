import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import ContractsTable from '../../components/ContractsTable'

export default function ContractsPage() {
  return (
    <Page>
      <PageBody>
        <ContractsTable />
      </PageBody>
    </Page>
  )
}
