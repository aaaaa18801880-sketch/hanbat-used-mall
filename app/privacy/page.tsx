export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 text-center mb-8 pb-4 border-b border-slate-100">
          개인정보처리방침
        </h1>

        <div className="space-y-8 text-sm leading-relaxed text-slate-700">
          <p>
            <strong>한밭중고전자</strong>(이하 "회사")는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 개인정보와 관련된 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
          </p>

          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 text-base">1. 개인정보의 수집 및 이용목적</h2>
            <p>회사는 다음의 목적을 위해 개인정보를 처리합니다.</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>견적 상담 및 서비스 제공</li>
              <li>고객 문의 응대 및 불만처리</li>
              <li>서비스 개선 및 신규 서비스 개발</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 text-base">2. 수집하는 개인정보의 항목</h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>필수항목: 성함, 연락처</li>
              <li>선택항목: 제품종류, 요청사항 및 상세 내용</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 text-base">3. 개인정보의 보유 및 이용기간</h2>
            <p>
              회사는 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 관계법령에서 정한 일정한 기간 동안 정보를 보관합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
              <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
              <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 text-base">4. 개인정보의 제3자 제공</h2>
            <p>
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 요청이 있는 경우</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 text-base">5. 개인정보의 파기</h2>
            <p>
              회사는 원칙적으로 개인정보 처리목적이 달성된 경우에는 지체 없이 해당 개인정보를 파기합니다. 파기의 절차, 기한 및 방법은 다음과 같습니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
              <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 text-base">6. 개인정보 보호책임자</h2>
            <p>
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련된 정보주체의 불만처리 및 피해구제 등을 위하여 다음과 같이 개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">개인정보 보호책임자 (한밭중고전자)</p>
              <p>연락처: 042-523-8179</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 text-base">7. 개인정보처리방침 변경</h2>
            <p>
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </section>

          <div className="pt-6 border-t border-slate-100 text-xs text-slate-500">
            시행일자: 2026년 1월 1일
          </div>

          <div className="mt-8 text-center">
            <a href="/" className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-xs transition">
              메인으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}