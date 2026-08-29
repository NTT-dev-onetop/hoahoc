import{initializeApp}from"https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";import{getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut}from"https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";import{getFirestore,collection,addDoc,doc,updateDoc,onSnapshot,serverTimestamp}from"https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";import{firebaseConfig}from"./firebase-config.js";import{Q}from"./quiz-bank.js";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),provider=new GoogleAuthProvider(),$=x=>document.getElementById(x),days=[0,1,3,7,14];let user,cards=[],unsub,queue=[],cur,quiz=[],qi=0,score=0,answered=false;
const K=[['pH','Dung dịch','pH = −log[H⁺]. pH<7 axit, =7 trung tính, >7 bazơ.','[H⁺] tăng → pH giảm.','Đừng nhầm pH với nồng độ của toàn bộ chất.'],['Chất điện li','Nền tảng','Chất khi tan trong nước tạo ion và dung dịch dẫn điện.','Axit, bazơ và đa số muối là chất điện li.','Điện li mạnh phân li gần như hoàn toàn.'],['Oxi hóa – khử','Đại cương','Oxi hóa là nhường electron; khử là nhận electron.','Số oxi hóa tăng → bị oxi hóa.','Chất khử nhường e; chất oxi hóa nhận e.'],['Al(OH)₃','Vô cơ','Al(OH)₃ là chất lưỡng tính, phản ứng với axit và bazơ mạnh.','Nhớ: lưỡng tính.','Với bazơ tạo aluminat trong điều kiện thích hợp.'],['NaHCO₃','Vô cơ','Natri hiđrocacbonat là muối axit; gặp axit giải phóng CO₂.','NaHCO₃ + HCl → CO₂.','Trong bài trộn, xét lượng H⁺ trước.'],['NH₄Cl','Vô cơ','NH₄Cl là muối chứa NH₄⁺; dung dịch thường có môi trường axit.','NH₄⁺ thủy phân tạo H₃O⁺.','NH₄⁺ là axit liên hợp của NH₃.'],['Este','Hữu cơ','Este có dạng RCOOR\'; thường tạo từ axit cacboxylic và ancol.','Thủy phân bazơ → muối + ancol.','Xà phòng hóa là thủy phân este trong môi trường bazơ.'],['Amin','Hữu cơ','Amin là dẫn xuất của NH₃ khi thay H bằng gốc hydrocarbon.','Amin có tính bazơ do cặp e tự do trên N.','Anilin là amin thơm, bazơ yếu hơn amin no.'],['Amino acid','Hữu cơ','Amino acid chứa đồng thời –NH₂ và –COOH.','Có tính lưỡng tính.','Peptide hình thành qua liên kết peptide.'],['CO₃²⁻','Vô cơ','Carbonate gặp H⁺ có thể giải phóng CO₂.','CO₃²⁻ + 2H⁺ → CO₂ + H₂O.','Rất hay gặp trong bài tính lượng axit.']];
const R=[['NaHCO₃ + HCl','NaHCO₃ + HCl → NaCl + CO₂↑ + H₂O','Muối bicarbonate gặp axit giải phóng CO₂.'],['CO₃²⁻ + H⁺','CO₃²⁻ + 2H⁺ → CO₂↑ + H₂O','Phương trình ion rút gọn quan trọng.'],['NH₄⁺ + OH⁻','NH₄⁺ + OH⁻ → NH₃↑ + H₂O','Phản ứng đặc trưng dùng nhận biết NH₄⁺.'],['Al(OH)₃ + HCl','Al(OH)₃ + 3HCl → AlCl₃ + 3H₂O','Al(OH)₃ phản ứng với axit.'],['Al(OH)₃ + NaOH','Al(OH)₃ + NaOH → Na[Al(OH)₄]','Ví dụ về tính lưỡng tính.'],['CH₃COOH + C₂H₅OH','CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O','Este hóa, xúc tác H₂SO₄ đặc, đun nóng.'],['Este + NaOH','RCOOR\' + NaOH → RCOONa + R\'OH','Xà phòng hóa este đơn chức.'],['Ag⁺ + Cl⁻','Ag⁺ + Cl⁻ → AgCl↓','AgCl là kết tủa trắng.']];
const F=[['Mol','n = m / M','n: mol; m: g; M: g/mol.'],['Dung dịch','C = n / V','V tính bằng L; C đơn vị mol/L.'],['Phần trăm','C% = m chất tan / m dung dịch × 100%','Khối lượng phải cùng đơn vị.'],['pH','pH = −log[H⁺]','pH và [H⁺] biến thiên ngược chiều.'],['Hiệu suất','H% = thực tế / lý thuyết × 100%','Kiểm tra lượng thực tế và lý thuyết.'],['Khí','PV = nRT','Dùng khi cần xét điều kiện khí cụ thể.'],['Trung hòa','n(H⁺) = n(OH⁻)','Sau khi quy đổi đúng hệ số phản ứng.']];
function page(id){document.querySelectorAll('.page').forEach(x=>x.classList.add('d-none'));$(id)?.classList.remove('d-none');document.querySelectorAll('.nav-link').forEach(x=>x.classList.toggle('active',x.dataset.page===id));if(id==='home')dashboard();if(id==='study')studyBuild()};document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));
$('login').onclick=async()=>{try{await signInWithPopup(auth,provider)}catch(e){ $('authErr').textContent=e.message;$('authErr').classList.remove('d-none')}};$('logout').onclick=()=>signOut(auth);
onAuthStateChanged(auth,u=>{user=u;if(u){$('auth').classList.add('d-none');$('app').classList.remove('d-none');$('user').textContent=u.displayName||u.email||'';listen()}else{$('auth').classList.remove('d-none');$('app').classList.add('d-none');if(unsub)unsub()}});
const ref=()=>collection(db,'users',user.uid,'chemistry_cards'),due=c=>!c.due||c.due<=today(),nextDate=b=>{let d=new Date();d.setDate(d.getDate()+days[Math.max(0,Math.min(4,b-1))]);return d.toISOString().slice(0,20)};
function listen(){unsub=onSnapshot(ref(),s=>{cards=s.docs.map(d=>({id:d.id,...d.data()}));dashboard();studyBuild();knowledgeRender()})}
async function add(i){let x=K[i];if(cards.some(c=>c.title===x[0]))return;await addDoc(ref(),{title:x[0],topic:x[1],meaning:x[2],example:x[3],explain:x[4],box:1,due:today(),reviews:0,correctCount:0,createdAt:serverTimestamp()})}
async function review(c,ok){let b=ok?Math.min(5,Number(c.box||1)+1):1;await updateDoc(doc(db,'users',user.uid,'chemistry_cards',c.id),{box:b,due:nextDate(b),reviews:Number(c.reviews||0)+1,correctCount:Number(c.correctCount||0)+(ok?1:0),lastReview:today(),updatedAt:serverTimestamp()});markActivity()}
function dashboard(){if(!user)return;let n=cards.length,d=cards.filter(due).length,r=cards.reduce((a,c)=>a+Number(c.reviews||0),0),ok=cards.reduce((a,c)=>a+Number(c.correctCount||0),0);$('total').textContent=n;$('due').textContent=d;$('acc').textContent=r?Math.round(ok/r*100)+'%':'0%';refreshStreak();let a=[1,2,3,4,5].map(b=>cards.filter(c=>Number(c.box||1)===b).length),m=Math.max(1,...a);$('boxes').innerHTML=a.map((x,i)=>`<div class="boxrow"><b>Box ${i+1}</b><div class="bar"><i style="width:${x/m*100}%"></i></div><b>${x}</b></div>`).join('');let w=cards.filter(c=>c.reviews).sort((a,b)=>(a.correctCount/a.reviews)-(b.correctCount/b.reviews)).slice(0,5);$('weak').innerHTML=w.length?w.map(c=>`<div class="weak"><span><b>${c.title}</b><br><small>${c.topic||''}</small></span><span class="badge text-bg-warning">${Math.round((c.correctCount||0)/(c.reviews||1)*100)}%</span></div>`).join(''):'<span class="text-secondary">Chưa có dữ liệu. Làm quiz/ôn vài lượt để hệ thống phát hiện điểm yếu.</span>'}
function studyBuild(){if(!user)return;queue=cards.filter(due).sort((a,b)=>(a.box||1)-(b.box||1));$('studyCount').textContent=queue.length+' thẻ';if(!queue.length){$('empty').classList.remove('d-none');$('studyArea').classList.add('d-none');return}$('empty').classList.add('d-none');$('studyArea').classList.remove('d-none');showCard()};function showCard(){cur=queue[0];$('card').classList.remove('flipped');$('front').textContent=cur.title||'';$('frontSub').textContent=cur.example||'';$('back').textContent=cur.meaning||'';$('backMeta').innerHTML=`<span class="tag">Box ${cur.box||1}</span> ${cur.topic||''}`;$('backExplain').textContent=cur.explain||''};$('card').onclick=()=>$('card').classList.toggle('flipped');$('speak').onclick=e=>{e.stopPropagation();speechSynthesis.speak(new SpeechSynthesisUtterance(cur?.title||''))};$('right').onclick=async()=>{if(cur){await review(cur,true);queue.shift();studyBuild()}};$('wrong').onclick=async()=>{if(cur){await review(cur,false);queue.shift();studyBuild()}};
const topics=['Tất cả',...new Set(K.map(x=>x[1]))];$('chips').innerHTML=topics.map((x,i)=>`<button class="chip ${i?'':'active'}" data-topic="${x}">${x}</button>`).join('');$('chips').onclick=e=>{let b=e.target.closest('.chip');if(!b)return;document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');knowledgeRender()};$('ks').oninput=knowledgeRender;function knowledgeRender(){let q=($('ks')?.value||'').toLowerCase(),t=document.querySelector('.chip.active')?.dataset.topic||'Tất cả';let list=K.map((x,i)=>({x,i})).filter(o=>(t==='Tất cả'||o.x[1]===t)&&(o.x.join(' ').toLowerCase().includes(q)));$('kg').innerHTML=list.map(o=>`<div class="col-md-6 col-xl-4"><div class="knowledge-card h-100"><span class="tag">${o.x[1]}</span><h5 class="mt-3">${o.x[0]}</h5><p>${o.x[2]}</p><b>⚡ ${o.x[3]}</b><p class="small text-secondary mt-2">💡 ${o.x[4]}</p><button class="btn btn-sm btn-outline-primary add" data-i="${o.i}">${cards.some(c=>c.title===o.x[0])?'✓ Đã thêm':'＋ Thêm vào SRS'}</button></div></div>`).join('');document.querySelectorAll('.add').forEach(b=>b.onclick=()=>add(+b.dataset.i))};
$('rs').oninput=renderR;function renderR(){let q=$('rs').value.toLowerCase();$('rg').innerHTML=R.filter(x=>x.join(' ').toLowerCase().includes(q)).map(x=>`<div class="col-md-6 col-xl-4"><div class="reaction-card h-100"><span class="tag">Phản ứng</span><h5 class="mt-3">${x[0]}</h5><div class="formula">${x[1]}</div><p>${x[2]}</p></div></div>`).join('')};renderR();$('fg').innerHTML=F.map(x=>`<div class="col-md-6 col-xl-4"><div class="formula-card h-100"><span class="tag">${x[0]}</span><div class="formula">${x[1]}</div><p class="text-secondary mb-0">${x[2]}</p></div></div>`).join('');

function localToday(){
  const d=new Date();
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
const today=localToday;
function storageKey(name){return `chem_${name}_${user?.uid||'guest'}`;}
function readJSON(key,fallback=[]){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
function writeJSON(key,value){localStorage.setItem(key,JSON.stringify(value))}
function markActivity(){
  if(!user)return;
  const t=today(), last=localStorage.getItem(storageKey('streak_last'));
  let streak=Number(localStorage.getItem(storageKey('streak'))||0);
  if(last===t) return;
  const y=new Date(); y.setDate(y.getDate()-1);
  const prev=`${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;
  streak=last===prev?streak+1:1;
  localStorage.setItem(storageKey('streak'),String(streak));
  localStorage.setItem(storageKey('streak_last'),t);
}
function refreshStreak(){
  const t=today(),last=localStorage.getItem(storageKey('streak_last'));
  let streak=Number(localStorage.getItem(storageKey('streak'))||0);
  if(last&&last!==t){
    const d=new Date(); d.setDate(d.getDate()-1);
    const prev=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if(last!==prev) streak=0;
  }
  $('streak').textContent=streak;
}
function getRetryIds(){return readJSON(storageKey('quiz_retry'),[])}
function saveRetryIds(ids){writeJSON(storageKey('quiz_retry',[...new Set(ids)].slice(0,1000)))}
function refreshQuizStats(){const by={};Q.forEach(x=>by[x.grade]=(by[x.grade]||0)+1);const el=$('bankStats');if(el)el.textContent=`Ngân hàng: ${Q.length.toLocaleString('vi-VN')} câu · ${Object.entries(by).map(([g,n])=>g+': '+n).join(' · ')}`;}
function startQuiz(mode='smart'){
  const retryIds=getRetryIds();
  let retryPool=Q.filter(x=>retryIds.includes(x.id));
  let fresh=Q.filter(x=>!retryIds.includes(x.id));
  fresh.sort(()=>Math.random()-.5);
  retryPool.sort(()=>Math.random()-.5);
  if(mode==='retry') quiz=retryPool.length?retryPool.slice(0,20):[...Q].sort(()=>Math.random()-.5).slice(0,20);
  else { const grades=['9','10','11','12']; const balanced=[]; for(const g of grades){balanced.push(...fresh.filter(x=>x.grade===g).sort(()=>Math.random()-.5).slice(0,5));} quiz=[...retryPool,...balanced,...fresh].slice(0,20); }
  qi=0;score=0;answered=false;quizWrong=[];
  $('qstart').classList.add('d-none');$('qbox').classList.remove('d-none');$('quizResult').classList.add('d-none');quizRender();
}
let quizWrong=[];
function quizRender(){
  answered=false;
  const x=quiz[qi];
  $('qp').textContent=`${qi+1}/${quiz.length}`;
  $('qtag').textContent=x.tag;
  $('qprompt').textContent=x.prompt;
  $('qformula').textContent=x.formula;
  $('question').textContent='Tính chất / nhận định nào đúng nhất?';
  $('options').innerHTML=x.options.map((o,i)=>`<div class="col-md-6"><button class="option" data-i="${i}"><span class="option-letter">${String.fromCharCode(65+i)}</span>${o}</button></div>`).join('');
  $('feedback').className='alert mt-3 d-none';
  $('next').classList.add('d-none');
  document.querySelectorAll('.option').forEach(b=>b.onclick=()=>answer(+b.dataset.i));
}
function answer(i){
  if(answered)return;
  answered=true;
  const x=quiz[qi],ok=i===x.answer;
  document.querySelectorAll('.option').forEach((b,j)=>{
    if(j===x.answer)b.classList.add('correct');
    if(j===i&&i!==x.answer)b.classList.add('wrongopt');
  });
  if(ok) score++; else quizWrong.push(x.id);
  $('feedback').className=`alert mt-3 ${ok?'alert-success':'alert-danger'}`;
  $('feedback').innerHTML=`<b>${ok?'✓ Chính xác!':'✗ Chưa đúng — sẽ được đưa vào hàng luyện lại.'}</b><br>${x.explain}`;
  $('next').textContent=qi===quiz.length-1?'Xem kết quả':'Câu tiếp theo →';
  $('next').classList.remove('d-none');
  markActivity();refreshStreak();
}
function finishQuiz(){
  const retry=new Set(getRetryIds());
  quizWrong.forEach(id=>retry.add(id));
  quiz.filter(x=>!quizWrong.includes(x.id)).forEach(x=>retry.delete(x.id));
  saveRetryIds([...retry]);
  $('qbox').classList.add('d-none');$('qstart').classList.add('d-none');
  $('quizResult').classList.remove('d-none');
  $('resultScore').textContent=`${score}/${quiz.length}`;
  $('resultTitle').textContent=score===quiz.length?'🔥 Perfect!':score>=8?'Rất tốt!':'Cứ luyện tiếp — sai đâu vá đó.';
  $('resultDetail').textContent=quizWrong.length
    ? `${quizWrong.length} câu sai đã được ghim vào hàng “Luyện lại câu sai”. Lần sau hệ thống ưu tiên chúng trước.`
    : 'Không có câu sai. Hàng luyện lại đang sạch — giữ streak để duy trì phản xạ!';
  $('retryCount').textContent=getRetryIds().length;
  refreshStreak();
}
$('start').onclick=()=>startQuiz('smart');
$('retryQuiz').onclick=()=>startQuiz('retry');
$('next').onclick=()=>{if(!answered)return;if(qi<quiz.length-1){qi++;quizRender()}else finishQuiz()};
knowledgeRender();dashboard();refreshQuizStats();