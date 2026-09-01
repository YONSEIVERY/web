# 포털 백업 Apps Script (학회 계정)

지원자 백업(`/api/backup-recruit`)은 이미 돌고 있다. 이 문서는 **포털 백업 두
엔드포인트를 기존 스크립트에 추가**하는 방법이다. 학회 구글 계정의
Apps Script 프로젝트에 붙여 넣고 매일 트리거를 건다.

배경은 `ops-handbook.md` 4.5절에 있다. 요약하면, 이 프로젝트는 Supabase Free
플랜이라 플랫폼 자동 백업이 없고 이 드라이브 사본이 유일한 복원 지점이다.

## 상수

`CRON_SECRET`은 Vercel 환경변수와 같은 값이어야 한다. 스크립트 속성
(프로젝트 설정 > 스크립트 속성)에 넣고 코드에 직접 쓰지 않는다.

```javascript
const BASE = 'https://yonseivery.com'
const SECRET = PropertiesService.getScriptProperties().getProperty('CRON_SECRET')
const PORTAL_FOLDER = 'VERY 포털 백업'
const ALERT_TO = '학회지메일주소@gmail.com'

// 전날 대비 행수가 이 비율 아래로 떨어지면 경고한다.
// 정상 운영에서 행은 늘기만 한다. 급감은 사고 신호다.
const ROW_DROP_ALERT_RATIO = 0.9
```

## 본체

```javascript
function backupPortal() {
  const folder = getOrCreateFolder(PORTAL_FOLDER)
  const stamp = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd')

  // 1) 테이블 전수 덤프
  const res = UrlFetchApp.fetch(BASE + '/api/backup-portal', {
    headers: { Authorization: 'Bearer ' + SECRET },
    muteHttpExceptions: true,
  })
  if (res.getResponseCode() !== 200) {
    alert('포털 덤프 실패: HTTP ' + res.getResponseCode())
    return
  }

  const headers = res.getAllHeaders()
  const totalRows = Number(headers['x-total-rows'] || 0)
  const failedCount = Number(headers['x-failed-count'] || 0)

  folder.createFile(
    Utilities.newBlob(res.getContent(), 'application/json',
      'portal-' + stamp + '.json')
  )

  // 2) 이상 감지. 저장은 이미 했다. 받은 만큼은 남기고 경고만 띄운다
  if (failedCount > 0) {
    alert('포털 덤프에 실패한 테이블이 ' + failedCount + '개 있습니다. ' +
          'JSON의 failed 항목을 확인하십시오.')
  }
  const prev = Number(
    PropertiesService.getScriptProperties().getProperty('LAST_TOTAL_ROWS') || 0
  )
  if (prev > 0 && totalRows < prev * ROW_DROP_ALERT_RATIO) {
    alert('포털 행수가 급감했습니다. 어제 ' + prev + ' -> 오늘 ' + totalRows +
          '. 삭제 사고일 수 있습니다. audit_log를 확인하십시오.')
  }
  PropertiesService.getScriptProperties()
    .setProperty('LAST_TOTAL_ROWS', String(totalRows))

  // 3) 사진과 자산
  const filesRes = UrlFetchApp.fetch(BASE + '/api/backup-portal/files', {
    headers: { Authorization: 'Bearer ' + SECRET },
    muteHttpExceptions: true,
  })
  if (filesRes.getResponseCode() !== 200) {
    alert('포털 자산 목록 실패: HTTP ' + filesRes.getResponseCode())
    return
  }
  const list = JSON.parse(filesRes.getContentText())
  const assets = getOrCreateSubFolder(folder, 'assets')

  list.files.forEach(function (f) {
    // 이미 받은 파일은 건너뛴다 (증분)
    if (assets.getFilesByName(f.saveAs).hasNext()) return
    try {
      const blob = UrlFetchApp.fetch(f.url).getBlob().setName(f.saveAs)
      assets.createFile(blob)
    } catch (e) {
      alert('자산 내려받기 실패: ' + f.saveAs + ' / ' + e)
    }
  })
}

function getOrCreateFolder(name) {
  const it = DriveApp.getFoldersByName(name)
  return it.hasNext() ? it.next() : DriveApp.createFolder(name)
}

function getOrCreateSubFolder(parent, name) {
  const it = parent.getFoldersByName(name)
  return it.hasNext() ? it.next() : parent.createFolder(name)
}

function alert(message) {
  MailApp.sendEmail(ALERT_TO, '[VERY 백업 경고] ' + message, message)
}
```

## 트리거

편집기 왼쪽 시계 아이콘 > 트리거 추가. `backupPortal`, 시간 기반, 일 단위,
새벽 4시~5시. 지원자 백업 트리거와 시간을 겹치지 않게 둔다.

## 설치 후 확인

1. 편집기에서 `backupPortal`을 한 번 수동 실행한다. 첫 실행에서 드라이브
   접근 권한을 묻는다
2. 드라이브에 "VERY 포털 백업" 폴더와 `portal-YYYY-MM-DD.json`이 생겼는지 본다
3. JSON을 열어 `totalRows`가 0이 아니고 `failed`가 빈 배열인지 확인한다
4. `assets` 하위 폴더에 멤버 사진이 내려왔는지 본다

## 복원할 때

JSON 덤프는 테이블별 원본 행이다. 복원은 자동화하지 않았다. 사고 상황마다
필요한 범위가 달라서, 스크립트로 전체를 되돌리는 편이 오히려 위험하기
때문이다. 필요한 테이블의 `rows` 배열만 꺼내 SQL Editor에서 insert 한다.
그때도 `begin;` 으로 감싸고 결과를 본 뒤 `commit;` 한다.
