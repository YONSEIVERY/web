import { Html, Head, Body, Container, Heading, Text, Hr, Section } from '@react-email/components'

interface Props {
  name: string
  cohort: number
  stage: 'docs' | 'final'
  pass: boolean
}

/**
 * 지원자 결과 통보 메일 (서류·최종 공용). 제목은 합불 무관하게 중립으로
 * 보내고 본문에서 결과를 알린다. 카피 수정은 이 파일에서.
 */
export default function RecruitResultNotification(p: Props) {
  const stageLabel = p.stage === 'docs' ? '서류 전형' : '최종 전형'
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', background: '#fafaf9', padding: '24px' }}>
        <Container style={{ background: 'white', maxWidth: '560px', padding: '32px', border: '1px solid #e7e5e4' }}>
          <Heading as="h2" style={{ fontSize: '16px', letterSpacing: '0.2em', textTransform: 'uppercase', margin: 0 }}>
            VERY · {p.cohort}기 {stageLabel} 결과
          </Heading>
          <Hr style={{ margin: '16px 0', borderColor: '#e7e5e4' }} />
          <Section>
            {p.pass ? (
              p.stage === 'docs' ? (
                <>
                  <Text style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.8' }}>
                    {p.name}님, VERY {p.cohort}기 서류 전형에 합격하셨습니다.
                    축하드립니다.
                  </Text>
                  <Text style={{ margin: '12px 0 4px', fontSize: '13px', lineHeight: '1.8', color: '#57534e' }}>
                    면접 일정과 장소는 남겨주신 연락처로 개별 안내드립니다.
                    연락을 받지 못하시면 아래 메일로 문의해주세요.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.8' }}>
                    {p.name}님, VERY {p.cohort}기 최종 합격을 축하드립니다.
                  </Text>
                  <Text style={{ margin: '12px 0 4px', fontSize: '13px', lineHeight: '1.8', color: '#57534e' }}>
                    오리엔테이션과 첫 일정 안내를 곧 보내드립니다. 한 학기
                    동안 함께 지반을 다져 봅시다.
                  </Text>
                </>
              )
            ) : (
              <>
                <Text style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.8' }}>
                  {p.name}님, VERY {p.cohort}기 {stageLabel}에 지원해주셔서
                  감사합니다.
                </Text>
                <Text style={{ margin: '12px 0 4px', fontSize: '13px', lineHeight: '1.8', color: '#57534e' }}>
                  아쉽게도 이번 {stageLabel}에서는 함께하지 못하게
                  되었습니다. 좋은 지원서를 보내주신 만큼 쉽지 않은
                  결정이었습니다. 다음 기수에서 다시 만나 뵙기를 바랍니다.
                </Text>
              </>
            )}
          </Section>
          <Hr style={{ margin: '24px 0', borderColor: '#e7e5e4' }} />
          <Text style={{ margin: 0, fontSize: '11px', color: '#a8a29e' }}>
            문의: yonseivery1997@gmail.com · 연세대학교 창업학회 VERY ·
            yonseivery.com
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
