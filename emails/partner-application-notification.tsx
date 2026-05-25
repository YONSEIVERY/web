import { Html, Head, Body, Container, Heading, Text, Hr, Button, Section } from '@react-email/components'

interface Props {
  id: string
  name: string
  category: string
  one_liner: string
  applicant_name: string
  applicant_email: string
  applicant_note?: string | null
}

export default function PartnerApplicationNotification(p: Props) {
  const adminUrl = `https://yonseivery.com/admin/applications/partner/${p.id}`
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', padding: '24px' }}>
        <Container style={{ background: 'white', maxWidth: '560px', padding: '32px', border: '1px solid #e7e5e4' }}>
          <Heading as="h2" style={{ fontSize: '16px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            VERY · 신규 파트너십 신청
          </Heading>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Section>
            <Row label="회사명" value={p.name} />
            <Row label="카테고리" value={p.category} />
            <Row label="신청자" value={`${p.applicant_name} (${p.applicant_email})`} />
          </Section>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Text style={{ fontSize: '14px', lineHeight: 1.7 }}>{p.one_liner}</Text>
          {p.applicant_note && (
            <>
              <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
              <Text style={{ fontSize: '13px', color: '#57534e', whiteSpace: 'pre-wrap' }}>{p.applicant_note}</Text>
            </>
          )}
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
