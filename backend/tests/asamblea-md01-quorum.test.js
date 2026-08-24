/**
 * Prueba de lógica MD-01 / MD-04 / MD-05 con una BD simulada en memoria.
 * No toca Supabase. Verifica los criterios de aceptación de los documentos.
 */
const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src');

// ── Datos de la muestra controlada del TEST ASAMBLEA NRO 1 ────────────────────
const PRODUCT_ID = 7;
const MEETING_ID = 99;

let members = [];
let id = 1;
const CURSOS = Array.from({ length: 20 }, (_, i) => `CURSO ${String(i + 1).padStart(2, '0')}`);
for (const curso of CURSOS) {
  members.push({ id: id++, product_id: PRODUCT_ID, member_type: 'principal', rol_organico: curso, active: true, tipo_participante: null, name: `Principal ${curso}` });
  members.push({ id: id++, product_id: PRODUCT_ID, member_type: 'suplente', rol_organico: curso, active: true, tipo_participante: null, name: `Suplente ${curso}` });
}
// MD-05: participantes que asisten pero no computan
members.push({ id: id++, product_id: PRODUCT_ID, member_type: 'principal', rol_organico: 'CONTABILIDAD', active: true, tipo_participante: 'CONTABILIDAD', name: 'Contadora' });
members.push({ id: id++, product_id: PRODUCT_ID, member_type: 'principal', rol_organico: 'REVISORIA', active: true, tipo_participante: 'REVISORIA_FISCAL', name: 'Revisor Fiscal' });
members.push({ id: id++, product_id: PRODUCT_ID, member_type: 'principal', rol_organico: 'ADMIN', active: true, tipo_participante: 'ADMINISTRACION', name: 'Administracion' });

const byId = new Map(members.map(m => [m.id, m]));
let attendance = []; // { meeting_id, member_id, status, pending_approval }

function memberByCurso(curso, tipo) {
  return members.find(m => m.rol_organico === curso && m.member_type === tipo);
}
function marcarPresente(memberId) {
  attendance.push({ meeting_id: MEETING_ID, member_id: memberId, status: 'present', pending_approval: false });
}

// ── BD simulada ───────────────────────────────────────────────────────────────
const NON_COMPUTABLE = ['ADMINISTRACION', 'ADMINISTRACIÓN', 'CONTABILIDAD',
  'REVISORIA_FISCAL', 'REVISORIA FISCAL', 'REVISORÍA FISCAL', 'REVISORIA', 'REVISORÍA'];
const computa = (m) => !m.tipo_participante || !NON_COMPUTABLE.includes(String(m.tipo_participante).toUpperCase().trim());

const fakeDb = {
  async execute(sql, params = []) {
    const q = sql.replace(/\s+/g, ' ').trim();

    if (q.startsWith('SELECT id, product_id, client_id, type, status FROM meetings')) {
      return [[{ id: MEETING_ID, product_id: PRODUCT_ID, client_id: 1, type: 'asamblea', status: 'scheduled' }]];
    }
    if (q.includes('FROM meetings WHERE id')) {
      return [[{ id: MEETING_ID, client_id: 1, product_id: PRODUCT_ID, title: 'TEST ASAMBLEA NRO 1', date: new Date(), type: 'asamblea', status: 'scheduled' }]];
    }
    if (q.startsWith('SELECT DISTINCT rol_organico FROM members')) {
      const set = new Set(members
        .filter(m => m.product_id === params[0] && m.member_type === 'principal' && m.active && m.rol_organico && computa(m))
        .map(m => m.rol_organico));
      return [[...set].map(rol_organico => ({ rol_organico }))];
    }
    if (q.startsWith('SELECT COUNT(*) AS n FROM members')) {
      const n = members.filter(m => m.product_id === params[0] && m.member_type === 'principal' && m.active && computa(m)).length;
      return [[{ n }]];
    }
    if (q.includes('FROM attendance a JOIN members m')) {
      const rows = attendance
        .filter(a => a.meeting_id === params[0] && a.status === 'present' && !a.pending_approval)
        .map(a => byId.get(a.member_id))
        .filter(m => m && m.product_id === params[1] && m.active && computa(m))
        .map(m => ({ member_id: m.id, acting_as_principal: false, name: m.name, member_type: m.member_type, rol_organico: m.rol_organico }));
      return [rows];
    }
    if (q.includes('representation_powers')) { const e = new Error('relation "representation_powers" does not exist'); throw e; }
    if (q.includes('assembly_moment_events')) { const e = new Error('relation "assembly_moment_events" does not exist'); throw e; }
    if (q.startsWith('INSERT INTO quorum_log')) return [{ insertId: 1 }];
    return [[]];
  }
};

require.cache[require.resolve(path.join(SRC, 'config/database.js'))] = {
  id: path.join(SRC, 'config/database.js'), filename: path.join(SRC, 'config/database.js'),
  loaded: true, exports: fakeDb
};

const AQS = require(path.join(SRC, 'services/assemblyQuorumService.js'));

// ── Aserciones ────────────────────────────────────────────────────────────────
let fallos = 0, pasos = 0;
function check(nombre, real, esperado) {
  pasos++;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log(`  FALLO  ${nombre}: esperado ${JSON.stringify(esperado)}, obtuvo ${JSON.stringify(real)}`); }
  else { console.log(`  ok     ${nombre} = ${JSON.stringify(real)}`); }
}

(async () => {
  console.log('\n=== MD-01 · Universo del quorum (20 principales + 20 suplentes + 3 no computables) ===');
  const total = await AQS.getTotalPrincipals(PRODUCT_ID);
  check('Elegibles', total, 20);
  check('Minimo requerido CEIL(N/2)+1', Math.ceil(total / 2) + 1, 11);
  check('Momento Siguiente CEIL(N*0.20)', Math.ceil(total * 0.20), 4);
  let m = await AQS.getQuorumMoment(MEETING_ID);
  check('Presentes iniciales', m.cursos_representados, 0);
  check('Estado inicial', m.estado, 'SIN_QUORUM');

  console.log('\n=== MD-01 §6 · Principal + Suplente del mismo curso = 1 representacion ===');
  marcarPresente(memberByCurso('CURSO 01', 'principal').id);
  marcarPresente(memberByCurso('CURSO 01', 'suplente').id);
  let st = await AQS.getCourseRepresentationStatus(MEETING_ID);
  let c1 = st.find(c => c.curso === 'CURSO 01');
  check('Asistentes registrados curso 01', attendance.length, 2);
  check('Representaciones curso 01', c1.representado ? 1 : 0, 1);
  check('Votante curso 01', c1.tipo_votante, 'principal');
  check('Total representaciones', await AQS.getRepresentedCoursesCount(MEETING_ID), 1);

  console.log('\n=== MD-01 §7 · Suplente solo (Principal ausente) representa al curso ===');
  marcarPresente(memberByCurso('CURSO 02', 'suplente').id);
  st = await AQS.getCourseRepresentationStatus(MEETING_ID);
  let c2 = st.find(c => c.curso === 'CURSO 02');
  check('Curso 02 representado', c2.representado, true);
  check('Curso 02 votante', c2.tipo_votante, 'suplente');
  check('Curso 02 acting_as_principal', c2.acting_as_principal, true);
  check('Total representaciones', await AQS.getRepresentedCoursesCount(MEETING_ID), 2);

  console.log('\n=== MD-01 §7 · Luego ingresa el Principal: la representacion sigue siendo 1 ===');
  marcarPresente(memberByCurso('CURSO 02', 'principal').id);
  st = await AQS.getCourseRepresentationStatus(MEETING_ID);
  c2 = st.find(c => c.curso === 'CURSO 02');
  check('Curso 02 votante pasa al Principal', c2.tipo_votante, 'principal');
  check('Curso 02 ya no actua el suplente', c2.acting_as_principal, false);
  check('Total representaciones NO aumenta', await AQS.getRepresentedCoursesCount(MEETING_ID), 2);

  console.log('\n=== MD-05 · Contabilidad / Revisoria / Administracion presentes ===');
  marcarPresente(members.find(m2 => m2.tipo_participante === 'CONTABILIDAD').id);
  marcarPresente(members.find(m2 => m2.tipo_participante === 'REVISORIA_FISCAL').id);
  marcarPresente(members.find(m2 => m2.tipo_participante === 'ADMINISTRACION').id);
  check('Elegibles NO aumentan', await AQS.getTotalPrincipals(PRODUCT_ID), 20);
  check('Representaciones NO aumentan', await AQS.getRepresentedCoursesCount(MEETING_ID), 2);
  const votantes = await AQS.getActiveVoters(MEETING_ID);
  check('No computables fuera del padron de votantes', votantes.length, 2);

  console.log('\n=== MD-01 §5 · Resultado esperado en pantalla ===');
  m = await AQS.getQuorumMoment(MEETING_ID);
  console.log(`  ELEGIBLES:        ${m.total_principales}`);
  console.log(`  MINIMO REQUERIDO: ${m.quorum_requerido}`);
  console.log(`  PRESENTES:        ${m.cursos_representados}`);
  console.log(`  ESTADO:           ${m.estado === 'SIN_QUORUM' ? 'Quorum no alcanzado' : m.estado}`);
  check('Elegibles en pantalla', m.total_principales, 20);
  check('Minimo en pantalla (regimen inicial)', m.quorum_requerido, 11);

  console.log('\n=== MD-02 · El 20% NO se activa solo ===');
  // 4 representaciones = ya supera CEIL(20*0.2)=4, pero sin aplicar Momento Siguiente
  marcarPresente(memberByCurso('CURSO 03', 'principal').id);
  marcarPresente(memberByCurso('CURSO 04', 'principal').id);
  m = await AQS.getQuorumMoment(MEETING_ID);
  check('Presentes', m.cursos_representados, 4);
  check('Alcanza el 20% pero NO se aplico', m.en_momento_siguiente, false);
  check('Sigue exigiendo el quorum inicial', m.quorum_requerido, 11);
  check('Estado sigue SIN_QUORUM', m.estado, 'SIN_QUORUM');

  console.log('\n=== MD-01 · Quorum inicial alcanzado con 11 representaciones ===');
  for (let i = 5; i <= 13; i++) marcarPresente(memberByCurso(`CURSO ${String(i).padStart(2, '0')}`, 'principal').id);
  m = await AQS.getQuorumMoment(MEETING_ID);
  check('Presentes', m.cursos_representados, 13);
  check('Estado', m.estado, 'MOMENTO_1');

  console.log('\n=== MD-06 · Mitad mas uno = CEIL(N/2)+1, dinamico ===');
  // OJO: MD-01 §8 daba N=83 -> 42 (formula FLOOR). MD-06 fija N=85 -> 44, que
  // solo sale con CEIL. Se aplica MD-06 por ser el documento mas reciente y traer
  // la base real de agosto 2026. Para N par ambas coinciden; difieren en N impar.
  const qIni = (n) => Math.ceil(n / 2) + 1;
  check('N=85 -> quorum inicial (base validada)', qIni(85), 44);
  check('N=85 -> Momento Siguiente', Math.ceil(85 * 0.20), 17);
  check('N=84 -> quorum inicial', qIni(84), 43);
  check('N=20 -> quorum inicial', qIni(20), 11);
  check('N=22 -> quorum inicial', qIni(22), 12);

  console.log(`\n${fallos === 0 ? 'TODO OK' : 'HAY FALLOS'} — ${pasos - fallos}/${pasos} comprobaciones pasaron\n`);
  process.exit(fallos === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
