// src/CountryPicker.js
import React from "react";

// === 国選択 UI（検索＋人気国＋全件リスト）==========================
const POPULAR_CODES = ['JP','US','CN','KR','TW','TH','VN','SG']; // 好きに並べ替え／変更可

// 国データ（英字表記で検索・表示；必要に応じて追加）
const COUNTRIES = [
  { code:'JP', name:'Japan', flag:'🇯🇵' },
  { code:'US', name:'United States', flag:'🇺🇸' },
  { code:'CN', name:'China', flag:'🇨🇳' },
  { code:'KR', name:'Korea, Republic of', flag:'🇰🇷' },
  { code:'TW', name:'Taiwan', flag:'🇹🇼' },
  { code:'HK', name:'Hong Kong', flag:'🇭🇰' },
  { code:'TH', name:'Thailand', flag:'🇹🇭' },
  { code:'VN', name:'Vietnam', flag:'🇻🇳' },
  { code:'SG', name:'Singapore', flag:'🇸🇬' },
  { code:'MY', name:'Malaysia', flag:'🇲🇾' },
  { code:'ID', name:'Indonesia', flag:'🇮🇩' },
  { code:'PH', name:'Philippines', flag:'🇵🇭' },
  { code:'IN', name:'India', flag:'🇮🇳' },
  { code:'GB', name:'United Kingdom', flag:'🇬🇧' },
  { code:'FR', name:'France', flag:'🇫🇷' },
  { code:'DE', name:'Germany', flag:'🇩🇪' },
  { code:'ES', name:'Spain', flag:'🇪🇸' },
  { code:'IT', name:'Italy', flag:'🇮🇹' },
  { code:'CA', name:'Canada', flag:'🇨🇦' },
  { code:'BR', name:'Brazil', flag:'🇧🇷' },
  { code:'AU', name:'Australia', flag:'🇦🇺' },
];

function CountryPicker({ value, onChange, placeholder='Search country…' }) {
  const [q, setQ] = React.useState('');
  const lc = q.trim().toLowerCase();

  const popular = React.useMemo(
    () => POPULAR_CODES
      .map(c => COUNTRIES.find(x => x.code === c))
      .filter(Boolean),
    []
  );

  const filtered = React.useMemo(() => {
    if (!lc) return COUNTRIES;
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(lc));
  }, [lc]);

  const item = (c, big=false) => {
    const active = value === c.name;
    return (
      <button
        key={c.code}
        type="button"
        onClick={()=>onChange(c.name)}
        aria-label={c.name}
        style={{
          display:'flex', alignItems:'center', gap:10, width:'100%',
          padding: big ? '12px 14px' : '10px 12px',
          borderRadius:12, border:'1px solid ' + (active ? '#111' : '#e5e5e5'),
          background: active ? '#111' : '#fff',
          color: active ? '#fff' : '#111',
          boxShadow: active ? '0 6px 16px rgba(0,0,0,.15)' : 'none',
          cursor:'pointer'
        }}
      >
        <span style={{ fontSize: big ? 22 : 18 }}>{c.flag}</span>
        <span style={{ fontWeight:600, fontSize: big ? 16 : 15 }}>{c.name}</span>
      </button>
    );
  };

  return (
    <div>
      {/* 検索欄 */}
      <div style={{ position:'sticky', top:0, background:'#fff', zIndex:1, paddingBottom:8 }}>
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder={placeholder}
          inputMode="search"
          autoComplete="off"
          spellCheck="false"
          style={{
            width:'100%', padding:'12px 14px', borderRadius:14,
            border:'1px solid #ddd', fontSize:16
          }}
        />
        <div style={{ fontSize:12, color:'#666', marginTop:6 }}>
          英字で検索可（例：jap，viet，thai など）。
        </div>
      </div>

      {/* 人気国（上段グリッド）※検索中は非表示 */}
      {!lc && (
        <>
          <div style={{ margin:'14px 0 6px', fontSize:13, color:'#555' }}>よく選ばれる国</div>
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(2, 1fr)',
            gap:10
          }}>
            {popular.map(c => item(c,true))}
          </div>
          <div style={{ height:8 }} />
        </>
      )}

      {/* 全件（検索結果） */}
      <div style={{ margin:'6px 0', fontSize:13, color:'#555' }}>{lc ? '検索結果' : 'すべての国'}</div>
      <div style={{ display:'grid', gap:8 }}>
        {filtered.map(c => item(c))}
        {filtered.length === 0 && (
          <div style={{ padding:'12px 6px', color:'#777' }}>一致する国が見つかりません。</div>
        )}
      </div>
    </div>
  );
}

export default CountryPicker;
