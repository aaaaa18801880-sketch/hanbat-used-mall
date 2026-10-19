import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const newTitle = "우성 45박스 업소용 4도어 직냉식 냉장냉동고 (냉동 1칸 / 냉장 3칸)";
const newDesc = `[한눈에 보는 제품 정보]
식당 및 업소 주방에서 가장 대중적으로 사용되는 우성 45박스 4도어 직냉식 냉장냉동고입니다. 총 4개 도어 중 좌측 상단 1칸은 냉동실, 나머지 3칸(우측 2칸 + 좌측 하단 1칸)은 대용량 냉장실로 나뉘어 있어, 신선 식자재와 자주 사용하는 냉동 식재료를 기기 한 대에서 동선 효율적으로 분리 보관할 수 있습니다.

[제품 특징]
• 도어별 냉장/냉동 분할 수납: 좌상단 1칸 냉동실 + 나머지 3칸 냉장실 구성으로 불필요한 냉기 유출을 최소화
• 견고한 스테인리스 외관: 오염과 부식에 강해 바쁜 업소 주방에서도 위생적인 관리 가능
• 직냉식 강력 냉각: 벽면 직접 냉각 방식으로 식재료의 수분 증발을 억제하여 신선도 유지

[주요 사양]
• 모델명: CWS-1243RF
• 도어 및 구획 구성: 4도어 (냉동 1칸 / 냉장 3칸)
• 냉동실 위치: 좌측 상단 1도어 (영하 -15℃ 이하 세팅)
• 냉장실 위치: 우측 상·하단 및 좌측 하단 3도어 (영상 0~7℃ 세팅)
• 크기(외경): 1,260 × 800 × 1,900 mm (가로×깊이×높이)
• 전원 규격: 단상 220V / 60Hz (정격전류 2.5A)
• 제품 중량: 150kg
• 출고일자: 2022년 9월

[점검 및 A/S 안내]
• 한밭중고전자 입고 점검: 콤프레셔 및 냉매 압력 정상 작동 검수, 내부 선반 및 고무 패킹 분해 고압 살균 세척 완료
• 무상 A/S 보증: 한밭중고전자 자체 직영 4개월 무상 A/S 보증 (업소용 전문 기사 출장 점검)

[구매 및 설치 전 확인사항]
• 진입 동선 실측: 제품 가로폭(1,260mm), 깊이(800mm), 높이(1,900mm)를 감안하여 매장 출입문 통과 폭과 주방 진입 동선을 반드시 사전에 측정해 주세요.
• 전원 연결: 단상 220V 전용 벽면 콘센트 연결을 권장합니다.
• 관리 팁: 직냉식 기기 특성상 주기적인 성에 제거 및 관리가 필요합니다.

[상담 안내]
설치 매장 위치(지역), 주방 출입구 폭, 설치 층수(엘리베이터 유무)를 알려주시면 안전한 직배송 및 현장 안착 견적을 신속히 안내해 드립니다.`;

async function update() {
  const { data, error } = await supabase
    .from('products')
    .update({
      title: newTitle,
      description: newDesc,
    })
    .eq('id', 'ea9e6591-9145-4f84-be92-e42a3e1a3c49')
    .select();

  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log('Update success:', data?.[0]?.title);
  }
}

update();
