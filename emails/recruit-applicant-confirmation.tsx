import { Html, Head, Body, Container, Heading, Text, Hr, Section } from '@react-email/components'

interface Props {
  cohort: number
  name: string
  fileName: string
}

/** 지원자 본인에게 보내는 접수 확인 메일. 발신은 noreply@yonseivery.com. */
export default function RecruitApplicantConfirmation(p: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', padding: '24px' }}>
        <Container style={{ background: 'white', maxWidth: '560px', padding: '32px', border: '1px solid #e7e5e4' }}>
          <Heading as="h2" style={{ fontSize: '16px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            VERY · {p.cohort}기 지원서 접수 완료
          </Heading>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Section>
            <Text style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.8' }}>
              {p.name}님, VERY {p.cohort}기 지원서가 정상 접수되었습니다.
            </Text>
            <Text style={{ margin: '12px 0 4px', fontSize: '13px', color: '#57534e' }}>
              접수 파일: {p.fileName}
            </Text>
            <Text style={{ margin: '12px 0 4px', fontSize: '13px', lineHeight: '1.8', color: '#57534e' }}>
              서류 결과와 면접 일정은 이 메일 주소와 남겨주신 연락처로
              안내드립니다. 제출 내용 수정이 필요하면
              yonseivery1997@gmail.com으로 연락해주세요.
            </Text>
          </Section>
          <Hr style={{ margin: '24px 0', borderColor: '#e7e5e4' }} />
          <Text style={{ margin: 0, fontSize: '11px', color: '#a8a29e' }}>
            본 메일은 발신 전용입니다. 연세대학교 창업학회 VERY · yonseivery.com
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
