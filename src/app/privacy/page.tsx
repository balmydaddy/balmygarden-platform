export default function PrivacyPage() {
  const today = "2026년 5월 22일";
  return (
    <div style={{ maxWidth:800, margin:"0 auto", padding:"2rem 1rem", fontFamily:"system-ui,sans-serif", color:"#222", lineHeight:1.8 }}>
      <h1 style={{ fontSize:24, fontWeight:700, marginBottom:4 }}>개인정보처리방침</h1>
      <p style={{ fontSize:13, color:"#888", marginBottom:32 }}>시행일: {today}</p>

      {[
        {
          title:"1. 수집하는 개인정보 항목",
          content:`스마트 재구매 대시보드(이하 '서비스')는 다음과 같은 개인정보를 수집합니다.

• 필수 항목: 이메일 주소, 비밀번호(암호화 저장)
• 선택 항목: 이름, 가족 그룹 코드
• 자동 수집: 영수증 이미지에서 추출된 구매 이력(품목명, 가격, 구매처, 날짜)

영수증 이미지 자체는 서버에 저장되지 않으며, AI 분석 후 즉시 폐기됩니다.`
        },
        {
          title:"2. 개인정보 수집 및 이용 목적",
          content:`수집한 개인정보는 다음 목적으로만 사용됩니다.

• 회원 식별 및 서비스 제공
• 구매 이력 저장 및 분석
• 가족 그룹 데이터 공유
• 가격 알림 이메일 발송
• 서비스 개선을 위한 통계 분석 (개인 식별 불가한 형태)`
        },
        {
          title:"3. 개인정보 보유 및 이용 기간",
          content:`• 회원 탈퇴 시 즉시 삭제
• 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관

회원이 탈퇴를 요청할 경우 모든 구매 이력, 프로필 정보, 알림 설정이 즉시 삭제됩니다.`
        },
        {
          title:"4. 개인정보의 제3자 제공",
          content:`서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단, 다음의 경우는 예외입니다.

• 이용자가 사전에 동의한 경우
• 법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우`
        },
        {
          title:"5. 개인정보 처리 위탁",
          content:`서비스는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁하고 있습니다.

• Google (Gemini API): 영수증 이미지 AI 분석 — 분석 후 즉시 삭제
• Supabase: 데이터베이스 저장 및 인증 관리
• Resend: 가격 알림 이메일 발송
• Vercel: 서비스 호스팅`
        },
        {
          title:"6. 이용자의 권리",
          content:`이용자는 언제든지 다음 권리를 행사할 수 있습니다.

• 개인정보 열람 요청
• 개인정보 수정 요청
• 개인정보 삭제 요청 (회원 탈퇴)
• 개인정보 처리 정지 요청

권리 행사는 서비스 내 계정 관리 메뉴 또는 아래 이메일로 요청하실 수 있습니다.`
        },
        {
          title:"7. 쿠키 및 로컬스토리지 사용",
          content:`서비스는 다음 목적으로 브라우저 저장소를 사용합니다.

• 로그인 세션 유지
• 오프라인 구매 이력 임시 저장
• 알림 설정 저장

브라우저 설정에서 쿠키 및 로컬스토리지를 삭제할 수 있으나, 일부 서비스 기능이 제한될 수 있습니다.`
        },
        {
          title:"8. 개인정보 보호 책임자",
          content:`개인정보 처리에 관한 업무를 총괄하고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제를 위해 아래와 같이 개인정보 보호 책임자를 지정합니다.

• 이메일: xodmf224@gmail.com
• 개인정보 침해 신고: 개인정보보호위원회 (privacy.go.kr)`
        },
        {
          title:"9. 개인정보처리방침 변경",
          content:`이 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 내용이 변경될 수 있습니다. 변경 시 서비스 내 공지사항을 통해 고지합니다.`
        },
      ].map(s=>(
        <div key={s.title} style={{ marginBottom:28 }}>
          <h2 style={{ fontSize:16, fontWeight:700, marginBottom:8, paddingBottom:6, borderBottom:"1px solid #eee" }}>{s.title}</h2>
          <p style={{ fontSize:14, color:"#444", whiteSpace:"pre-line" }}>{s.content}</p>
        </div>
      ))}

      <div style={{ marginTop:40, padding:16, background:"#f8f8f8", borderRadius:8, fontSize:13, color:"#888" }}>
        본 방침은 {today}부터 적용됩니다.
      </div>
      <div style={{ marginTop:16, textAlign:"center" }}>
        <a href="/" style={{ fontSize:13, color:"#3B6D11", textDecoration:"none" }}>← 대시보드로 돌아가기</a>
      </div>
    </div>
  );
}
