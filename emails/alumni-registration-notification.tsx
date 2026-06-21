import { Html, Head, Body, Container, Heading, Text, Hr, Button, Section } from '@react-email/components'

interface Props {
  alumniId: string
  name: string
  cohort: number
  job_title: string
  bio: string
  hasCompany: boolean
  companyName?: string
}

export default function AlumniRegistrationNotification(p: Props) {
  const adminUrl = `https://yonseivery.com/admin/applications/alumni/${p.alumniId}`
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', padding: '24px' }}>
        <Container style={{ background: 'white', maxWidth: '560px', padding: '32px', border: '1px solid #e7e5e4' }}>
          <Heading as="h2" style={{ fontSize: '16px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            VERY · 신규 알럼나이 신청
          </Heading>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Section>
            <Row label="이름" value={p.name} />
            <Row label="기수" value={`${p.cohort}기`} />
            <Row label="현재" value={p.job_title} />
            {p.hasCompany && <Row label="동반 회사" value={p.companyName ?? '—'} />}
          </Section>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Text style={{ fontSize: '14px', lineHeight: 1.7 }}>{p.bio}</Text>
          <Hr style={{ margin: '24px 0', borderColor: '#e7e5e4' }} />
          <Button
            href={adminUrl}
            style={{ background: 'black', color: 'white', padding: '12px 20px', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            ADMIN에서 처리하기 →
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
