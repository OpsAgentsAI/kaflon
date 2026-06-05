// app.js — Firebase auth, kids management, subject management, kaflon agent
// Loaded after the inline <script> in index.html; overrides functions as needed.

// ---- Global state ----
let currentUser = null;
let kids = [];
let allSubjects = [];
let activeKidId_fs = null;
let activeSubjectId = null;
let addKidSelectedSubjectIds = [];
let newKidGender_fs = 'f';
let managingSubjectsForKid = null;
let managingSubjectsContext = null; // 'kid' | 'add-kid'

// ---- Override renderProfileGrid to use Firestore kids ----
function renderProfileGrid() {
  const grid = document.getElementById('profile-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!currentUser) return;
  if (kids.length === 0) {
    grid.innerHTML = `<p class="text-center text-slate-400 py-4">${lang === 'he' ? 'אין ילדים עדיין' : 'No kids yet'}</p>`;
    return;
  }

  kids.forEach(kid => {
    const wrapper = document.createElement('div');
    wrapper.className = 'relative';

    const btn = document.createElement('button');
    const emoji = kid.gender === 'f' ? '👧' : '👦';
    btn.className = 'w-full py-5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-black text-2xl shadow-md active:scale-95 hover:shadow-lg transition';
    btn.textContent = `${emoji} ${kid.name}`;
    btn.addEventListener('click', () => {
      activeProfileId = kid.id;
      onKidSelected(kid);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'absolute top-2 end-2 z-10 text-white/50 hover:text-white text-base leading-none px-2 py-1';
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', e => { e.stopPropagation(); confirmDeleteKid(kid); });

    wrapper.appendChild(btn);
    wrapper.appendChild(delBtn);
    grid.appendChild(wrapper);
  });
}

// ---- Override renderProfileChip to use kid name ----
function renderProfileChip() {
  const chip = document.getElementById('profile-chip');
  if (!chip) return;
  const kid = kids.find(k => k.id === activeProfileId);
  if (!kid) return;
  const arrow = lang === 'he' ? '‹' : '›';
  chip.textContent = `${kid.name} ${arrow}`;
}

// ---- Override routeProfile — show kids screen ----
function routeProfile() {
  const chip = document.getElementById('profile-chip');
  if (!activeProfileId) {
    if (chip) chip.classList.add('hidden');
    showScreen('profile-picker');
    return;
  }
  if (chip) chip.classList.remove('hidden');
  renderProfileChip();
  showScreen('profile-picker');
}

// ---- Kid selection flow ----
async function onKidSelected(kid) {
  activeKidId_fs = kid.id;
  activeProfileId = kid.id;

  const chip = document.getElementById('profile-chip');
  if (chip) { chip.classList.remove('hidden'); renderProfileChip(); }

  const kidSubjects = getKidSubjects(kid);

  if (kidSubjects.length === 0) {
    managingSubjectsForKid = kid;
    managingSubjectsContext = 'kid';
    await ensureAllSubjects();
    renderSubjectsManageScreen(kid);
    showScreen('subjects-manage-screen');
  } else if (kidSubjects.length === 1) {
    activeSubjectId = kidSubjects[0].id;
    routeBySubject(kidSubjects[0]);
  } else {
    renderSubjectPickerForDrill(kid, kidSubjects);
    showScreen('subject-picker-screen');
  }
}

function getKidSubjects(kid) {
  if (!kid || !kid.subjectIds) return [];
  return kid.subjectIds.map(id => allSubjects.find(s => s.id === id)).filter(Boolean);
}

// ---- Drill routing by subject ----
function routeBySubject(subject) {
  if (!subject) { showScreen('subject-picker-screen'); return; }
  const dt = subject.drillType;
  track('drill_start', { drill_type: dt, subject_id: subject.id });
  if (dt === 'decimals') {
    showScreen('decimals-menu');
  } else if (dt === 'geometry') {
    showScreen('geometry-menu');
  } else if (dt === 'fractions' || dt === 'libi-addsub' || dt === 'libi-compare' || dt === 'libi-multdiv' || dt === 'libi-fracpure') {
    if (typeof renderLibiMenu === 'function') renderLibiMenu();
    showScreen('libi-menu');
  } else if (dt === 'custom') {
    startCustomDrill(subject);
  } else {
    // multiply, divide, mixed, squares, doubles, halves → settings screen
    if (typeof loadBestForActive === 'function') loadBestForActive();
    if (['multiply', 'divide', 'mixed', 'squares', 'doubles', 'halves'].includes(dt) && typeof state !== 'undefined') {
      state.mode = dt;
      if (typeof applyMode === 'function') applyMode();
    }
    showScreen('settings');
  }
}

// ---- Subject picker for drill ----
function renderSubjectPickerForDrill(kid, kidSubjects) {
  const list = document.getElementById('kid-subject-list');
  if (!list) return;
  list.innerHTML = '';
  kidSubjects.forEach(s => {
    const name = lang === 'he' ? (s.nameHe || s.nameEn) : (s.nameEn || s.nameHe);
    const btn = document.createElement('button');
    btn.className = 'w-full py-4 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl flex items-center justify-between text-base font-bold active:scale-95 hover:shadow-lg transition';
    btn.innerHTML = `<span>${name}</span><span class="math">▸</span>`;
    btn.addEventListener('click', () => {
      activeSubjectId = s.id;
      routeBySubject(s);
    });
    list.appendChild(btn);
  });
}

// ---- Subjects manage screen ----
async function renderSubjectsManageScreen(kid) {
  await ensureAllSubjects();
  const searchInput = document.getElementById('subject-search');
  if (searchInput) searchInput.value = '';

  const kidData = kids.find(k => k.id === kid.id);
  const assignedIds = new Set(kidData?.subjectIds || []);
  renderSubjectsGlobalList(assignedIds, kid, '');
}

function renderSubjectsGlobalList(assignedIds, kid, query) {
  const list = document.getElementById('subjects-global-list');
  if (!list) return;
  list.innerHTML = '';

  const q = query.toLowerCase();
  const filtered = allSubjects.filter(s => {
    if (!q) return true;
    return (s.nameHe || '').toLowerCase().includes(q) || (s.nameEn || '').toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    list.innerHTML = `<p class="text-center text-slate-400 py-4">${lang === 'he' ? 'לא נמצאו נושאים' : 'No subjects found'}</p>`;
    return;
  }

  filtered.forEach(s => {
    const name = lang === 'he' ? (s.nameHe || s.nameEn) : (s.nameEn || s.nameHe);
    const isAssigned = assignedIds.has(s.id);
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl';
    const actionLabel = isAssigned
      ? (lang === 'he' ? 'הסר' : 'Remove')
      : (lang === 'he' ? 'הוסף' : 'Add');
    row.innerHTML = `
      <span class="font-bold">${name}</span>
      <button class="px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition ${isAssigned ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-700'}"
        data-id="${s.id}" data-assigned="${isAssigned}">${actionLabel}</button>
    `;
    row.querySelector('button').addEventListener('click', async e => {
      const id = e.target.dataset.id;
      const assigned = e.target.dataset.assigned === 'true';
      if (assigned) {
        await removeSubjectFromKid(kid.id, id);
      } else {
        await addSubjectToKid(kid.id, id);
      }
      const updatedKid = kids.find(k => k.id === kid.id);
      const updatedAssigned = new Set(updatedKid?.subjectIds || []);
      const currentQuery = document.getElementById('subject-search')?.value || '';
      renderSubjectsGlobalList(updatedAssigned, kid, currentQuery);
    });
    list.appendChild(row);
  });
}

// ---- Subjects manage for add-kid flow ----
function renderSubjectsManageForAddKid() {
  const list = document.getElementById('subjects-global-list');
  if (!list) return;
  list.innerHTML = '';

  const assigned = new Set(addKidSelectedSubjectIds);
  const q = (document.getElementById('subject-search')?.value || '').toLowerCase();
  const filtered = allSubjects.filter(s =>
    !q || (s.nameHe || '').toLowerCase().includes(q) || (s.nameEn || '').toLowerCase().includes(q)
  );

  filtered.forEach(s => {
    const name = lang === 'he' ? (s.nameHe || s.nameEn) : (s.nameEn || s.nameHe);
    const isAssigned = assigned.has(s.id);
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl';
    const actionLabel = isAssigned
      ? (lang === 'he' ? 'הסר' : 'Remove')
      : (lang === 'he' ? 'הוסף' : 'Add');
    row.innerHTML = `
      <span class="font-bold">${name}</span>
      <button class="px-4 py-2 rounded-xl font-bold text-sm active:scale-95 transition ${isAssigned ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-700'}"
        data-id="${s.id}">${actionLabel}</button>
    `;
    row.querySelector('button').addEventListener('click', () => {
      const id = s.id;
      if (addKidSelectedSubjectIds.includes(id)) {
        addKidSelectedSubjectIds = addKidSelectedSubjectIds.filter(x => x !== id);
      } else {
        addKidSelectedSubjectIds.push(id);
      }
      renderSubjectsManageForAddKid();
    });
    list.appendChild(row);
  });
}

function renderAddKidSubjectsList() {
  const list = document.getElementById('add-kid-subjects-list');
  if (!list) return;
  list.innerHTML = '';
  if (addKidSelectedSubjectIds.length === 0) {
    list.innerHTML = `<p class="text-slate-400 text-sm py-1">${lang === 'he' ? 'לא נבחרו נושאים עדיין' : 'No subjects selected yet'}</p>`;
    return;
  }
  addKidSelectedSubjectIds.forEach(sid => {
    const s = allSubjects.find(x => x.id === sid);
    if (!s) return;
    const name = lang === 'he' ? (s.nameHe || s.nameEn) : (s.nameEn || s.nameHe);
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between py-2 px-3 bg-indigo-50 rounded-xl';
    row.innerHTML = `<span class="font-bold text-sm">${name}</span><button class="text-red-400 hover:text-red-600 font-bold text-xs px-2" data-id="${sid}">✕</button>`;
    row.querySelector('button').addEventListener('click', () => {
      addKidSelectedSubjectIds = addKidSelectedSubjectIds.filter(id => id !== sid);
      renderAddKidSubjectsList();
    });
    list.appendChild(row);
  });
}

// ---- Firebase data operations ----
async function loadKidsFromFirestore() {
  if (!currentUser) return;
  const snap = await db.collection('users').doc(currentUser.uid).collection('kids').orderBy('createdAt').get();
  kids = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  profiles = kids;
}

async function ensureAllSubjects() {
  if (allSubjects.length > 0) return;
  await loadAllSubjects();
}

async function loadAllSubjects() {
  const snap = await db.collection('subjects').get();
  allSubjects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function ensureUserDoc(user) {
  const ref = db.collection('users').doc(user.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      email: user.email || '',
      displayName: user.displayName || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await ensureAllSubjects();
    await createSampleKid(user.uid);
  }
}

async function createSampleKid(uid) {
  const snap = await db.collection('subjects').where('isSystem', '==', true).limit(2).get();
  const subjectIds = snap.docs.map(d => d.id);
  await db.collection('users').doc(uid).collection('kids').add({
    name: lang === 'he' ? 'הילד שלי' : 'My child',
    gender: 'm',
    subjectIds,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function addKidToFirestore(name, gender, subjectIds) {
  if (!currentUser) return;
  await db.collection('users').doc(currentUser.uid).collection('kids').add({
    name, gender, subjectIds,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  await loadKidsFromFirestore();
  renderProfileGrid();
}

async function deleteKid(kidId) {
  if (!currentUser) return;
  await db.collection('users').doc(currentUser.uid).collection('kids').doc(kidId).delete();
  kids = kids.filter(k => k.id !== kidId);
  profiles = kids;
  if (activeProfileId === kidId) {
    activeProfileId = null;
    activeKidId_fs = null;
    const chip = document.getElementById('profile-chip');
    if (chip) chip.classList.add('hidden');
  }
  renderProfileGrid();
}

function confirmDeleteKid(kid) {
  const msg = lang === 'he' ? `למחוק את ${kid.name}?` : `Delete ${kid.name}?`;
  if (confirm(msg)) deleteKid(kid.id);
}

async function addSubjectToKid(kidId, subjectId) {
  if (!currentUser) return;
  await db.collection('users').doc(currentUser.uid).collection('kids').doc(kidId)
    .update({ subjectIds: firebase.firestore.FieldValue.arrayUnion(subjectId) });
  const idx = kids.findIndex(k => k.id === kidId);
  if (idx !== -1) {
    if (!kids[idx].subjectIds) kids[idx].subjectIds = [];
    if (!kids[idx].subjectIds.includes(subjectId)) kids[idx].subjectIds.push(subjectId);
  }
}

async function removeSubjectFromKid(kidId, subjectId) {
  if (!currentUser) return;
  await db.collection('users').doc(currentUser.uid).collection('kids').doc(kidId)
    .update({ subjectIds: firebase.firestore.FieldValue.arrayRemove(subjectId) });
  const idx = kids.findIndex(k => k.id === kidId);
  if (idx !== -1 && kids[idx].subjectIds) {
    kids[idx].subjectIds = kids[idx].subjectIds.filter(id => id !== subjectId);
  }
}

// ---- Sign out ----
function doSignOut() {
  auth.signOut().then(() => {
    kids = []; profiles = []; allSubjects = [];
    currentUser = null; activeKidId_fs = null; activeProfileId = null;
    const chip = document.getElementById('profile-chip');
    const sBtn = document.getElementById('signout-btn');
    const aBtn = document.getElementById('admin-btn');
    if (chip) chip.classList.add('hidden');
    if (sBtn) sBtn.classList.add('hidden');
    if (aBtn) aBtn.classList.add('hidden');
    showScreen('auth-screen');
  });
}

// ---- Auth screen handlers ----
document.getElementById('google-signin-btn').addEventListener('click', async () => {
  hideAuthError();
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(provider);
  } catch (e) {
    showAuthError(getAuthErrorMsg(e.code));
  }
});

document.getElementById('email-signin-btn').addEventListener('click', async () => {
  hideAuthError();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email || !password) { showAuthError(lang === 'he' ? 'נא למלא אימייל וסיסמה' : 'Please enter email and password'); return; }
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (e) {
    showAuthError(getAuthErrorMsg(e.code));
  }
});

document.getElementById('email-signup-btn').addEventListener('click', async () => {
  hideAuthError();
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email || !password) { showAuthError(lang === 'he' ? 'נא למלא אימייל וסיסמה' : 'Please enter email and password'); return; }
  try {
    await auth.createUserWithEmailAndPassword(email, password);
  } catch (e) {
    showAuthError(getAuthErrorMsg(e.code));
  }
});

document.getElementById('signout-btn').addEventListener('click', doSignOut);

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
function hideAuthError() {
  const el = document.getElementById('auth-error');
  if (el) el.classList.add('hidden');
}
function getAuthErrorMsg(code) {
  const map = {
    'auth/user-not-found': lang === 'he' ? 'משתמש לא נמצא' : 'User not found',
    'auth/wrong-password': lang === 'he' ? 'סיסמה שגויה' : 'Wrong password',
    'auth/invalid-credential': lang === 'he' ? 'אימייל או סיסמה שגויים' : 'Invalid email or password',
    'auth/email-already-in-use': lang === 'he' ? 'האימייל כבר בשימוש' : 'Email already in use',
    'auth/weak-password': lang === 'he' ? 'סיסמה חלשה (מינימום 6 תווים)' : 'Password too weak (min 6 chars)',
    'auth/invalid-email': lang === 'he' ? 'אימייל לא תקין' : 'Invalid email format',
    'auth/popup-closed-by-user': lang === 'he' ? 'החלון נסגר' : 'Popup closed',
  };
  return map[code] || (lang === 'he' ? 'שגיאה, אנא נסה שוב' : 'Error, please try again');
}

// ---- Add kid screen ----
// Override the inline add-profile-btn handler
window.kaflonHandleAddKid = async () => {
  addKidSelectedSubjectIds = [];
  newKidGender_fs = 'f';
  document.getElementById('kid-name-input').value = '';
  document.querySelectorAll('.add-kid-gender-btn').forEach(b => {
    b.classList.remove('bg-pink-600', 'bg-blue-600', 'text-white');
    b.dataset.gender === 'f' ? b.classList.add('bg-pink-50') : b.classList.add('bg-blue-50');
  });
  const fBtn = document.querySelector('.add-kid-gender-btn[data-gender="f"]');
  if (fBtn) { fBtn.classList.remove('bg-pink-50'); fBtn.classList.add('bg-pink-600', 'text-white'); }
  await ensureAllSubjects();
  renderAddKidSubjectsList();
  showScreen('add-kid-screen');
};

document.querySelectorAll('.add-kid-gender-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.add-kid-gender-btn').forEach(b => {
      b.classList.remove('bg-pink-600', 'bg-blue-600', 'text-white');
      b.dataset.gender === 'f' ? b.classList.add('bg-pink-50') : b.classList.add('bg-blue-50');
    });
    btn.classList.remove('bg-pink-50', 'bg-blue-50');
    btn.classList.add(btn.dataset.gender === 'f' ? 'bg-pink-600' : 'bg-blue-600', 'text-white');
    newKidGender_fs = btn.dataset.gender;
  });
});

document.getElementById('back-from-add-kid').addEventListener('click', () => showScreen('profile-picker'));

document.getElementById('add-kid-add-subject-btn').addEventListener('click', async () => {
  await ensureAllSubjects();
  managingSubjectsContext = 'add-kid';
  document.getElementById('subject-search').value = '';
  renderSubjectsManageForAddKid();
  const backBtn = document.getElementById('back-from-subjects-manage');
  if (backBtn) backBtn.onclick = () => { renderAddKidSubjectsList(); showScreen('add-kid-screen'); };
  showScreen('subjects-manage-screen');
});

document.getElementById('save-kid-btn').addEventListener('click', async () => {
  const name = document.getElementById('kid-name-input').value.trim();
  if (!name) { document.getElementById('kid-name-input').focus(); return; }
  document.getElementById('save-kid-btn').disabled = true;
  try {
    await addKidToFirestore(name, newKidGender_fs, addKidSelectedSubjectIds);
    track('kid_added', { subject_count: addKidSelectedSubjectIds.length });
    showScreen('profile-picker');
  } finally {
    document.getElementById('save-kid-btn').disabled = false;
  }
});

// ---- Subjects manage screen ----
document.getElementById('subject-search').addEventListener('input', e => {
  const q = e.target.value;
  if (managingSubjectsContext === 'add-kid') {
    renderSubjectsManageForAddKid();
  } else if (managingSubjectsForKid) {
    const kidData = kids.find(k => k.id === managingSubjectsForKid.id);
    const assignedIds = new Set(kidData?.subjectIds || []);
    renderSubjectsGlobalList(assignedIds, managingSubjectsForKid, q);
  }
});

document.getElementById('manage-subjects-btn').addEventListener('click', async () => {
  const kid = kids.find(k => k.id === activeKidId_fs);
  if (!kid) return;
  managingSubjectsForKid = kid;
  managingSubjectsContext = 'kid';
  await ensureAllSubjects();
  document.getElementById('subject-search').value = '';
  renderSubjectsManageScreen(kid);
  const backBtn = document.getElementById('back-from-subjects-manage');
  if (backBtn) backBtn.onclick = () => {
    const subs = getKidSubjects(kid);
    if (subs.length > 1) { renderSubjectPickerForDrill(kid, subs); showScreen('subject-picker-screen'); }
    else { showScreen('profile-picker'); }
  };
  showScreen('subjects-manage-screen');
});

document.getElementById('create-subject-btn').addEventListener('click', () => {
  document.getElementById('subject-name-he').value = '';
  document.getElementById('subject-name-en').value = '';
  document.getElementById('subject-desc').value = '';
  document.getElementById('add-subject-error').classList.add('hidden');
  document.getElementById('agent-status').classList.add('hidden');
  document.getElementById('generate-subject-btn').disabled = false;
  showScreen('add-subject-screen');
});

// ---- Subject picker (drill) ----
document.getElementById('back-from-subject-picker').addEventListener('click', () => {
  activeSubjectId = null;
  showScreen('profile-picker');
});

// ---- Add subject screen (kaflon agent) ----
document.getElementById('back-from-add-subject').addEventListener('click', () => showScreen('subjects-manage-screen'));

document.getElementById('generate-subject-btn').addEventListener('click', async () => {
  const nameHe = document.getElementById('subject-name-he').value.trim();
  const nameEn = document.getElementById('subject-name-en').value.trim();
  const desc = document.getElementById('subject-desc').value.trim();
  const grade = parseInt(document.getElementById('subject-grade').value, 10);

  if (!nameHe && !nameEn) {
    const errEl = document.getElementById('add-subject-error');
    errEl.textContent = lang === 'he' ? 'אנא הכנס שם לנושא' : 'Please enter a subject name';
    errEl.classList.remove('hidden');
    return;
  }

  document.getElementById('add-subject-error').classList.add('hidden');
  document.getElementById('generate-subject-btn').disabled = true;
  document.getElementById('agent-status').classList.remove('hidden');
  document.getElementById('agent-status-text').textContent = lang === 'he' ? '🤖 כפלון יוצר את הנושא...' : '🤖 Kaflon is creating your subject...';

  try {
    const kaflonAgentFn = functions.httpsCallable('kaflonAgent');
    const result = await kaflonAgentFn({ subjectNameHe: nameHe || nameEn, subjectNameEn: nameEn || nameHe, description: desc, gradeLevel: grade });
    const subjectId = result.data.subjectId;

    await loadAllSubjects(); // refresh global list

    if (managingSubjectsContext === 'kid' && managingSubjectsForKid) {
      await addSubjectToKid(managingSubjectsForKid.id, subjectId);
    } else if (managingSubjectsContext === 'add-kid') {
      if (!addKidSelectedSubjectIds.includes(subjectId)) addKidSelectedSubjectIds.push(subjectId);
    }

    track('subject_created', { drill_type: 'custom', grade });
    document.getElementById('agent-status-text').textContent = lang === 'he' ? '✅ הנושא נוצר בהצלחה!' : '✅ Subject created!';
    setTimeout(() => showScreen('subjects-manage-screen'), 1200);
  } catch (e) {
    document.getElementById('agent-status').classList.add('hidden');
    const errEl = document.getElementById('add-subject-error');
    errEl.textContent = lang === 'he' ? 'שגיאה ביצירת הנושא, אנא נסה שוב' : 'Error creating subject, please try again';
    errEl.classList.remove('hidden');
  } finally {
    document.getElementById('generate-subject-btn').disabled = false;
  }
});

// ---- Custom drill ----
let customDrillSubject = null;
let customDrillQuestions = [];
let customDrillIdx = 0;
let customDrillScore = 0;
let customDrillStreak = 0;

function startCustomDrill(subject) {
  customDrillSubject = subject;
  customDrillQuestions = (subject.starterQuestions || []).slice();
  customDrillIdx = 0;
  customDrillScore = 0;
  customDrillStreak = 0;

  const name = lang === 'he' ? (subject.nameHe || subject.nameEn) : (subject.nameEn || subject.nameHe);
  document.getElementById('custom-drill-title').textContent = name;
  document.getElementById('custom-score').textContent = '0';
  document.getElementById('custom-streak').textContent = '0';
  document.getElementById('custom-feedback').classList.add('hidden');

  showScreen('custom-drill');
  showCustomQuestion();
}

function showCustomQuestion() {
  if (customDrillQuestions.length === 0) {
    document.getElementById('custom-question-text').textContent = lang === 'he' ? 'אין שאלות בנושא זה' : 'No questions in this subject';
    return;
  }
  if (customDrillIdx >= customDrillQuestions.length) customDrillIdx = 0;
  const q = customDrillQuestions[customDrillIdx];
  const qText = lang === 'he' ? (q.questionHe || q.questionEn) : (q.questionEn || q.questionHe);
  document.getElementById('custom-question-text').textContent = qText;
  document.getElementById('custom-feedback').classList.add('hidden');

  const choicesDiv = document.getElementById('custom-choices');
  const textDiv = document.getElementById('custom-text-input');

  if (q.type === 'multiple-choice' && Array.isArray(q.choices) && q.choices.length) {
    choicesDiv.classList.remove('hidden');
    textDiv.classList.add('hidden');
    choicesDiv.innerHTML = '';
    // Shuffle choices
    const shuffled = q.choices.slice().sort(() => Math.random() - 0.5);
    shuffled.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'py-3 px-4 bg-indigo-50 rounded-xl font-bold active:scale-95 transition hover:bg-indigo-100 text-center';
      btn.textContent = choice;
      btn.addEventListener('click', () => checkCustomAnswer(String(choice), q));
      choicesDiv.appendChild(btn);
    });
  } else {
    choicesDiv.classList.add('hidden');
    textDiv.classList.remove('hidden');
    const inp = document.getElementById('custom-answer-input');
    inp.value = '';
    inp.dir = 'ltr';
    setTimeout(() => inp.focus(), 100);
  }
}

function checkCustomAnswer(answer, q) {
  const correct = String(q.answer).trim().toLowerCase() === String(answer).trim().toLowerCase();
  const fb = document.getElementById('custom-feedback');

  if (correct) {
    customDrillScore++;
    customDrillStreak++;
    fb.textContent = i18n[lang]?.correct || 'נכון! 🎉';
    fb.className = 'text-center text-lg font-bold py-2 text-green-600';
  } else {
    customDrillStreak = 0;
    fb.textContent = `${i18n[lang]?.wrong || 'התשובה היא'} ${q.answer}`;
    fb.className = 'text-center text-lg font-bold py-2 text-red-500';
  }

  fb.classList.remove('hidden');
  document.getElementById('custom-score').textContent = customDrillScore;
  document.getElementById('custom-streak').textContent = customDrillStreak;
  customDrillIdx++;
  setTimeout(showCustomQuestion, 1500);
}

document.getElementById('custom-check-btn').addEventListener('click', () => {
  if (customDrillIdx >= customDrillQuestions.length) return;
  const q = customDrillQuestions[customDrillIdx];
  checkCustomAnswer(document.getElementById('custom-answer-input').value.trim(), q);
});

document.getElementById('custom-answer-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && customDrillIdx < customDrillQuestions.length) {
    checkCustomAnswer(document.getElementById('custom-answer-input').value.trim(), customDrillQuestions[customDrillIdx]);
  }
});

document.getElementById('back-from-custom-drill').addEventListener('click', () => {
  const kid = kids.find(k => k.id === activeKidId_fs);
  if (!kid) { showScreen('profile-picker'); return; }
  const subs = getKidSubjects(kid);
  if (subs.length > 1) {
    renderSubjectPickerForDrill(kid, subs);
    showScreen('subject-picker-screen');
  } else {
    showScreen('profile-picker');
  }
});

// ---- Admin dashboard ----
const ADMIN_EMAILS = ['michal@opsagents.agency', 'michal@msapps.mobi'];

function isCurrentUserAdmin() {
  if (!currentUser) return false;
  return ADMIN_EMAILS.includes((currentUser.email || '').toLowerCase());
}

async function openAdminDashboard() {
  showScreen('admin-screen');
  const summary = document.getElementById('admin-summary');
  const list = document.getElementById('admin-users-list');
  summary.textContent = lang === 'he' ? 'טוען...' : 'Loading...';
  list.innerHTML = '';
  track('admin_dashboard_open');

  try {
    const listAllUsersFn = functions.httpsCallable('listAllUsers');
    const res = await listAllUsersFn({});
    const { users, total } = res.data;
    summary.textContent = lang === 'he' ? `${total} משתמשים` : `${total} users`;
    list.innerHTML = '';
    users.forEach(u => {
      const created = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '';
      const row = document.createElement('div');
      row.className = 'py-3 px-4 bg-slate-50 rounded-xl flex items-center justify-between gap-3';
      row.innerHTML = `
        <div class="min-w-0">
          <div class="font-bold text-sm truncate" dir="ltr">${u.email || u.uid}</div>
          <div class="text-xs text-slate-400" dir="ltr">${u.displayName ? u.displayName + ' · ' : ''}${created}</div>
        </div>
        <div class="shrink-0 text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
          ${u.kidCount} ${lang === 'he' ? 'ילדים' : 'kids'}
        </div>`;
      list.appendChild(row);
    });
  } catch (e) {
    summary.textContent = lang === 'he' ? 'שגיאה בטעינת המשתמשים' : 'Error loading users';
    track('exception', { description: 'admin listAllUsers: ' + String(e.message || e).slice(0, 120), fatal: false });
  }
}

document.getElementById('admin-btn').addEventListener('click', openAdminDashboard);
document.getElementById('back-from-admin').addEventListener('click', () => showScreen('profile-picker'));

// ---- Firebase auth state listener ----
auth.onAuthStateChanged(async user => {
  const signoutBtn = document.getElementById('signout-btn');
  const adminBtn = document.getElementById('admin-btn');
  hideAuthError();

  if (!user) {
    currentUser = null;
    if (signoutBtn) signoutBtn.classList.add('hidden');
    if (adminBtn) adminBtn.classList.add('hidden');
    showScreen('auth-screen');
    return;
  }

  currentUser = user;
  if (signoutBtn) signoutBtn.classList.remove('hidden');
  if (adminBtn) adminBtn.classList.toggle('hidden', !isCurrentUserAdmin());
  track('login', { method: user.providerData[0]?.providerId || 'unknown' });

  try {
    await ensureUserDoc(user);
    await Promise.all([loadKidsFromFirestore(), ensureAllSubjects()]);
    renderProfileGrid();
    routeProfile();
  } catch (err) {
    console.error('Boot error:', err);
    showScreen('auth-screen');
  }
});
