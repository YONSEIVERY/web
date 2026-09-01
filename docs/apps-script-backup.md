# 포털 백업 Apps Script (학회 계정)

지원자 백업(`/api/backup-recruit`)은 이미 돌고 있다. 이 문서는 포털 백업 두
엔드포인트(`/api/backup-portal`, `/api/backup-portal/files`)를 학회 구글 계정의
**새 Apps Script 프로젝트**에 넣고 매일 트리거를 거는 방법이다.

배경은 `ops-handbook.md` 4.5절에 있다. 요약하면, 이 프로젝트는 Supabase Free
플랜이라 플랫폼 자동 백업이 없고 이 드라이브 사본이 유일한 복원 지점이다.

**기존 지원자 백업 프로젝트에 이어 붙이지 않는다.** Apps Script는 한 프로젝트의
모든 스크립트 파일을 하나의 전역 스코프에서 실행한다. 파일을 나눠도 스코프는
나뉘지 않는다. 상수 이름이 하나만 겹쳐도 `const` 재선언은 로드 시점 오류라
프로젝트 전체가 실행 불가가 되고, 그러면 지금 정상 동작 중인 지원자 백업까지
같이 멈춘다. 프로젝트를 따로 두면 스코프도 권한 승인도 트리거도 분리된다.
([전역 스코프 근거](https://developers.google.com/apps-script/guides/v8-runtime))
그래도 안전하게, 아래 코드의 모든 최상위 이름에는 `PORTAL_` 접두사를 붙였다.

## 먼저 채울 값

세 가지뿐이다. 이 셋을 채우지 않으면 어디서도 돌지 않는다.

| 값 | 넣는 곳 | 어디서 얻나 |
|---|---|---|
| `PORTAL_ALERT_TO` | 코드 상단 상수 | 경고 메일을 받을 학회 Gmail 주소. 플레이스홀더를 그대로 두면 경고가 어디로도 가지 않는다 |
| `CRON_SECRET` | 스크립트 속성 (프로젝트 설정 > 스크립트 속성) | Vercel 프로젝트 대시보드 사이드바의 Environment Variables 목록에서 `CRON_SECRET` 값을 복사한다. 서버와 한 글자라도 다르면 401이다 |
| `PORTAL_BASE` | 코드 상단 상수 | 이미 프로덕션 도메인으로 채워져 있다. 도메인을 바꾸지 않았다면 그대로 둔다 |

시크릿은 코드에 직접 쓰지 않고 스크립트 속성에 둔다. 스크립트 속성은 그
스크립트를 쓰는 모두가 공유하는 저장소이므로
([문서](https://developers.google.com/apps-script/guides/properties)),
이 프로젝트를 아무에게도 편집자로 공유하지 않는 것이 전제다. 아래 "권한" 절을
볼 것.

## 코드

아래 블록 전체가 `Code.gs` 한 파일이다. 나눠 넣지 말고 통째로 붙여 넣는다.
이름이 밑줄로 끝나는 함수는 보조 함수라는 관례 표시다
([근거](https://developers.google.com/apps-script/guides/libraries)).
직접 실행할 함수는 `backupPortal`과 `portalShowState` 둘뿐이다.

```javascript
/**
 * VERY 포털 백업. 매일 트리거가 backupPortal()을 부른다.
 * 서버는 드라이브 자격증명을 갖지 않는다. 이쪽이 당겨 오는 pull 구조다.
 */

// ===== 설정 =====

// 서비스 도메인.
const PORTAL_BASE = 'https://yonseivery.com'

// 경고 메일 수신 주소. 반드시 학회 Gmail 주소로 바꾼다.
const PORTAL_ALERT_TO = '학회지메일주소@gmail.com'

// 첫 실행에서 이 이름으로 폴더를 만든다. 이후로는 이름이 아니라 ID로 찾는다.
const PORTAL_FOLDER_NAME = 'VERY 포털 백업'

// 기준선 대비 행수가 이 비율 아래로 떨어지면 경고한다.
// 정상 운영에서 행은 늘기만 한다. 급감은 사고 신호다.
const PORTAL_ROW_DROP_RATIO = 0.9

// 일일 덤프 보관 기간. 개인정보가 든 사본이라 무기한 쌓지 않는다.
const PORTAL_DUMP_KEEP_DAYS = 90

// 한 실행에서 자산을 내려받는 시간 예산. 실행 한도는 6분이고 초과하면 예외로
// 죽어 경고조차 못 보낸다. 예산에서 스스로 빠져나온 뒤 남은 건수를 보고한다.
const PORTAL_TIME_BUDGET_MS = 4.5 * 60 * 1000

// 한 실행의 경고 메일 상한. 소비자 계정은 하루 100통이고, 넘기면 MailApp이
// 예외를 던져 백업 자체가 멈춘다. 실패는 모아서 요약 한 통으로 보낸다.
const PORTAL_MAX_ALERTS_PER_RUN = 4

// 드라이브 여유가 이보다 적으면 덤프만 남기고 자산 단계를 건너뛴다.
// 덤프가 복원의 핵심이다. 사진보다 먼저 지킨다.
const PORTAL_MIN_HEADROOM_BYTES = 1024 * 1024 * 1024

let portalAlertCount_ = 0

// ===== 본체 =====

function backupPortal() {
  const startedAt = Date.now()
  portalAlertCount_ = 0

  try {
    const folder = portalFolder_()
    const headroom = portalCheckStorage_()

    const dumped = portalBackupDump_(folder)
    portalPurgeOldDumps_(folder)
    if (!dumped) return

    if (headroom < PORTAL_MIN_HEADROOM_BYTES) {
      portalAlert_('드라이브 여유 공간이 ' +
        Math.round(headroom / 1048576) + 'MB 뿐이라 자산 백업을 건너뜁니다. ' +
        '테이블 덤프는 저장했습니다. 용량을 정리하거나 늘리십시오.')
      return
    }
    portalBackupAssets_(folder, startedAt)
  } catch (e) {
    // 예외로 끝나면 트리거 실패 알림은 뜨지만 그것은 대표가 보는 채널이 아니다.
    // 우리 경고 메일로도 한 통 남기고, 실행 기록에도 남도록 다시 던진다.
    console.error(e)
    portalAlert_('백업이 예외로 중단됐습니다. 편집기 왼쪽 실행 기록을 ' +
      '확인하십시오.\n' + String(e).slice(0, 300))
    throw e
  }
}

// 1) 테이블 전수 덤프
function portalBackupDump_(folder) {
  const res = UrlFetchApp.fetch(PORTAL_BASE + '/api/backup-portal', {
    headers: { Authorization: 'Bearer ' + portalSecret_() },
    muteHttpExceptions: true,
  })
  const code = res.getResponseCode()
  if (code !== 200) {
    portalAlert_('포털 덤프 실패: HTTP ' + code +
      ' (' + res.getContentText().slice(0, 100) + ')')
    return false
  }

  // 서버는 x-total-rows 같은 헤더로도 같은 값을 준다. 그러나 Apps Script가
  // 돌려주는 헤더 이름의 대소문자는 공식 문서에 규정이 없고, 못 찾으면
  // undefined가 조용히 0으로 바뀌어 감지가 영구히 죽는다. 본문을 정본으로 삼는다.
  const body = res.getContentText()
  let dump = null
  try {
    dump = JSON.parse(body)
  } catch (e) {
    dump = null
  }

  // 파일 이름은 덤프 자신이 말하는 시각(takenAt, UTC)에서 뽑는다.
  // 파일명과 내용이 어긋나면 복원할 때 어느 파일인지 헷갈린다.
  const stamp =
    dump && typeof dump.takenAt === 'string' && dump.takenAt.length >= 10
      ? dump.takenAt.slice(0, 10)
      : new Date().toISOString().slice(0, 10)

  // 원문 바이트 그대로 저장한다. 문자열로 한 번 옮기면 인코딩 사고가 낄 틈이 생긴다.
  folder.createFile(
    Utilities.newBlob(res.getContent(), 'application/json',
      'portal-' + stamp + '.json')
  )

  // 2) 이상 감지. 저장은 이미 했다. 받은 만큼은 남기고 경고만 띄운다
  if (!dump || typeof dump.totalRows !== 'number' ||
      !Array.isArray(dump.failed)) {
    portalAlert_('덤프 JSON 형식이 예상과 다릅니다. 파일은 저장했으나 ' +
      '이상 감지를 건너뜁니다.')
    return true
  }

  const totalRows = dump.totalRows
  const failed = dump.failed
  if (failed.length > 0) {
    const names = []
    for (let i = 0; i < failed.length && i < 10; i++)
      names.push(String(failed[i].table))
    portalAlert_('포털 덤프에 실패한 테이블이 ' + failed.length + '개 있습니다: ' +
      names.join(', ') + '\nJSON의 failed 항목을 확인하십시오.')
  }

  // Supabase는 요청당 기본 1000행까지만 준다. 서버에 페이지네이션이 없으므로
  // 어떤 테이블이 1000행에 닿으면 덤프가 조용히 잘린 것일 수 있다.
  const capped = []
  const tables = dump.tables || {}
  for (const name in tables) {
    const c = tables[name] ? tables[name].count : 0
    if (typeof c === 'number' && c >= 1000) capped.push(name + '(' + c + ')')
  }
  if (capped.length > 0) {
    portalAlert_('1000행에 닿은 테이블이 있습니다: ' + capped.join(', ') +
      '\nSupabase 기본 상한에 잘렸을 수 있습니다. ' +
      'lib/portal/backup.ts에 페이지네이션이 필요합니다.')
  }

  // 기준선은 최고점으로 둔다. 사고 뒤에도 기준선이 살아 있어야 경고가 이어진다.
  const props = PropertiesService.getScriptProperties()
  const peak = Number(props.getProperty('PORTAL_PEAK_ROWS') || 0)
  if (peak > 0 && totalRows < peak * PORTAL_ROW_DROP_RATIO) {
    portalAlert_('포털 행수가 급감했습니다. 기준 ' + peak + ' -> 오늘 ' +
      totalRows + '. 삭제 사고일 수 있습니다. audit_log를 확인하십시오. ' +
      '정상적인 감소라면 스크립트 속성 PORTAL_PEAK_ROWS를 ' + totalRows +
      '로 직접 낮추십시오.')
  }
  // 부분 실패한 날의 낮은 값으로 기준선을 오염시키지 않는다.
  if (failed.length === 0 && totalRows > peak)
    props.setProperty('PORTAL_PEAK_ROWS', String(totalRows))

  return true
}

// 3) 사진과 자산
function portalBackupAssets_(folder, startedAt) {
  const res = UrlFetchApp.fetch(PORTAL_BASE + '/api/backup-portal/files', {
    headers: { Authorization: 'Bearer ' + portalSecret_() },
    muteHttpExceptions: true,
  })
  const code = res.getResponseCode()
  if (code !== 200) {
    portalAlert_('포털 자산 목록 실패: HTTP ' + code +
      ' (' + res.getContentText().slice(0, 100) + ')')
    return
  }
  const list = JSON.parse(res.getContentText())
  const files = list && list.files ? list.files : []
  const assets = portalAssetsFolder_(folder)

  // 파일마다 getFilesByName을 부르면 드라이브 왕복이 파일 수만큼 생긴다.
  // 사진이 1000장을 넘으면 그것만으로 6분을 다 쓴다. 폴더를 한 번만 훑는다.
  const have = {}
  const it = assets.getFiles()
  while (it.hasNext()) have[it.next().getName()] = true

  const deadline = startedAt + PORTAL_TIME_BUDGET_MS
  const errors = []
  let saved = 0
  let skipped = 0
  let left = 0
  let badUrl = 0

  for (let i = 0; i < files.length; i++) {
    const name = portalAssetName_(files[i])
    const url = portalAssetUrl_(files[i])
    if (!name || !url) {
      badUrl++
      continue
    }
    if (have[name]) {
      skipped++
      continue
    }
    if (Date.now() > deadline) {
      // 남은 것 중 아직 없는 것만 센다. 다음 실행이 이어받는다.
      for (let j = i; j < files.length; j++) {
        const n = portalAssetName_(files[j])
        if (n && !have[n]) left++
      }
      break
    }
    try {
      const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true })
      if (r.getResponseCode() !== 200) {
        console.error('asset ' + name + ': HTTP ' + r.getResponseCode())
        errors.push(name + '(HTTP ' + r.getResponseCode() + ')')
        continue
      }
      assets.createFile(r.getBlob().setName(name))
      have[name] = true
      saved++
    } catch (e) {
      // 예외 문자열에는 서명 URL이 섞일 수 있다. 메일에는 파일 이름만 싣고
      // 상세는 실행 로그로만 보낸다. 메일은 지메일에 영구히 남는다.
      console.error('asset ' + name + ': ' + e)
      errors.push(name)
    }
  }

  portalReportAssets_(files.length, list, saved, skipped, left, badUrl, errors)
}

// 실행마다 요약을 남기고, 이상이 있을 때만 메일 한 통을 보낸다.
function portalReportAssets_(listLength, list, saved, skipped, left, badUrl, errors) {
  const props = PropertiesService.getScriptProperties()
  const summary = '목록 ' + listLength + ' / 신규 ' + saved + ' / 기존 ' + skipped +
    ' / 미처리 ' + left + ' / 실패 ' + errors.length + ' / 주소이상 ' + badUrl
  props.setProperty('PORTAL_LAST_ASSET_SUMMARY',
    new Date().toISOString() + ' ' + summary)
  console.log(summary)

  const problems = []
  if (left > 0)
    problems.push('시간 예산 안에 ' + left + '건을 못 받았습니다. ' +
      '다음 실행이 이어받습니다. 며칠 이어지면 트리거를 하루 두 번으로 늘리십시오.')
  if (errors.length > 0)
    problems.push('내려받기 실패 ' + errors.length + '건. 앞 20건: ' +
      errors.slice(0, 20).join(', '))
  if (badUrl > 0)
    problems.push('주소를 알아볼 수 없는 항목 ' + badUrl + '건을 건너뛰었습니다.')

  const declared = list && typeof list.count === 'number' ? list.count : listLength
  if (declared !== listLength)
    problems.push('서버가 말한 개수(' + declared + ')와 실제 목록 길이(' +
      listLength + ')가 다릅니다.')

  // 서버는 서명에 실패한 사진을 목록에서 뺀다(files/route.ts의 filter).
  // signedExpected가 시도한 개수라서 정확히 몇 장이 빠졌는지 알 수 있다.
  if (list && typeof list.signedExpected === 'number' &&
      typeof list.signedCount === 'number' &&
      list.signedCount < list.signedExpected) {
    problems.push('세션 기록 사진 ' +
      (list.signedExpected - list.signedCount) + '장의 서명 URL 발급이 ' +
      '실패해 이번 백업에서 빠졌습니다. 스토리지 상태를 확인하십시오.')
  }

  const prev = Number(props.getProperty('PORTAL_LAST_ASSET_COUNT') || 0)
  if (prev > 0 && listLength < prev * PORTAL_ROW_DROP_RATIO)
    problems.push('자산 목록이 급감했습니다. 지난 실행 ' + prev + ' -> 이번 ' +
      listLength + '. 서명 실패로 항목이 빠졌을 수 있습니다.')
  if (listLength > 0) props.setProperty('PORTAL_LAST_ASSET_COUNT', String(listLength))

  if (problems.length > 0) portalAlert_(summary + '\n\n' + problems.join('\n'))
}

// ===== 보조 =====

function portalSecret_() {
  const secret = PropertiesService.getScriptProperties()
    .getProperty('CRON_SECRET')
  if (!secret)
    throw new Error('스크립트 속성 CRON_SECRET이 비어 있습니다. ' +
      '프로젝트 설정 > 스크립트 속성에서 넣으십시오.')
  return secret
}

// 폴더는 이름이 아니라 ID로 붙든다. 이름으로 찾으면 동명 폴더나 공유받은
// 폴더가 잡힐 수 있고, 대표가 폴더를 치우면 조용히 새 폴더를 만들어
// 자산을 처음부터 다시 받는다.
function portalFolder_() {
  const props = PropertiesService.getScriptProperties()
  const id = props.getProperty('PORTAL_FOLDER_ID')
  if (id) {
    const folder = DriveApp.getFolderById(id) // 없으면 예외. 조용히 새로 만들지 않는다
    if (folder.isTrashed())
      throw new Error('백업 폴더가 휴지통에 있습니다. 복구하십시오. 폴더 ID ' + id)
    return folder
  }
  const folder = DriveApp.createFolder(PORTAL_FOLDER_NAME)
  props.setProperty('PORTAL_FOLDER_ID', folder.getId())
  portalAlert_('백업 폴더를 새로 만들었습니다.\n' + folder.getUrl() +
    '\n폴더 ID를 스크립트 속성 PORTAL_FOLDER_ID에 기록했습니다. ' +
    '이 메일이 첫 실행 말고 또 오면 폴더나 속성이 사라졌다는 뜻입니다.')
  return folder
}

function portalAssetsFolder_(parent) {
  const it = parent.getFoldersByName('assets')
  return it.hasNext() ? it.next() : parent.createFolder('assets')
}

// 공개 자산의 saveAs는 행 id로만 만들어져서 사진을 교체해도 이름이 그대로다.
// 이름만 보고 건너뛰면 교체된 사진은 영원히 백업되지 않는데, 서버는 교체 후
// 옛 파일을 스토리지에서 지운다. 스토리지 객체 이름(업로드마다 새 uuid)을
// 덧붙여 교체분이 새 파일이 되게 한다. 옛 사본은 이력으로 남는다.
// 서명 URL(세션 사진)에는 적용하지 않는다. 토큰이 매일 바뀌기 때문이다.
function portalAssetName_(file) {
  if (!file || typeof file.saveAs !== 'string' || !file.saveAs) return null
  const url = typeof file.url === 'string' ? file.url : ''
  const isPublic =
    url.indexOf('/storage/v1/object/public/') !== -1 ||
    url.charAt(0) === '/' ||
    url.indexOf(PORTAL_BASE) === 0
  if (!isPublic) return file.saveAs
  const object = url.split('?')[0].split('/').pop()
  if (!object) return file.saveAs
  return portalSafeName_(file.saveAs.replace(/\.[^.]*$/, '') + '_' + object)
}

// partners의 로고에는 '/partners/nocoders.svg' 같은 사이트 상대 경로가 들어 있다.
// UrlFetchApp에는 기준 주소가 없어 상대 경로는 그대로 실패한다. 도메인을 붙인다.
function portalAssetUrl_(file) {
  if (!file || typeof file.url !== 'string' || !file.url) return null
  const url = file.url
  if (url.indexOf('https://') === 0 || url.indexOf('http://') === 0) return url
  if (url.charAt(0) === '/') return PORTAL_BASE + url
  return null
}

function portalSafeName_(name) {
  return name.replace(/[\\/:*?"<>|]/g, '_')
}

// 90일이 지난 덤프를 휴지통으로 보낸다. 자산 폴더는 건드리지 않는다.
function portalPurgeOldDumps_(folder) {
  const cutoff = new Date(Date.now() - PORTAL_DUMP_KEEP_DAYS * 86400000)
  const it = folder.getFiles()
  let trashed = 0
  while (it.hasNext()) {
    const f = it.next()
    if (f.getName().indexOf('portal-') !== 0) continue
    if (f.getDateCreated() < cutoff) {
      f.setTrashed(true)
      trashed++
    }
  }
  if (trashed > 0) console.log('오래된 덤프 ' + trashed + '개를 휴지통으로 보냈습니다.')
}

// 계정 용량이 차면 드라이브 저장과 지메일 발송이 함께 막힌다. 즉 백업이
// 멈춘 사실을 알릴 방법도 같이 사라진다. 여유가 있을 때 미리 알린다.
function portalCheckStorage_() {
  const limit = DriveApp.getStorageLimit()
  const used = DriveApp.getStorageUsed()
  const headroom = limit - used
  if (headroom < limit * 0.2) {
    portalAlert_('드라이브 사용량이 ' + Math.round((used / limit) * 100) +
      '%입니다. 한도를 넘으면 백업 저장과 경고 메일이 함께 멈춥니다. ' +
      '오래된 파일을 정리하거나 용량을 늘리십시오.')
  }
  return headroom
}

// 경고는 모아서 보낸다. 파일당 한 통씩 보내면 하루 100통 한도에 걸리고,
// 그때 MailApp이 던지는 예외가 백업을 먼저 죽인다.
function portalAlert_(message) {
  console.log(message)
  portalAlertCount_++
  if (portalAlertCount_ > PORTAL_MAX_ALERTS_PER_RUN) return
  try {
    // 제목은 고정한다. 본문 내용이 제목이나 알림 미리보기로 새지 않게 한다.
    MailApp.sendEmail(PORTAL_ALERT_TO, '[VERY 백업 경고] 포털', message)
  } catch (e) {
    console.error('경고 메일 발송 실패(쿼터 추정): ' + e)
  }
}

// 점검용. 실행하면 실행 로그에 상태가 찍힌다. CRON_SECRET은 일부러 찍지 않는다.
function portalShowState() {
  const props = PropertiesService.getScriptProperties()
  const keys = ['PORTAL_FOLDER_ID', 'PORTAL_PEAK_ROWS',
    'PORTAL_LAST_ASSET_COUNT', 'PORTAL_LAST_ASSET_SUMMARY']
  for (let i = 0; i < keys.length; i++)
    console.log(keys[i] + ' = ' + props.getProperty(keys[i]))
  console.log('드라이브 여유 ' +
    Math.round((DriveApp.getStorageLimit() - DriveApp.getStorageUsed()) / 1048576) +
    'MB')
}
```

## 설치 절차

순서를 지킨다. 특히 트리거는 맨 마지막이다. 승인 전에 트리거가 먼저 돌면 그
실행은 권한 오류로 실패하고, 그 실패는 우리 경고 메일이 아니라 구글의 트리거
실패 알림으로만 온다.

1. **새 프로젝트를 만든다.** 학회 구글 계정으로 로그인한 상태에서
   script.google.com > 새 프로젝트. 이름은 "VERY 포털 백업".
   성공 신호: 빈 `Code.gs`가 열린다.
2. **코드를 붙여 넣는다.** `Code.gs` 내용을 전부 지우고 위 블록을 통째로 붙여
   넣은 뒤 저장한다. 성공 신호: 빨간 오류 표시 없이 저장되고, 상단 실행 대상
   드롭다운에서 `backupPortal`을 고를 수 있다.
3. **`PORTAL_ALERT_TO`를 학회 Gmail 주소로 바꾼다.** 성공 신호: 코드 상단에
   플레이스홀더가 남아 있지 않다.
4. **스크립트 속성에 `CRON_SECRET`을 넣는다.** 프로젝트 설정 > 스크립트 속성 >
   스크립트 속성 추가. 값은 Vercel의 `CRON_SECRET`과 정확히 같아야 한다.
   성공 신호: 속성 목록에 `CRON_SECRET` 한 줄이 보인다.
5. **`backupPortal`을 수동 실행하고 권한을 승인한다.** 승인 창에서 계정을 고르고
   전부 허용한다. 부분 거부하면 이후 실행이 계속 권한 오류로 실패한다.
   성공 신호: 실행 로그가 오류 없이 끝나고, 왼쪽 실행 기록 탭의 상태가 "완료".
6. **메일함을 본다.** 첫 실행에서는 "백업 폴더를 새로 만들었습니다" 안내가 한 통
   온다. 정상이다. 폴더 링크가 그 메일에 있다.
7. **드라이브를 본다.** "VERY 포털 백업" 폴더에 `portal-YYYY-MM-DD.json`이 있고,
   `assets` 하위 폴더에 파일이 30개 안팎(멤버 사진 24 + 데모데이 포스터 6 +
   동문 로고 1 규모)이다. 세션 기록 사진은 학기 시작 전이라 0개가 정상이다.
8. **JSON을 연다.** `totalRows`가 0이 아니고 `failed`가 빈 배열인지 본다.
   파일 이름의 날짜는 덤프의 `takenAt`(UTC) 기준이다. 새벽 4시(KST)에 돌면
   전날 날짜가 붙는다. 어긋난 것이 아니라 파일명과 내용을 맞춘 결과다.
9. **`portalShowState`를 실행한다.** 실행 로그에 `PORTAL_FOLDER_ID`,
   `PORTAL_PEAK_ROWS`, 자산 요약, 드라이브 여유가 찍히는지 본다.
   성공 신호: 폴더 ID가 비어 있지 않다.
10. **트리거를 건다.** 아래 절 참고.
11. **다음날 아침 확인한다.** 폴더에 새 `portal-*.json`이 있고 경고 메일이
    오지 않았으면 설치가 끝난 것이다.

## 트리거

편집기 왼쪽 시계 아이콘 > 트리거 추가. `backupPortal`, 시간 기반, 일 단위,
새벽 4시~5시. 지원자 백업 트리거와 시간을 겹치지 않게 둔다. 시간 기반 트리거는
지정한 한 시간 안의 임의 시각에 돈다
([문서](https://developers.google.com/apps-script/guides/triggers/installable)).

트리거는 만든 사람의 계정 권한으로 돈다. 반드시 학회 계정으로 로그인한 상태에서
등록한다. 임원 개인 계정으로 등록하면 백업 사본이 그 사람 드라이브에 쌓인다.

## 첫 몰아받기

학기가 진행되면 세션 기록 사진이 쌓인다. 24명 x 세션 12회 x 최대 6장이면
연말에 1000장을 넘고 장당 최대 10MB다. 실행 한 번의 예산은 4분 30초라
하루에 다 못 받는다. 못 받은 건수는 요약 메일에 "미처리"로 나오고 다음 실행이
이어받는다. 굶는 파일은 생기지 않는다. 이미 받은 파일은 폴더를 한 번 훑어
만든 이름 맵으로 즉시 건너뛰기 때문이다.

밀린 양이 많을 때는 편집기에서 `backupPortal`을 몇 번 연달아 수동 실행해
따라잡는 편이 빠르다. 다만 트리거 총 실행시간이 일반 계정 기준 하루 90분이고
지원자 백업과 그 예산을 나눠 쓴다는 점은 염두에 둔다. 하루에 여러 번 돌리면
같은 이름의 덤프 파일이 여러 개 생기는데, 정상이고 90일 뒤 함께 정리된다.

## 실패했을 때

먼저 볼 곳은 두 군데다. 편집기 상단의 **실행 로그**(방금 돌린 실행의 출력)와
왼쪽의 **실행 기록** 탭(트리거 실행 포함 전체 이력, 실패 사유가 여기 남는다).
경고 메일에 안 담은 상세는 전부 이쪽에 있다.

| 증상 | 원인 | 조치 |
|---|---|---|
| `Authorization is required to perform that action.` | 승인을 안 했거나, 코드가 새 서비스를 쓰기 시작해 재승인이 필요하다 | 편집기에서 `backupPortal`을 수동 실행해 승인 창을 다시 띄운다 |
| 경고 메일 "포털 덤프 실패: HTTP 401" | 스크립트 속성 `CRON_SECRET`이 없거나 Vercel 값과 다르다 | 두 값을 다시 맞춘다. 시크릿을 교체했다면 양쪽을 같이 바꾼다 |
| 같은 메일에 HTTP 503 | 서버에 `CRON_SECRET` 환경변수가 없다 | Vercel 환경변수를 확인하고 재배포한다 |
| "포털 자산 목록 실패: HTTP 500" | 서버의 DB 읽기나 서명 URL 발급이 실패했다 | Vercel 함수 로그에서 `[backup-portal/files]`를 찾는다 |
| `Exceeded maximum execution time` | 6분 한도 초과. 시간 예산 밖에서 오래 걸린 다운로드가 있었다는 뜻이다 | 대개 다음 실행이 이어받는다. 매일 반복되면 트리거를 하루 두 번으로 늘린다 |
| `Service invoked too many times: sendEmail` | 하루 100통 한도 초과. 계정 전체가 공유하는 예산이다 | 다음날 회복된다. 반복되면 다른 스크립트의 메일 발송을 함께 확인한다 |
| `Identifier 'PORTAL_...' has already been declared` | 같은 프로젝트에 코드를 두 번 붙여 넣었거나 다른 파일과 이름이 겹친다 | 중복 파일을 지운다. 이 오류가 나면 그 프로젝트의 모든 함수가 멈춘다 |
| 경고 메일 "백업이 예외로 중단됐습니다" + `No item with the given ID` | 백업 폴더가 휴지통에 갔거나 완전히 지워졌다 | 휴지통에서 복구한다. 정말 없으면 스크립트 속성 `PORTAL_FOLDER_ID`를 지운다. 다음 실행이 새 폴더를 만들지만 자산은 처음부터 다시 받는다 |
| 스크립트는 도는데 자산이 안 늘어난다 | `assets` 폴더가 휴지통에 갔거나 목록이 비었다 | `portalShowState`의 자산 요약을 보고, 드라이브 휴지통을 확인한다 |
| 아무 메일도 안 오고 파일도 안 생긴다 | 트리거가 꺼졌거나 승인이 풀렸다 | 실행 기록 탭에서 마지막 실행 시각과 상태를 본다 |

경고 메일이 오지 않는 것은 정상이 아니라 정보가 없는 상태다. 매달 점검이 필요한
이유가 그것이다.

## 이 스크립트가 보내는 경고

한 실행에서 메일은 최대 4통이다. 그 이상은 실행 로그에만 남는다.

- **행수 급감**: 최고점 대비 10% 넘게 줄었다. 삭제 사고 의심. `audit_log`를 본다.
  의도한 감소라면 스크립트 속성 `PORTAL_PEAK_ROWS`를 손으로 낮춰야 경고가 멎는다.
  자동으로 낮추지 않는 이유는, 낮아진 값을 기준으로 삼으면 이튿날부터 감시가
  스스로 꺼지기 때문이다
- **실패한 테이블**: 일부 테이블 덤프가 실패했다. 나머지는 저장됐다
- **1000행에 닿은 테이블**: 덤프가 잘렸을 수 있다. 서버 수정이 필요하다
- **자산 요약**: 미처리, 실패, 목록 급감 중 하나라도 있을 때만 온다
- **드라이브 사용량 80%**: 용량이 차면 백업과 경고 메일이 함께 멈춘다
- **폴더 생성 안내**: 첫 실행에서 한 번. 두 번째부터 오면 폴더가 사라진 것이다

## 매달 점검

`ops-handbook.md` 4.5절의 월 1일 점검에 두 줄을 더한다.

1. 드라이브 폴더의 최신 `portal-*.json` 날짜가 어제인지
2. `portalShowState`를 실행해 자산 요약의 날짜가 어제이고 "미처리"가 0인지
3. 드라이브 여유 용량이 넉넉한지 (같은 로그에 찍힌다)

덤프 파일만 보면 자산 단계가 통째로 비어도 통과한다. 그래서 2번이 필요하다.

## 보관 기간과 개인정보

이 백업은 학회원과 지원자의 이름, 이메일, 전화, 학번, 생년월일이 든 사본을
매일 구글 드라이브에 만든다. 원본을 지워도 사본이 남으면 파기가 끝난 것이 아니다.

- 일일 덤프는 90일만 두고 자동으로 휴지통에 보낸다(`PORTAL_DUMP_KEEP_DAYS`).
  휴지통 항목은 30일 뒤 완전히 지워지고 그때까지는 용량도 계속 차지한다
  ([문서](https://support.google.com/drive/answer/2375102)). 즉시 파기해야 하면
  휴지통을 직접 비운다
- 자산 사본은 자동으로 지우지 않는다. 사진을 교체하면 옛 사본이 이력으로 남는다
- 모집 종료 후 1년이 지난 기수를 정리할 때는 DB와 스토리지뿐 아니라 이 폴더의
  덤프와 자산까지 함께 지운다. `ops-handbook.md`의 "매년 여름 정리" 항목에
  드라이브 두 폴더를 명시할 것
- 정보주체가 삭제를 요청하면 DB 삭제와 같은 날 드라이브 사본도 지운다
- **처리방침과의 불일치가 남아 있다.** `/privacy`(`lib/content/privacy.ts`)는
  수탁자를 Supabase, Vercel, Resend 셋으로만 공개하고 "국내 리전 저장"을
  단언한다. 구글 드라이브 보관은 그 목록에 없다. 문안 수정과 시행일 갱신은
  학회장 결정 사항이므로 이 문서와 별개로 처리한다

## 권한

스크립트 편집 권한은 사실상 전체 개인정보 열람 권한이다. 편집자는 스크립트
속성의 `CRON_SECRET`을 읽어 어디서든 덤프를 내려받을 수 있고, 코드 한 줄을 고쳐
덤프를 자기 메일로 보낼 수도 있다. 기록은 남지 않는다.

1. 이 프로젝트는 학회 계정 단독 소유로 둔다. 누구에게도 편집자로 공유하지 않는다.
   인수인계는 공유가 아니라 계정 인계로 한다
2. 학회 구글 계정에 2단계 인증을 켠다. 비밀번호를 단톡이나 공유 문서에 두지 않는다
3. 백업 폴더를 임원진에게 공유하지 않는다. 폴더 권한은 그 안의 모든 파일에
   상속되므로, 한 번 공유하면 이후 쌓이는 덤프까지 전부 열린다. 복원이 필요하면
   대표가 필요한 파일만 꺼내 전달한다
4. `ops-handbook.md`는 시크릿 보관 위치를 "Apps Script 상수"라고 적고 있다.
   포털 쪽은 스크립트 속성이다. 지원자 백업 스크립트가 아직 코드에 시크릿을
   박아 두고 있다면 같은 방식으로 옮기고, 그 김에 값을 교체한다
   (Vercel 환경변수 갱신 -> 두 스크립트 속성 갱신 -> 수동 실행 확인 순서)

경고 메일에는 서명 URL과 예외 전문을 싣지 않는다. 상세는 실행 로그에만 남긴다.
참고로 지원자 백업 쪽 `saveAs`에는 지원자 실명이 들어간다. 이 요약 방식을 그쪽에
복사할 때는 파일명 대신 건수만 넣을 것.

## 알려진 한계 (서버 쪽에서 고칠 것)

스크립트로는 감지만 하고 근본 해결은 못 하는 것들이다.

- ~~**1000행 상한**~~ **(해결)**: `lib/portal/backup.ts`에 페이지네이션을 넣었다.
  테이블마다 기본키로 정렬해 1000행씩 끝까지 읽는다. 정렬을 고정하지 않으면
  페이지 경계에서 같은 행을 두 번 받거나 놓친다. 스크립트의 1000행 경고는
  이중 안전장치로 남겨 둔다
- ~~**서명 실패가 조용히 사라진다**~~ **(해결)**: 응답에 `signedExpected`(시도한
  개수)를 추가했다. 스크립트가 `signedCount`와 대조해 몇 장이 빠졌는지 정확히
  알리도록 함께 고쳤다
- **상대 경로 URL**: `partners`의 로고에는 `/partners/nocoders.svg` 같은 사이트
  상대 경로가 들어 있다. 스크립트가 도메인을 붙여 처리하지만, 서버가 절대 URL로
  통일하는 편이 옳다
- **교체된 공개 자산**: 서버의 `saveAs`가 행 id로만 만들어져 사진을 교체해도
  이름이 같다. 스크립트가 URL의 객체 이름을 덧붙여 우회한다. 서버가 `saveAs`에
  객체 이름을 넣으면 이 우회가 필요 없어진다

## 복원할 때

JSON 덤프는 테이블별 원본 행이다. 복원은 자동화하지 않았다. 사고 상황마다
필요한 범위가 달라서, 스크립트로 전체를 되돌리는 편이 오히려 위험하기
때문이다. 필요한 테이블의 `rows` 배열만 꺼내 SQL Editor에서 insert 한다.
그때도 `begin;` 으로 감싸고 결과를 본 뒤 `commit;` 한다.

## 근거

이 문서의 판단이 기대는 공식 문서다.

- 실행 6분, 소비자 계정 메일 100통/일, 트리거 총 90분/일, UrlFetch 20,000회/일,
  응답 50MB/호출, 속성 값 9KB:
  https://developers.google.com/apps-script/guides/services/quotas
- 프로젝트의 모든 파일이 하나의 전역 스코프에서 실행된다:
  https://developers.google.com/apps-script/guides/v8-runtime
- `getAllHeaders()`는 헤더 맵을 돌려줄 뿐 이름의 대소문자를 규정하지 않는다:
  https://developers.google.com/apps-script/reference/url-fetch/http-response
- `muteHttpExceptions` 기본값은 false다:
  https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app
- `getFolderById`, `getStorageUsed`, `getStorageLimit`:
  https://developers.google.com/apps-script/reference/drive/drive-app
- `Folder.isTrashed`, `getFiles`:
  https://developers.google.com/apps-script/reference/drive/folder
- `File.getDateCreated`, `setTrashed`:
  https://developers.google.com/apps-script/reference/drive/file
- 스크립트 속성은 그 스크립트를 쓰는 모두가 공유한다:
  https://developers.google.com/apps-script/guides/properties
- 설치형 트리거는 만든 사람의 계정으로 실행된다:
  https://developers.google.com/apps-script/guides/triggers/installable
- 권한 오류와 쿼터 초과 오류의 해결:
  https://developers.google.com/apps-script/guides/support/troubleshooting
- 구글 계정 15GB는 드라이브, 지메일, 포토가 함께 쓴다:
  https://support.google.com/googleone/answer/9312312
- Supabase 기본 1000행 상한:
  https://supabase.com/docs/reference/javascript/v1/select
