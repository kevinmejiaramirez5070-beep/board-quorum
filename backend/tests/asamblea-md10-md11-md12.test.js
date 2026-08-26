/**
 * Pruebas MD-10, MD-11 y MD-12 con BD simulada. No toca Supabase.
 *
 *  MD-10  Doble identificación del núcleo familiar → una sola representación.
 *  MD-11  Reunión de Asamblea → maestro vigente → un único universo.
 *  MD-12  Cómputo único: 0 <= Q <= U, sin dobles cómputos por persona.
 */
process.env.DB_TYPE = 'postgresql';

const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src');

const CLIENT_ID = 1;
const PROD_ASAMBLEA = 4;
const PROD_JD = 1;
const MEETING_SIN_PRODUCTO = 90;   // creada como Asamblea pero sin órgano

let products = [
  { id: PROD_JD, client_id: CLIENT_ID, name: 'Junta Directiva', active: true },
  { id: PROD_ASAMBLEA, client_id: CLIENT_ID, name: 'Asamblea General', active: true }
];
let members = [];
let attendance = [];
let meetings = [
  { id: MEETING_SIN_PRODUCTO, client_id: CLIENT_ID, product_id: null, type: 'asamblea', status: 'scheduled', date: new Date() }
];
let mSeq = 1, aSeq = 1;

// Maestro de Asamblea: 6 cursos con Principal. Dos traen la cédula del padre.
function delegado(curso, tipo, doc, nombre, doc2) {
  members.push({ id: mSeq++, client_id: CLIENT_ID, product_id: PROD_ASAMBLEA, name: nombre,
    member_type: tipo, numero_documento: doc, secondary_document: doc2 || null,
    secondary_name: doc2 ? nombre + ' (PADRE)' : null,
    rol_organico: curso, tipo_participante: tipo === 'suplente' ? 'SUPLENTE' : 'PRINCIPAL',
    cuenta_quorum: tipo === 'principal', principal_id: null, active: true });
  return members[members.length - 1];
}
const p1 = delegado('QUINTO A', 'principal', '111', 'MADRE UNO', '1111');   // nucleo con 2 cedulas
const p2 = delegado('QUINTO B', 'principal', '222', 'MADRE DOS', '2222');
delegado('QUINTO C', 'principal', '333', 'MADRE TRES');
delegado('QUINTO D', 'principal', '444', 'MADRE CUATRO');
delegado('QUINTO E', 'principal', '555', 'MADRE CINCO');
delegado('QUINTO F', 'principal', '666', 'MADRE SEIS');
delegado('QUINTO A', 'suplente', '777', 'SUPLENTE UNO');

// Miembros de Junta Directiva: NO deben entrar al universo de la Asamblea
for (let i = 0; i < 20; i++) {
  members.push({ id: mSeq++, client_id: CLIENT_ID, product_id: PROD_JD, name: `JD ${i}`,
    member_type: 'principal', numero_documento: `90${i}`, secondary_document: null,
    rol_organico: `CARGO ${i}`, tipo_participante: 'PRINCIPAL', cuenta_quorum: true,
    principal_id: null, active: true });
}

const norm = (v) => String(v ?? '').replace(/\D/g, '');

const fakeDb = {
  async execute(sql, params = []) {
    const q = sql.replace(/\s+/g, ' ').trim();

    if (q.startsWith('SELECT id, product_id, client_id, type, status FROM meetings')) {
      return [meetings.filter(m => m.id === Number(params[0]))];
    }
    if (q.startsWith('UPDATE meetings SET product_id')) {
      const m = meetings.find(x => x.id === Number(params[1]));
      if (m && m.product_id == null) m.product_id = params[0];
      return [{}];
    }
    if (q.includes('FROM products p')) {
      return [products.filter(p => p.client_id === Number(params[0]) && p.active).map(p => ({
        id: p.id, name: p.name,
        principales: members.filter(m => m.product_id === p.id && m.member_type === 'principal' && m.active).length
      }))];
    }
    if (q.startsWith('SELECT DISTINCT rol_organico FROM members')) {
      const set = new Set(members.filter(m => m.product_id === Number(params[0]) && m.member_type === 'principal' && m.active && m.rol_organico).map(m => m.rol_organico));
      return [[...set].map(rol_organico => ({ rol_organico }))];
    }
    if (q.startsWith('SELECT COUNT(*) AS n FROM members m')) {
      return [[{ n: members.filter(m => m.product_id === Number(params[0]) && m.member_type === 'principal' && m.active).length }]];
    }
    if (q.includes('FROM attendance a JOIN members m')) {
      const byId = new Map(members.map(m => [m.id, m]));
      const rows = attendance.filter(a => a.meeting_id === Number(params[0]) && a.status === 'present' && !a.pending_approval && a.member_id)
        .map(a => byId.get(a.member_id))
        .filter(m => m && m.product_id === Number(params[1]) && m.active)
        .map(m => ({ member_id: m.id, acting_as_principal: false, name: m.name,
          member_type: m.member_type, rol_organico: m.rol_organico, numero_documento: m.numero_documento }));
      return [rows];
    }
    // MD-10 — busqueda por cualquiera de las dos cedulas del nucleo
    if (q.includes('FROM members WHERE') && q.includes('documento_usado')) {
      const d = norm(params[0]);
      const hit = members.filter(m => m.client_id === Number(params[4]) && m.active &&
        (norm(m.numero_documento) === d || (m.secondary_document && norm(m.secondary_document) === d)))
        .map(m => ({ ...m, documento_usado: norm(m.numero_documento) === d ? 'primario' : 'secundario' }))
        .sort((a, b) => (a.documento_usado === 'primario' ? 0 : 1) - (b.documento_usado === 'primario' ? 0 : 1));
      return [hit];
    }
    if (q.includes('representation_powers')) throw new Error('no existe');
    if (q.includes('assembly_moment_events')) throw new Error('no existe');
    if (q.startsWith('INSERT INTO quorum_log')) return [{ insertId: 1 }];
    return [[]];
  }
};
const dbPath = path.join(SRC, 'config/database.js');
require.cache[require.resolve(dbPath)] = { id: dbPath, filename: dbPath, loaded: true, exports: fakeDb };

const AQS = require(path.join(SRC, 'services/assemblyQuorumService.js'));
const Resolver = require(path.join(SRC, 'services/assemblyProductResolver.js'));
const Member = require(path.join(SRC, 'models/Member.js'));

function presente(memberId) {
  attendance.push({ id: aSeq++, meeting_id: MEETING_SIN_PRODUCTO, member_id: memberId,
    status: 'present', pending_approval: false });
}

let fallos = 0, pasos = 0;
function check(n, real, esp) {
  pasos++;
  const ok = JSON.stringify(real) === JSON.stringify(esp);
  if (!ok) { fallos++; console.log(`  FALLO  ${n}: esperado ${JSON.stringify(esp)}, obtuvo ${JSON.stringify(real)}`); }
  else console.log(`  ok     ${n} = ${JSON.stringify(real)}`);
}

(async () => {
  console.log('\n=== MD-11 §4 · Reunion de Asamblea creada SIN organo asignado ===');
  check('Arranca sin product_id', meetings[0].product_id, null);
  const r = await Resolver.resolve(CLIENT_ID);
  check('Resuelve el organo de Asamblea', r.product_id, PROD_ASAMBLEA);
  check('Sin ambiguedad', r.motivo, null);

  console.log('\n=== MD-11 §3 · Al consultar el quorum queda vinculada sola ===');
  const universo = await AQS.getTotalPrincipals(
    (await AQS._getMeetingContext(MEETING_SIN_PRODUCTO)).product_id
  );
  check('La reunion quedo vinculada', meetings[0].product_id, PROD_ASAMBLEA);
  check('Universo = solo Principales de Asamblea', universo, 6);
  check('Los 20 de Junta Directiva NO entran', universo < 26, true);

  console.log('\n=== MD-11 §6 · Universo unico en todo el panel ===');
  const panel = await AQS.getFullAssemblyPanel(MEETING_SIN_PRODUCTO);
  check('Cursos habilitados', panel.cursos_habilitados, 6);
  check('Total principales', panel.total_principales, 6);
  check('Quorum inicial CEIL(6/2)+1', panel.quorum_m1, 4);
  check('Momento Siguiente CEIL(6*0.20)', panel.quorum_m2, 2);
  check('El panel y el universo coinciden', panel.cursos_habilitados, panel.total_principales);

  console.log('\n=== MD-10 §14 · Las dos cedulas del nucleo resuelven el mismo registro ===');
  const porMadre = await Member.findByDocumentNumber('111', CLIENT_ID);
  const porPadre = await Member.findByDocumentNumber('1111', CLIENT_ID);
  check('La cedula de la madre encuentra', !!porMadre, true);
  check('La cedula del padre TAMBIEN encuentra', !!porPadre, true);
  check('Ambas resuelven el mismo registro', porMadre.id === porPadre.id, true);
  check('Se sabe cual documento se uso', [porMadre.documento_usado, porPadre.documento_usado], ['primario', 'secundario']);

  const inexistente = await Member.findByDocumentNumber('999999', CLIENT_ID);
  check('Un documento que de verdad no existe sigue sin encontrarse', inexistente, null);

  console.log('\n=== MD-10 §14 · El nucleo genera UNA sola representacion ===');
  presente(p1.id);   // se registra la madre
  check('Representaciones tras la madre', await AQS.getRepresentedCoursesCount(MEETING_SIN_PRODUCTO), 1);
  presente(p1.id);   // el padre resuelve el MISMO member_id
  check('El padre NO agrega una segunda representacion', await AQS.getRepresentedCoursesCount(MEETING_SIN_PRODUCTO), 1);

  console.log('\n=== MD-12 · Una persona no representa dos cursos ===');
  // La misma persona (mismo documento) figura tambien en QUINTO F
  const intruso = members.find(m => m.rol_organico === 'QUINTO F' && m.member_type === 'principal');
  intruso.numero_documento = '111';   // duplicidad de identidad
  presente(intruso.id);
  const st = await AQS.getCourseRepresentationStatus(MEETING_SIN_PRODUCTO);
  check('Solo un curso representado por esa persona',
    st.filter(c => c.representado && c.votante_nombre && String(c.votante_id) !== '').length, 1);
  const bloqueado = st.find(c => c.motivo_no_representado === 'PERSONA_YA_REPRESENTA_OTRO_CURSO');
  check('El segundo curso queda sin representar', !!bloqueado, true);
  check('Q sigue en 1', await AQS.getRepresentedCoursesCount(MEETING_SIN_PRODUCTO), 1);

  console.log('\n=== MD-12 · Invariante 0 <= Q <= U ===');
  presente(members.find(m => m.rol_organico === 'QUINTO B' && m.member_type === 'principal').id);
  presente(members.find(m => m.rol_organico === 'QUINTO C').id);
  presente(members.find(m => m.rol_organico === 'QUINTO D').id);
  presente(members.find(m => m.rol_organico === 'QUINTO E').id);
  const Q = await AQS.getRepresentedCoursesCount(MEETING_SIN_PRODUCTO);
  const U = (await AQS.getCourseRepresentationStatus(MEETING_SIN_PRODUCTO)).length;
  console.log(`  U = ${U} posiciones elegibles, Q = ${Q} representaciones`);
  check('0 <= Q', Q >= 0, true);
  check('Q <= U', Q <= U, true);
  check('Q no puede pasar de U aunque haya mas asistentes', Q, 5);
  check('Asistentes registrados son mas que Q', attendance.length > Q, true);

  console.log(`\n${fallos === 0 ? 'TODO OK' : 'HAY FALLOS'} — ${pasos - fallos}/${pasos} comprobaciones pasaron\n`);
  process.exit(fallos === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
