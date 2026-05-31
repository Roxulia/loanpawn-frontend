import { useNavigate } from 'react-router'
import { routePaths } from '../../app/routes/paths'
import { Button } from '../../components/atoms'
import { Card, KeyValueList, SectionHeader } from '../../components/molecules'
import { useTenantSession } from '../../contexts/useTenantSession'

export function ProfilePage() {
  const navigate = useNavigate()
  const { currentUser, session } = useTenantSession()
  const user = currentUser ?? session?.user ?? null

  return (
    <section className="page">
      <SectionHeader
        title="Profile Setting"
        subtitle="Review your tenant account details."
        action={(
          <Button onClick={() => navigate(routePaths.profileChangePassword)} variant="primary">
            Change Password
          </Button>
        )}
      />

      <Card title={user?.name ?? 'Profile'} description={user?.email ?? 'No email recorded.'}>
        <KeyValueList
          items={[
            { key: 'Username', value: user?.username ?? '-' },
            { key: 'Name', value: user?.name ?? '-' },
            { key: 'Email', value: user?.email ?? '-' },
            { key: 'Phone', value: user?.phone ?? '-' },
            { key: 'NRC', value: user?.nrc ?? '-' },
            { key: 'Status', value: user?.status ?? '-' },
            { key: 'Address', value: user?.address ?? '-' },
          ]}
        />
      </Card>
    </section>
  )
}
