"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";

interface Props { user: User; onClose: () => void; }

export default function AccountModal({ user, onClose }: Props) {
  const [tab, setTab] = useState<"profile"|"password"|"family"|"danger">("profile");
  const [name, setName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{text:string;ok:boolean}|null>(null);

  useEffect(()=>{
    supabase.from("profiles").select("name,family_code").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) { setName(data.name||""); setFamilyCode(data.family_code||""); }
      });
  },[user.id]);

  const showMsg = (text:string, ok:boolean) => {
    setMsg({text,ok});
    setTimeout(()=>setMsg(null), 3000);
  };

  const saveProfile = async () => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ name }).eq("id", user.id);
    if (!error) showMsg("이름이 저장되었습니다.", true);
    else showMsg("저장 실패: "+error.message, false);
    setLoading(false);
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { showMsg("비밀번호가 일치하지 않습니다.", false); return; }
    if (newPassword.length < 6) { showMsg("6자 이상 입력해주세요.", false); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) { showMsg("비밀번호가 변경되었습니다.", true); setNewPassword(""); setConfirmPassword(""); }
    else showMsg("변경 실패: "+error.message, false);
    setLoading(false);
  };

  const joinFamily = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    const { data } = await supabase.from("profiles").select("id").eq("family_code", joinCode.trim()).single();
    if (data) {
      const { error } = await supabase.from("profiles").update({ family_code: joinCode.trim() }).eq("id", user.id);
      if (!error) { setFamilyCode(joinCode.trim()); showMsg("가족 그룹에 참여했습니다!", true); setJoinCode(""); }
      else showMsg("참여 실패: "+error.message, false);
    } else showMsg("유효하지 않은 가족 코드입니다.", false);
    setLoading(false);
  };

  const deleteAccount = async () => {
    if (!confirm("정말로 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")) return;
    if (!confirm("이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?")) return;
    setLoading(true);
    await supabase.from("items").delete().eq("user_id", user.id);
    await supabase.from("profiles").delete().eq("id", user.id);
    await supabase.auth.signOut();
    onClose();
  };

  const TABS = [
    { id:"profile", label:"👤 프로필" },
    { id:"password", label:"🔑 비밀번호" },
    { id:"family", label:"👨‍👩‍👧 가족 공유" },
    { id:"danger", label:"⚠️ 계정 삭제" },
  ] as const;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:10000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:12, padding:24, maxWidth:460, width:"100%", maxHeight:"85vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
        <h2 style={{ fontSize:18, fontWeight:600, marginBottom:16 }}>⚙️ 계정 관리</h2>

        {/* 탭 */}
        <div style={{ display:"flex", gap:4, marginBottom:20, overflowX:"auto" }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:"6px 12px", borderRadius:8, cursor:"pointer", whiteSpace:"nowrap",
              border:"1px solid "+(tab===t.id?"#3B6D11":"#ddd"),
              background:tab===t.id?"#EAF3DE":"#fff",
              color:tab===t.id?"#3B6D11":"#666", fontSize:12, fontWeight:tab===t.id?600:400,
            }}>{t.label}</button>
          ))}
        </div>

        {/* 메시지 */}
        {msg && (
          <div style={{ padding:"8px 12px", borderRadius:8, fontSize:12, marginBottom:12,
            background:msg.ok?"#EAF3DE":"#FCEBEB", color:msg.ok?"#3B6D11":"#A32D2D" }}>
            {msg.text}
          </div>
        )}

        {/* 프로필 */}
        {tab==="profile" && (
          <div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, color:"#666", display:"block", marginBottom:4 }}>이메일 (변경 불가)</label>
              <input value={user.email||""} disabled style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #eee", fontSize:13, background:"#f8f8f8", boxSizing:"border-box" }}/>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:"#666", display:"block", marginBottom:4 }}>이름</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="이름 입력"
                style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #ccc", fontSize:13, boxSizing:"border-box" }}/>
            </div>
            <button onClick={saveProfile} disabled={loading} style={{ width:"100%", padding:"10px", borderRadius:8, border:"none", background:"#3B6D11", color:"#fff", cursor:"pointer", fontSize:14, fontWeight:600 }}>
              {loading?"저장 중...":"저장"}
            </button>
          </div>
        )}

        {/* 비밀번호 */}
        {tab==="password" && (
          <div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, color:"#666", display:"block", marginBottom:4 }}>새 비밀번호</label>
              <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="6자 이상"
                style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #ccc", fontSize:13, boxSizing:"border-box" }}/>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:"#666", display:"block", marginBottom:4 }}>비밀번호 확인</label>
              <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="동일하게 입력"
                style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1px solid #ccc", fontSize:13, boxSizing:"border-box" }}/>
            </div>
            <button onClick={changePassword} disabled={loading} style={{ width:"100%", padding:"10px", borderRadius:8, border:"none", background:"#3B6D11", color:"#fff", cursor:"pointer", fontSize:14, fontWeight:600 }}>
              {loading?"변경 중...":"비밀번호 변경"}
            </button>
          </div>
        )}

        {/* 가족 공유 */}
        {tab==="family" && (
          <div>
            <div style={{ padding:12, background:"#f8f8f8", borderRadius:8, marginBottom:16 }}>
              <div style={{ fontSize:12, color:"#666", marginBottom:6 }}>내 가족 코드</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:20, fontWeight:700, letterSpacing:4 }}>{familyCode||"없음"}</span>
                {familyCode && (
                  <button onClick={()=>{ navigator.clipboard.writeText(familyCode); showMsg("복사됐습니다!", true); }}
                    style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:"1px solid #ddd", background:"#fff", cursor:"pointer" }}>
                    복사
                  </button>
                )}
              </div>
              <div style={{ fontSize:11, color:"#888", marginTop:6 }}>이 코드를 가족에게 공유하면 함께 이력을 볼 수 있습니다.</div>
            </div>
            <div style={{ marginBottom:8 }}>
              <label style={{ fontSize:12, color:"#666", display:"block", marginBottom:4 }}>가족 코드로 참여</label>
              <div style={{ display:"flex", gap:8 }}>
                <input value={joinCode} onChange={e=>setJoinCode(e.target.value)} placeholder="가족 코드 입력"
                  style={{ flex:1, padding:"8px 10px", borderRadius:8, border:"1px solid #ccc", fontSize:13 }}/>
                <button onClick={joinFamily} disabled={loading} style={{ padding:"8px 14px", borderRadius:8, border:"none", background:"#3B6D11", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>
                  참여
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 계정 삭제 */}
        {tab==="danger" && (
          <div>
            <div style={{ padding:12, background:"#FFF5F5", borderRadius:8, border:"1px solid #fcc", marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#A32D2D", marginBottom:6 }}>⚠️ 주의사항</div>
              <ul style={{ fontSize:12, color:"#666", margin:0, paddingLeft:16, lineHeight:1.8 }}>
                <li>모든 구매 이력이 영구 삭제됩니다</li>
                <li>클라우드에 저장된 데이터가 모두 삭제됩니다</li>
                <li>이 작업은 되돌릴 수 없습니다</li>
              </ul>
            </div>
            <button onClick={deleteAccount} disabled={loading} style={{ width:"100%", padding:"10px", borderRadius:8, border:"none", background:"#A32D2D", color:"#fff", cursor:"pointer", fontSize:14, fontWeight:600 }}>
              {loading?"처리 중...":"회원 탈퇴"}
            </button>
          </div>
        )}

        <button onClick={onClose} style={{ width:"100%", padding:"8px", borderRadius:8, border:"1px solid #ddd", background:"#fff", cursor:"pointer", fontSize:13, marginTop:12 }}>닫기</button>
      </div>
    </div>
  );
}
