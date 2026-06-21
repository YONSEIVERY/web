import { Html, Head, Body, Container, Heading, Text, Hr, Button, Section } from '@react-email/components'

interface Props {
  id: string
  type: 'GENERAL' | 'INDUSTRY'
  name: string
  email: string
  affiliation?: string | null
  subject: string
  message: string
}

export default function InquiryNotification(p: Props) {
  const adminUrl = `https://yonseivery.com/admin/inquiries?id=${p.id}`
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', padding: '24px' }}>
        <Container style={{ background: 'white', maxWidth: '560px', padding: '32px', border: '1px solid #e7e5e4' }}>
          <Heading as="h2" style={{ fontSize: '16px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            VERY · 신규 {p.type === 'INDUSTRY' ? '산학협력 ' : ''}문의
          </Heading>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Section>
            <Row label="이름" value={p.name} />
            <Row label="이메일" value={p.email} />
            {p.affiliation && <Row label="소속/회사" value={p.affiliation} />}
            <Row label="분류" value={p.subject} />
          </Section>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Text style={{ whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.7 }}>{p.message}</Text>
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
