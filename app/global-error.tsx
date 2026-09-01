'use client'

import { useEffect } from 'react'

/**
 * 최후의 에러 경계. 루트 레이아웃을 통째로 대체하므로 globals.css도
 * next/font도 적용되지 않는다. 그래서 디자인 토큰 대신 인라인 스타일로
 * 최소한만 그린다(색 값은 globals.css의 토큰과 같은 값을 그대로 옮긴 것).
 * metadata export를 쓸 수 없어 제목은 React의 <title>로 단다.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[global] root error', error)
  }, [error])

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#161616',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          wordBreak: 'keep-all',
        }}
      >
        <title>오류 · VERY</title>
        <main
          style={{
            width: '100%',
            maxWidth: '32rem',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '40px',
          }}
        >
          <p
            translate="no"
            style={{
              margin: 0,
              fontFamily: 'ui-monospace, monospace',
              fontSize: '10px',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: '#8a8f9a',
            }}
          >
            VERY · ERROR
          </p>
          <h1 style={{ margin: '16px 0 0', fontSize: '22px', lineHeight: 1.4 }}>
            화면을 불러오지 못했습니다.
          </h1>
          <p
            style={{
              margin: '16px 0 0',
              fontSize: '14px',
              lineHeight: 1.8,
              color: '#b4b7be',
            }}
          >
            잠시 후 다시 시도해주세요. 같은 화면이 반복되면 아래 코드와 함께
            임원진에게 알려주세요.
          </p>
          {error.digest && (
            <p
              translate="no"
              style={{
                margin: '24px 0 0',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '10px',
                color: '#8a8f9a',
              }}
            >
              ERROR ID · {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              margin: '32px 0 0',
              padding: '12px 24px',
              border: '1px solid #ffffff',
              backgroundColor: 'transparent',
              color: '#ffffff',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '11px',
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  )
}
