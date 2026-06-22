import { Html, Head, Body, Container, Heading, Text, Hr, Button, Section } from '@react-email/components'

interface Props {
  eventId: string
  attendeeId: string
  volume: number
  semester: string
  name: string
  affiliation: string
  email: string
  phone: string
  isVeryAlumni: boolean
  veryCohort: number | null
  attendAfterparty: boolean | null
  purposes: string[]
  role: string
  referralSources: string[]
}

export default function DemodayAttendeeNotification(p: Props) {
  const adminUrl = `https://yonseivery.com/admin/demoday/${p.eventId}/attendees`
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', padding: '24px' }}>
        <Container style={{ background: 'white', maxWidth: '560px', padding: '32px', border: '1px solid #e7e5e4' }}>
          <Heading as="h2" style={{ fontSize: '16px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            VERY · 데모데이 Vol.{p.volume} 참관 신청
          </Heading>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Section>
            <Row label="회차" value={`Vol.${p.volume} / ${p.semester}`} />
            <Row label="이름" value={p.name} />
            <Row label="소속" value={p.affiliation} />
            <Row label="이메일" value={p.email} />
            <Row label="연락처" value={p.phone} />
            <Row label="역할" value={p.role} />
            <Row
              label="VERY 동문"
              value={
                p.isVeryAlumni
                  ? p.veryCohort
                    ? `예 (${p.veryCohort}기)`
                    : '예'
                  : '아니요'
              }
            />
            {p.attendAfterparty !== null && (
              <Row label="뒷풀이" value={p.attendAfterparty ? '참석' : '불참'} />
            )}
            {p.purposes.length > 0 && (
              <Row label="참가 목적" value={p.purposes.join(', ')} />
            )}
            {p.referralSources.length > 0 && (
              <Row label="알게된 경로" value={p.referralSources.join(', ')} />
            )}
          </Section>
          <Hr style={{ margin: '24px 0', borderColor: '#e7e5e4' }} />
          <Button
            href={adminUrl}
            style={{ background: 'black', color: 'white', padding: '12px 20px', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            ADMIN에서 명단 보기 →
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
