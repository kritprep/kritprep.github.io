import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, getRedirectResult, onAuthStateChanged, updateProfile, signOut, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js';
import { firebaseConfig, ADMIN_UID } from './firebase-config.js';
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const storageKey = uid => `kritprep-v1-${uid}`;
const blankState = () => ({tasks:[],chapters:[],completed:0,bestScore:null,focusSessions:0,quizDone:0});
let state = blankState(), auth=null, db=null, stopUpdates=null, currentUser=null, authReady=Promise.resolve(), authMode='login', selectedClass='10', timerInterval=null, timerRemaining=10800, pomoInterval=null, pomoRemaining=1500, pomoDuration=25, quizIndex=0, quizScore=0, quizAnswered=false;
function loadState(uid){try{return {...blankState(),...JSON.parse(localStorage.getItem(storageKey(uid))||'{}')}}catch{return blankState()}}
function saveState(){if(!currentUser)return;localStorage.setItem(storageKey(currentUser.uid),JSON.stringify(state));renderAll()}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2500)}
function dateLabel(){return new Intl.DateTimeFormat('en-IN',{weekday:'long',day:'numeric',month:'long'}).format(new Date())}
$('#todayDate').textContent=dateLabel();$('#taskDateLabel').textContent=dateLabel()+' · Make it count.';
if(location.hash==='#updates') go('updates');
const pageNames={home:'Overview',library:'Study library',practice:'Exam practice',planner:'My planner',progress:'My progress',updates:'Updates'};
function go(page){$$('.page').forEach(p=>p.classList.toggle('active',p.id==='page-'+page));$$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===page));$('#pageCrumb').textContent=pageNames[page]||'Overview';$('#sidebar').classList.remove('open');if(page==='progress')renderProgress();window.scrollTo({top:0,behavior:'smooth'})}
document.addEventListener('click',e=>{const target=e.target.closest('[data-page]');if(target)go(target.dataset.page)});
$$('.nav-link').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
$('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
document.addEventListener('click',e=>{if(window.innerWidth<=700&&!e.target.closest('#sidebar')&&!e.target.closest('#menuBtn'))$('#sidebar').classList.remove('open')});
$('#themeBtn').addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('kritprep-theme',document.body.classList.contains('dark')?'dark':'light')});if(localStorage.getItem('kritprep-theme')==='dark')document.body.classList.add('dark');

// Firebase is optional until the owner adds their own project credentials.
const configured = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PASTE_') && firebaseConfig.projectId && !firebaseConfig.projectId.startsWith('PASTE_');
if(configured){
  try{
    const app=initializeApp(firebaseConfig);
    auth=getAuth(app);
    db=getFirestore(app);
    // Keep students signed in across browser restarts on this device.
    authReady=setPersistence(auth,browserLocalPersistence).catch(err=>{console.error('Auth persistence:',err);$('#authConfigNote').textContent='Could not enable saved login. Check browser settings.'});
    onAuthStateChanged(auth,user=>{
      currentUser=user;
      if(user){state=loadState(user.uid);renderAll();updateProfileUI();$('#authClose').style.display='';closeAuth();startUpdates();$('#adminPanel').classList.toggle('hidden', !ADMIN_UID || ADMIN_UID.startsWith('PASTE_') || user.uid!==ADMIN_UID);}
      else{if(stopUpdates){stopUpdates();stopUpdates=null;}state=blankState();renderAll();updateProfileUI();$('#authClose').style.display='none';$('#adminPanel').classList.add('hidden');$('#updatesFeed').innerHTML='<div class="empty-state">Please sign in to view student announcements. New uploads and important changes will appear here.</div>';openAuth(true);}
      document.body.classList.remove('auth-pending');
    });
    getRedirectResult(auth).catch(err=>{if(err)$('#authMessage').textContent=errorMessage(err)});
  }catch(err){console.error('Firebase setup:',err);$('#authConfigNote').textContent='Firebase setup needs attention. Check firebase-config.js.';document.body.classList.remove('auth-pending');openAuth(true)}
}else{
  $('#authConfigNote').textContent='Firebase setup is missing. Add your Firebase web config to activate real accounts.';
  document.body.classList.remove('auth-pending');openAuth(true);
}
function updateProfileUI(){if(currentUser){const name=currentUser.displayName||currentUser.email.split('@')[0];$('#profileName').textContent=name;$('#profileSub').textContent='Your progress is saved on this device';$('#avatar').textContent=name.charAt(0).toUpperCase();$('#authOpen').title='Account: '+currentUser.email}else{$('#profileName').textContent='Guest learner';$('#profileSub').textContent='Sign in to sync your account';$('#avatar').textContent='G'}}
function openAuth(force=false){if(currentUser&&!force){if(confirm('Log out of KritPrep?'))signOut(auth).then(()=>toast('You have been logged out.')).catch(e=>toast(errorMessage(e)));return}$('#authModal').classList.add('show');$('#authModal').setAttribute('aria-hidden','false');$('#authClose').style.display=currentUser?'':'none';if(!currentUser)setTimeout(()=>$('#authEmail').focus(),0)}
function closeAuth(){if(!currentUser)return;$('#authModal').classList.remove('show');$('#authModal').setAttribute('aria-hidden','true');$('#authMessage').textContent=''}
$('#authOpen').addEventListener('click',openAuth);$('#authClose').addEventListener('click',closeAuth);$('#authModal').addEventListener('click',e=>{if(e.target.id==='authModal')closeAuth()});
function setAuthMode(mode){authMode=mode;$$('[data-auth-tab]').forEach(b=>b.classList.toggle('selected',b.dataset.authTab===mode));$('#nameField').classList.toggle('hidden',mode!=='signup');$('#authTitle').textContent=mode==='login'?'Welcome back.':'Create your account.';$('#authSubtitle').textContent=mode==='login'?'Sign in to keep your study journey in sync.':'Your next chapter starts with a free account.';$('#authSubmit').textContent=mode==='login'?'Log in':'Create account';$('#authPassword').autocomplete=mode==='login'?'current-password':'new-password';$('#authMessage').textContent=''}
$$('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>setAuthMode(b.dataset.authTab)));
function errorMessage(e){const code=e?.code||'';return ({'auth/invalid-email':'Please enter a valid email address.','auth/user-not-found':'No account found. Create an account first.','auth/wrong-password':'That password does not look right. Try again.','auth/invalid-credential':'Email or password is incorrect.','auth/email-already-in-use':'This email already has an account. Try logging in.','auth/weak-password':'Use a password with at least 6 characters.','auth/popup-closed-by-user':'Google sign-in was closed before finishing.','auth/unauthorized-domain':'Add this website domain to Firebase authorized domains.','auth/popup-blocked':'Your browser blocked the Google sign-in window. Allow pop-ups and try again.'})[code]||e?.message||'Something went wrong. Please try again.'}
$('#authForm').addEventListener('submit',async e=>{e.preventDefault();if(!auth){$('#authMessage').textContent='Firebase is not initialized. Check the Firebase setup.';return}const email=$('#authEmail').value.trim(),password=$('#authPassword').value,name=$('#authName').value.trim();$('#authSubmit').disabled=true;$('#authSubmit').textContent='Please wait…';try{await authReady;if(authMode==='signup'){const cred=await createUserWithEmailAndPassword(auth,email,password);if(name)await updateProfile(cred.user,{displayName:name});toast('Welcome to KritPrep!')}else{await signInWithEmailAndPassword(auth,email,password);toast('Welcome back!')}}catch(err){$('#authMessage').textContent=errorMessage(err)}finally{$('#authSubmit').disabled=false;$('#authSubmit').textContent=authMode==='login'?'Log in':'Create account'}});
$('#googleBtn').addEventListener('click',async()=>{if(!auth){$('#authMessage').textContent='Firebase is not initialized. Check the Firebase setup.';return}try{await authReady;const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,provider)}catch(e){$('#authMessage').textContent=errorMessage(e)}});

function startUpdates(){
  if(!db || !currentUser) return;
  if(stopUpdates) stopUpdates();
  const q=query(collection(db,'announcements'),orderBy('createdAt','desc'),limit(30));
  stopUpdates=onSnapshot(q,snap=>{
    const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
    $('#updatesFeed').innerHTML=rows.length?rows.map(x=>`<article class="announcement-card"><div class="announcement-meta"><span>${escapeHtml(x.category||'KritPrep update')}</span><time>${x.createdAt?.toDate?x.createdAt.toDate().toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'Just published'}</time></div><h4>${escapeHtml(x.title||'KritPrep update')}</h4><p>${escapeHtml(x.body||'')}</p></article>`).join(''):'<div class="empty-state">No announcements yet. Check back soon — new resources and updates will appear here. ✨</div>';
  },err=>{$('#updatesFeed').innerHTML='<div class="empty-state">Updates could not be loaded. Check the Firestore setup and security rules.</div>';console.error('Updates feed:',err)});
}
$('#announcementForm').addEventListener('submit',async e=>{
  e.preventDefault(); const msg=$('#announcementMessage');
  if(!db||!currentUser||!ADMIN_UID||ADMIN_UID.startsWith('PASTE_')||currentUser.uid!==ADMIN_UID){msg.textContent='Admin access is not configured for this account.';return;}
  const btn=$('#publishAnnouncement');btn.disabled=true;btn.textContent='Publishing…';msg.textContent='';
  try{await addDoc(collection(db,'announcements'),{title:$('#announcementTitle').value.trim(),body:$('#announcementBody').value.trim(),category:$('#announcementCategory').value,createdAt:serverTimestamp(),createdBy:currentUser.uid});$('#announcementForm').reset();msg.textContent='Update published. Signed-in students can now see it.';toast('KritPrep update published!');}
  catch(err){msg.textContent='Could not publish. Check Firestore rules and admin UID.';console.error(err)}finally{btn.disabled=false;btn.textContent='Publish update';}
});

const subjects=['Mathematics','Science','Social Science','English'];
// Resource content is intentionally empty. The KritPrep admin will publish chapters and files.
const resourceData={10:[]};
function renderResources(){const query=$('#resourceSearch').value.toLowerCase(),subject=$('#subjectFilter').value;const list=resourceData[selectedClass].filter(r=>(subject==='all'||r[0]===subject||r[0]==='All subjects')&&r.slice(0,4).join(' ').toLowerCase().includes(query));$('#resourceHeading').textContent=`Class ${selectedClass} resources` ;$('#resourceCount').textContent=`${list.length} RESOURCES`;const photos={'Mathematics':'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=160&h=160&fit=crop','Science':'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=160&h=160&fit=crop','Social Science':'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=160&h=160&fit=crop','English':'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=160&h=160&fit=crop','All subjects':'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=160&h=160&fit=crop'};$('#resourceGrid').innerHTML=list.length?list.map(r=>`<article class="resource-card"><div class="resource-thumb" style="background:${r[4]}"><img src="${photos[r[0]]||photos['All subjects']}" alt="${r[0]} study" loading="lazy" onerror="this.style.display='none'"><span>${r[3]}</span></div><div><h4>${r[1]}</h4><p>${r[2]}</p><div class="resource-meta">${r[0]} · Class ${selectedClass}</div><button data-resource-url="${r[5]}">Open resource ↗</button></div></article>`).join(''):'<div class="empty-state">No resources have been published yet. The KritPrep admin will add chapters and study materials here. ✨</div>'}
$('#resourceSearch').addEventListener('input',renderResources);$('#subjectFilter').addEventListener('change',renderResources);$('#resourceGrid').addEventListener('click',e=>{const b=e.target.closest('[data-resource-url]');if(b)window.open(b.dataset.resourceUrl,'_blank','noopener,noreferrer')});renderResources();

// Board-style countdown timer.
function formatTime(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return [h,m,sec].map(n=>String(n).padStart(2,'0')).join(':')}
function updateTimer(){ $('#timerDisplay').textContent=formatTime(timerRemaining); }
$('#timerDuration').addEventListener('change',()=>{pauseTimer();timerRemaining=Number($('#timerDuration').value)*60;updateTimer();$('#timerHint').textContent='Duration updated. Start when your paper is ready.'});
function pauseTimer(){if(timerInterval)clearInterval(timerInterval);timerInterval=null;$('#timerStart').textContent='Resume timer'}
$('#timerStart').addEventListener('click',()=>{if(timerInterval){pauseTimer();$('#timerHint').textContent='Timer paused. Take a breath, then resume.';return}if(timerRemaining<=0)timerRemaining=Number($('#timerDuration').value)*60;$('#timerStart').textContent='Pause timer';$('#timerHint').textContent='Stay with the question in front of you.';timerInterval=setInterval(()=>{timerRemaining--;updateTimer();if(timerRemaining<=0){pauseTimer();$('#timerStart').textContent='Start again';$('#timerHint').textContent='Time is up. Review your answers and learn from the attempt.';toast('Your exam practice time is up!')}},1000)});
$('#timerReset').addEventListener('click',()=>{pauseTimer();timerRemaining=Number($('#timerDuration').value)*60;updateTimer();$('#timerStart').textContent='Start timer';$('#timerHint').textContent='Timer reset. You are ready when you are.'});updateTimer();

const questions=[{q:'Which of the following is an irrational number?',a:['0.25','√2','3/4','0.5'],c:1,why:'√2 cannot be expressed as a ratio of two integers.'},{q:'Which gas is released during photosynthesis?',a:['Carbon dioxide','Nitrogen','Oxygen','Hydrogen'],c:2,why:'Plants release oxygen as a by-product of photosynthesis.'},{q:'The Preamble to the Indian Constitution begins with which words?',a:['India is a Republic','We, the people of India','The Parliament of India','Justice for all'],c:1,why:'The Preamble begins with “We, the people of India”.'},{q:'Choose the correctly spelled word.',a:['Enviroment','Environmant','Environment','Envirnoment'],c:2,why:'Environment is the correct spelling.'},{q:'If 2x + 6 = 14, what is x?',a:['2','3','4','5'],c:2,why:'2x = 8, so x = 4.'}];
function showQuestion(){const q=questions[quizIndex];$('#quizArea').innerHTML=`<div class="quiz-question"><small>QUESTION ${quizIndex+1} OF ${questions.length} · SCORE ${quizScore}</small><h4>${q.q}</h4><div>${q.a.map((a,i)=>`<button class="answer-option" data-answer="${i}">${String.fromCharCode(65+i)}. ${a}</button>`).join('')}</div><p id="quizFeedback" aria-live="polite">Choose the best answer.</p><button class="btn btn-primary" id="quizNext" disabled>${quizIndex===questions.length-1?'See my result':'Next question →'}</button></div>`;$('#quizArea').querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>answerQuestion(Number(b.dataset.answer))))}
function answerQuestion(n){if(quizAnswered)return;quizAnswered=true;const q=questions[quizIndex],correct=n===q.c;if(correct)quizScore++;$('#quizArea').querySelectorAll('[data-answer]').forEach((b,i)=>{b.disabled=true;if(i===q.c)b.classList.add('correct');else if(i===n)b.classList.add('wrong')});$('#quizFeedback').textContent=(correct?'Correct! ':'Not quite. ')+q.why;$('#quizNext').disabled=false;$('#quizNext').addEventListener('click',nextQuestion)}
function nextQuestion(){quizIndex++;quizAnswered=false;if(quizIndex<questions.length){showQuestion();return}state.quizDone++;state.bestScore=Math.max(state.bestScore||0,Math.round(quizScore/questions.length*100));saveState();$('#quizArea').innerHTML=`<div class="quiz-start-art">${quizScore>=4?'🏆':'✦'}</div><h4>You scored ${quizScore} out of ${questions.length}!</h4><p>${quizScore>=4?'Brilliant work. Keep that momentum going.':'Good effort. Every attempt helps you grow.'} Your best score is ${state.bestScore}%.</p><button class="btn btn-primary" id="quizAgain">Try again</button>`;$('#quizAgain').addEventListener('click',startQuiz)}
function startQuiz(){quizIndex=0;quizScore=0;quizAnswered=false;showQuestion()}
$('#quizStart').addEventListener('click',startQuiz);

// Planner and task list.
$('#taskForm').addEventListener('submit',e=>{e.preventDefault();const title=$('#taskInput').value.trim();if(!title)return;state.tasks.unshift({id:Date.now(),title,category:$('#taskCategory').value,done:false});$('#taskInput').value='';saveState();toast('Task added. One step closer!')});
$('#taskList').addEventListener('change',e=>{const id=Number(e.target.dataset.taskDone);if(!id)return;const task=state.tasks.find(t=>t.id===id);if(task&&!task.done){task.done=true;state.completed++;saveState();toast('Nice work. Keep going!')}});
$('#taskList').addEventListener('click',e=>{const id=Number(e.target.dataset.taskDelete);if(!id)return;state.tasks=state.tasks.filter(t=>t.id!==id);saveState();toast('Task removed.')});
function renderTasks(){const done=state.tasks.filter(t=>t.done).length,total=state.tasks.length,pct=total?Math.round(done/total*100):0;$('#taskCount').textContent=`${total} task${total===1?'':'s'}`;$('#taskProgressText').textContent=pct+'%';$('#taskProgressBar').style.width=pct+'%';$('#taskList').innerHTML=total?state.tasks.map(t=>`<div class="task-item ${t.done?'done':''}"><input type="checkbox" data-task-done="${t.id}" ${t.done?'checked':''} aria-label="Complete ${escapeHtml(t.title)}"><div class="task-copy"><b>${escapeHtml(t.title)}</b><small>${escapeHtml(t.category)}</small></div><button class="delete-task" data-task-delete="${t.id}" aria-label="Delete task">×</button></div>`).join(''):'<div class="empty-state">Your checklist is waiting for its first win. ✨</div>';
const home=state.tasks.filter(t=>!t.done).slice(0,3);$('#homeTasks').innerHTML=home.length?home.map(t=>`<div class="task-item"><span>○</span><div class="task-copy"><b>${escapeHtml(t.title)}</b><small>${escapeHtml(t.category)}</small></div></div>`).join(''):'<div class="empty-icon">✎</div><b>Your plan starts here</b><p>Add a task to turn “someday” into “done”.</p><button class="btn btn-primary btn-small" data-page="planner">Create a task</button>'}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

// Pomodoro timer.
function updatePomo(){const m=Math.floor(pomoRemaining/60),s=pomoRemaining%60;$('#pomoDisplay').textContent=`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;const deg=(1-pomoRemaining/(pomoDuration*60))*360;$('.pomodoro-ring').style.background=`conic-gradient(#6679ed ${deg}deg,#e9ecf6 ${deg}deg)`}
function stopPomo(){if(pomoInterval)clearInterval(pomoInterval);pomoInterval=null;$('#pomoStart').textContent='Resume focus'}
$('#pomoStart').addEventListener('click',()=>{if(pomoInterval){stopPomo();return}$('#pomoStart').textContent='Pause';pomoInterval=setInterval(()=>{pomoRemaining--;updatePomo();if(pomoRemaining<=0){stopPomo();$('#pomoStart').textContent='Start focus';if(pomoDuration!==5){state.focusSessions++;saveState()}toast(pomoDuration===5?'Break complete. Ready for another round?':'Focus session complete. Well done!');$('#pomoMode').textContent=pomoDuration===5?'BREAK COMPLETE':'SESSION COMPLETE'}},1000)});
$('#pomoReset').addEventListener('click',()=>{stopPomo();pomoRemaining=pomoDuration*60;$('#pomoStart').textContent='Start focus';$('#pomoMode').textContent=pomoDuration===5?'BREAK TIME':'FOCUS TIME';updatePomo()});$$('[data-pomo]').forEach(b=>b.addEventListener('click',()=>{stopPomo();pomoDuration=Number(b.dataset.pomo);pomoRemaining=pomoDuration*60;$$('[data-pomo]').forEach(x=>x.classList.toggle('selected',x===b));$('#pomoStart').textContent='Start focus';$('#pomoMode').textContent=pomoDuration===5?'BREAK TIME':'FOCUS TIME';updatePomo()}));updatePomo();

const chapters=[]; // Chapter records will be supplied by the admin panel in a later phase.
function renderProgress(){const completed=state.tasks.filter(t=>t.done).length;$('#statCompleted').textContent=completed;$('#statChapters').textContent=state.chapters.length;$('#statScore').textContent=state.bestScore===null?'—':state.bestScore+'%';$('#statFocus').textContent=state.focusSessions;$('#chapterList').innerHTML='<div class="empty-state">No chapters have been published yet. Check back when the KritPrep admin adds your class resources. ✨</div>'}
$('#chapterList').addEventListener('change',e=>{const i=Number(e.target.dataset.chapter);if(!Number.isFinite(i))return;if(e.target.checked&&!state.chapters.includes(i))state.chapters.push(i);else state.chapters=state.chapters.filter(x=>x!==i);saveState()});
function renderAll(){renderTasks();renderProgress()};renderAll();updateProfileUI();
