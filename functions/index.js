const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const { VertexAI } = require('@google-cloud/vertexai');

admin.initializeApp();
const db = admin.firestore();

const vertex = new VertexAI({ project: 'opsagent-prod', location: 'us-central1' });
const model = vertex.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
});

const SYSTEM_SUBJECTS = [
  {
    id: 'sys-multiply',
    nameHe: 'כפל', nameEn: 'Multiplication',
    descriptionHe: 'לוחות כפל 1–10', descriptionEn: 'Multiplication tables 1–10',
    drillType: 'multiply', drillConfig: {}, starterQuestions: [],
    isSystem: true, createdBy: 'system'
  },
  {
    id: 'sys-divide',
    nameHe: 'חילוק', nameEn: 'Division',
    descriptionHe: 'לוחות חילוק 1–10', descriptionEn: 'Division tables 1–10',
    drillType: 'divide', drillConfig: {}, starterQuestions: [],
    isSystem: true, createdBy: 'system'
  },
  {
    id: 'sys-mixed',
    nameHe: 'כפל וחילוק', nameEn: 'Mixed ×÷',
    descriptionHe: 'כפל וחילוק מעורב', descriptionEn: 'Mixed multiplication and division',
    drillType: 'mixed', drillConfig: {}, starterQuestions: [],
    isSystem: true, createdBy: 'system'
  },
  {
    id: 'sys-decimals',
    nameHe: 'עשרוניים', nameEn: 'Decimals',
    descriptionHe: 'מסלול שברים עשרוניים', descriptionEn: 'Decimal numbers curriculum',
    drillType: 'decimals', drillConfig: {}, starterQuestions: [],
    isSystem: true, createdBy: 'system'
  },
  {
    id: 'sys-fractions',
    nameHe: 'שברים', nameEn: 'Fractions',
    descriptionHe: 'שברים פשוטים — חיבור וחיסור', descriptionEn: 'Pure fractions — add and subtract',
    drillType: 'fractions', drillConfig: {}, starterQuestions: [],
    isSystem: true, createdBy: 'system'
  }
];

// NOTE: system subjects (SYSTEM_SUBJECTS above) are seeded out-of-band via an
// admin/REST one-off, NOT a public endpoint. The previous unauthenticated
// onRequest seeder was removed (anyone with the URL could overwrite the shared
// subjects collection). Re-add ONLY as an isAdmin()-gated onCall if needed.

// Kaflon agent — generates a new subject with starter questions
exports.kaflonAgent = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentication required');

  const { subjectNameHe, subjectNameEn, description, gradeLevel } = request.data;
  if (!subjectNameHe && !subjectNameEn) {
    throw new HttpsError('invalid-argument', 'subjectNameHe or subjectNameEn is required');
  }

  const nameHe = subjectNameHe || subjectNameEn;
  const nameEn = subjectNameEn || subjectNameHe;
  const grade = gradeLevel || 4;

  const prompt = `You are an expert elementary school math teacher creating practice questions for a child in grade ${grade}.

Create exactly 20 practice questions for the subject: "${nameEn}" (Hebrew: "${nameHe}").
${description ? `Context: ${description}` : ''}

Return a JSON object with this exact structure:
{
  "nameHe": "${nameHe}",
  "nameEn": "${nameEn}",
  "descriptionHe": "<one sentence in Hebrew describing what the child will practice>",
  "descriptionEn": "<one sentence in English describing what the child will practice>",
  "questions": [
    {
      "type": "multiple-choice",
      "questionHe": "<question in Hebrew>",
      "questionEn": "<question in English>",
      "answer": "<correct answer as a string>",
      "choices": ["<wrong1>", "<correct>", "<wrong2>", "<wrong3>"]
    },
    {
      "type": "math",
      "questionHe": "<math question in Hebrew>",
      "questionEn": "<math question in English>",
      "answer": "<numeric answer as a string>",
      "choices": null
    }
  ]
}

Rules:
- Mix question types: ~10 multiple-choice and ~10 math (free text)
- Questions must be appropriate for grade ${grade}
- Vary difficulty: easy to medium-hard
- For math type, "choices" must be null
- Answers must always be strings
- Hebrew questions must use proper Hebrew math terminology
- Return ONLY the JSON, no markdown, no explanation`;

  const result = await model.generateContent(prompt);
  const text = result.response.candidates[0].content.parts[0].text;

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new HttpsError('internal', 'Failed to parse AI response');
  }

  const questions = (parsed.questions || []).slice(0, 20).map(q => ({
    type: q.type || 'math',
    questionHe: q.questionHe || q.questionEn || '',
    questionEn: q.questionEn || q.questionHe || '',
    answer: String(q.answer || ''),
    choices: q.choices || null
  }));

  const nameTokens = [
    ...nameHe.toLowerCase().split(''),
    ...nameEn.toLowerCase().split(' '),
    nameHe.toLowerCase(),
    nameEn.toLowerCase()
  ].filter((v, i, a) => v.length > 0 && a.indexOf(v) === i);

  const subjectDoc = {
    nameHe: parsed.nameHe || nameHe,
    nameEn: parsed.nameEn || nameEn,
    descriptionHe: parsed.descriptionHe || '',
    descriptionEn: parsed.descriptionEn || '',
    drillType: 'custom',
    drillConfig: { gradeLevel: grade },
    starterQuestions: questions,
    isSystem: false,
    createdBy: request.auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    searchTokens: nameTokens
  };

  const ref = await db.collection('subjects').add(subjectDoc);
  return { subjectId: ref.id };
});

// Admin allowlist — who may view the admin dashboard
const ADMIN_EMAILS = ['michal@opsagents.agency', 'michal@msapps.mobi'];

function isAdmin(auth) {
  if (!auth) return false;
  if (auth.token && auth.token.admin === true) return true;
  const email = (auth.token && auth.token.email || '').toLowerCase();
  return ADMIN_EMAILS.includes(email);
}

// listAllUsers — admin dashboard data: every user + their kid count.
// Admin-claim/allowlist gated. Never expose this path to non-admins.
exports.listAllUsers = onCall({ region: 'us-central1' }, async (request) => {
  if (!isAdmin(request.auth)) {
    throw new HttpsError('permission-denied', 'Admin access required');
  }

  const users = [];
  let pageToken;
  do {
    const res = await admin.auth().listUsers(1000, pageToken);
    for (const u of res.users) {
      let kidCount = 0;
      try {
        const kidsSnap = await db.collection('users').doc(u.uid).collection('kids').count().get();
        kidCount = kidsSnap.data().count;
      } catch { kidCount = 0; }
      users.push({
        uid: u.uid,
        email: u.email || '',
        displayName: u.displayName || '',
        createdAt: u.metadata.creationTime || '',
        lastSignIn: u.metadata.lastSignInTime || '',
        kidCount
      });
    }
    pageToken = res.pageToken;
  } while (pageToken);

  users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { users, total: users.length };
});
