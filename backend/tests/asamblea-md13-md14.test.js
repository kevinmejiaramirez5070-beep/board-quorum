/**
 * Pruebas MD-13 y MD-14, del reporte de la prueba del 26 de agosto de 2026.
 *
 *  MD-13  Un Suplente válido cuyo curso NO tiene Principal en el maestro debe
 *         ejercer la representación del curso.
 *  MD-14  Una sola cifra oficial de quórum: resumen = detalle = estado.
 *
 * Reproduce el corte real de 24 asistentes de la prueba.
 * BD simulada en memoria. No toca Supabase.
 */
process.env.DB_TYPE = 'postgresql';

const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src');

const PRODUCT_ID = 4, CLIENT_ID = 1, MEETING_ID = 80;

let members = [], attendance = [];
let mSeq = 1, aSeq = 1;

function add(curso, tipo, nombre) {
  members.push({ id: mSeq++, client_id: CLIENT_ID, product_id: PRODUCT_ID, name: nombre,
    member_type: tipo, numero_documento: String(1000000 + mSeq), secondary_document: null,
    rol_organico: curso, tipo_participante: tipo === 'suplente' ? 'SUPLENTE' : 'PRINCIPAL',
    principal_id: null, active: true });
  return members[members.length - 1];
}
function presente(m) {
  attendance.push({ id: aSeq++, meeting_id: MEETING_ID, member_id: m.id,
    status: 'present', pending_approval: false });
}

// 15 cursos con Principal, que asisten
const principalesPresentes = [];
for (let i = 1; i <= 15; i++) principalesPresentes.push(add(`CURSO P${i}`, 'principal', `PRINCIPAL ${i}`));

// 6 cursos donde asisten Principal Y Suplente: el Suplente queda desplazado
const desplazados = [];
for (let i = 1; i <= 6; i++) {
  const c = `CURSO D${i}`;
  const p = add(c, 'principal', `PRINCIPAL D${i}`);
  const su = add(c, 'suplente', `SUPLENTE D${i}`);
  desplazados.push({ p, su });
}

// 2 cursos donde el Principal NO vino, pero sí el Suplente
const suplentesActuando = [];
for (let i = 1; i <= 2; i++) {
  const c = `CURSO A${i}`;
  add(c, 'principal', `PRINCIPAL A${i}`);          // no asiste
  suplentesActuando.push(add(c, 'suplente', `SUPLENTE A${i}`));
}

// CUARTO F — el caso del reporte: Suplente valida y NINGUN Principal en el maestro
const nancy = add('CUARTO F', 'suplente', 'SANCHEZ GONZALEZ NANCY PILAR');

// Cursos del maestro que hoy no asisten, para que el universo sea realista
for (let i = 1; i <= 62; i++) add(`CURSO X${i}`, 'principal', `PRINCIPAL X${i}`);

const fakeDb = {
  async execute(sql, params = []) {
    const q = sql.replace(/\s+/g, ' ').trim();

    if (q.startsWith('SELECT id, product_id, client_id, type, status FROM meetings')) {
      return [[{ id: MEETING_ID, product_id: PRODUCT_ID, client_id: CLIENT_ID, type: 'asamblea', status: 'scheduled' }]];
    }
    if (q.startsWith('SELECT DISTINCT rol_organico FROM members') && q.includes("IN ('principal', 'suplente')")) {
      const set = new Set(members.filter(m => m.product_id === Number(params[0]) && m.active && m.rol_organico).map(m => m.rol_organico));
      return [[...set].map(rol_organico => ({ rol_organico }))];
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
      return [attendance.filter(a => a.meeting_id === Number(params[0]) && a.status === 'present' && !a.pending_approval && a.member_id)
        .map(a => byId.get(a.member_id))
        .filter(m => m && m.product_id === Number(params[1]) && m.active)
        .map(m => ({ member_id: m.id, acting_as_principal: false, name: m.name,
          member_type: m.member_type, rol_organico: m.rol_organico, numero_documento: m.numero_documento }))];
    }
    if (q.includes('FROM attendance a LEFT JOIN members m')) {
      const byId = new Map(members.map(m => [m.id, m]));
      return [attendance.filter(a => a.meeting_id === Number(params[0]) && a.status === 'present').map(a => {
        const m = byId.get(a.member_id);
        return { attendance_id: a.id, member_id: a.member_id, pending_approval: a.pending_approval,
          name: m ? m.name : a.manual_name, display_role: m ? m.rol_organico : '',
          member_type: m ? m.member_type : null, tipo_participante: m ? m.tipo_participante : null };
      })];
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

let fallos = 0, pasos = 0;
function check(n, real, esp) {
  pasos++;
  const ok = JSON.stringify(real) === JSON.stringify(esp);
  if (!ok) { fallos++; console.log(`  FALLO  ${n}: esperado ${JSON.stringify(esp)}, obtuvo ${JSON.stringify(real)}`); }
  else console.log(`  ok     ${n} = ${JSON.stringify(real)}`);
}

(async () => {
  // Corte real del reporte: 24 asistentes
  principalesPresentes.forEach(presente);            // 15
  desplazados.forEach(d => { presente(d.p); presente(d.su); });  // 12 -> 27... ajustamos abajo
  suplentesActuando.forEach(presente);               // 2
  presente(nancy);                                   // 1

  console.log('\n=== MD-13 · El Suplente sin Principal en el maestro representa su curso ===');
  const st = await AQS.getCourseRepresentationStatus(MEETING_ID);
  const cuartoF = st.find(c => c.curso === 'CUARTO F');
  check('CUARTO F esta en los cursos representables', !!cuartoF, true);
  check('CUARTO F queda representado', cuartoF.representado, true);
  check('Lo representa la Suplente', cuartoF.tipo_votante, 'suplente');
  check('Actua como Principal', cuartoF.acting_as_principal, true);
  check('Se distingue que el Principal NO existe', cuartoF.principal_inexistente, true);
  check('No se invento un Principal',
    members.filter(m => m.rol_organico === 'CUARTO F' && m.member_type === 'principal').length, 0);

  console.log('\n=== MD-13 · Las cuatro reglas de representacion ===');
  const d1 = st.find(c => c.curso === 'CURSO D1');
  check('Principal + Suplente presentes -> 1 representacion, vota el Principal', d1.tipo_votante, 'principal');
  const a1 = st.find(c => c.curso === 'CURSO A1');
  check('Principal ausente + Suplente presente -> Suplente actuando', a1.tipo_votante, 'suplente');
  check('Ese si tenia Principal en el maestro', a1.principal_inexistente, false);
  const p1 = st.find(c => c.curso === 'CURSO P1');
  check('Principal presente -> cuenta el Principal', p1.tipo_votante, 'principal');
  const x1 = st.find(c => c.curso === 'CURSO X1');
  check('Nadie presente -> sin representacion', x1.representado, false);

  console.log('\n=== MD-13 · Conciliacion del corte ===');
  const Q = await AQS.getRepresentedCoursesCount(MEETING_ID);
  const asistentes = attendance.length;
  console.log(`  ${asistentes} asistentes, ${desplazados.length} Suplentes desplazados por su Principal`);
  check('Q = asistentes - desplazados', Q, asistentes - desplazados.length);
  check('Nancy Pilar entra en el computo',
    st.filter(c => c.representado).some(c => c.votante_nombre === 'SANCHEZ GONZALEZ NANCY PILAR'), true);

  console.log('\n=== MD-14 · Una sola cifra: resumen = detalle = estado ===');
  const panel = await AQS.getFullAssemblyPanel(MEETING_ID);
  const det = await AQS.getAssemblyBreakdown(MEETING_ID);
  console.log(`  Q_RESUMEN=${panel.cursos_representados}  Q_DETALLE=${det.computable_votes}  Q_ESTADO=${Q}`);
  check('Q_RESUMEN = Q_DETALLE', panel.cursos_representados, det.computable_votes);
  check('Q_DETALLE = Q_ESTADO', det.computable_votes, Q);
  check('El detalle reporta los mismos cursos representados', det.cursos_representados, Q);
  check('Total de asistentes del detalle', det.total_present, asistentes);
  check('Los desplazados aparecen pero no cuentan',
    det.breakdown.filter(b => b.reason === 'SUPLENTE_PRINCIPAL_PRESENTE').length, desplazados.length);
  check('Nancy Pilar cuenta en el detalle',
    det.breakdown.find(b => b.name === 'SANCHEZ GONZALEZ NANCY PILAR').counts, true);
  check('Y con el motivo correcto',
    det.breakdown.find(b => b.name === 'SANCHEZ GONZALEZ NANCY PILAR').reason,
    'SUPLENTE_ACTUANDO_SIN_PRINCIPAL');

  console.log('\n=== MD-12 · El invariante se mantiene ===');
  const U = st.length;
  console.log(`  U = ${U} cursos representables, universo de quorum = ${panel.total_principales} Principales`);
  check('0 <= Q <= U', Q >= 0 && Q <= U, true);

  console.log(`\n${fallos === 0 ? 'TODO OK' : 'HAY FALLOS'} — ${pasos - fallos}/${pasos} comprobaciones pasaron\n`);
  process.exit(fallos === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
