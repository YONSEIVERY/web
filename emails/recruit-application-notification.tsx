import { Html, Head, Body, Container, Heading, Text, Hr, Button, Section } from '@react-email/components'

interface Props {
  applicationId: string
  cohort: number
  name: string
  phone: string
  email: string
  remoteReason: string | null
  fileName: string
}

export default function RecruitApplicationNotification(p: Props) {
  const adminUrl = 'https://yonseivery.com/admin/recruit'
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', padding: '24px' }}>
        <Container style={{ background: 'white', maxWidth: '560px', padding: '32px', border: '1px solid #e7e5e4' }}>
          <Heading as="h2" style={{ fontSize: '16px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            VERY · {p.cohort}기 지원서 접수
          </Heading>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Section>
            <Row label="이름" value={p.name} />
            <Row label="연락처" value={p.phone} />
            <Row label="이메일" value={p.email} />
            <Row label="지원서" value={p.fileName} />
            {p.remoteReason && (
              <Row label="비대면 사유" value={p.remoteReason} />
            )}
          </Section>
          <Hr style={{ margin: '24px 0', borderColor: '#e7e5e4' }} />
          <Button
            href={adminUrl}
            style={{ background: 'black', color: 'white', padding: '12px 20px', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            ADMIN에서 지원자 보기 →
          </Button>
        </Container>
      </Body>
    </Html>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={{ margin: '4px 0', fontSize: '13px' }}>
      <span style={{ display: 'inline-block', width: '90px', color: '#78716c', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      <span>{value}</span>
    </Text>
  )
}
