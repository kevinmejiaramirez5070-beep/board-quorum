/**
 * Pruebas MD-15 y MD-10 (identidad) — reporte de votaciones del 26 de agosto.
 *
 * Reproduce los tres casos reales:
 *   1. Principal de CUARTO C vota.                                    (PASA)
 *   2. Suplente de CUARTO C bloqueado con el Principal presente,
 *      con la causa REAL, no un mensaje de Junta Directiva.
 *   3. CUARTO F — Suplente valida sin Principal en el maestro: DEBE votar.
 *   4. TERCERO J — la segunda cedula muestra SU identidad, no la de la
 *      primera persona de la fila.
 *
 * BD simulada en memoria. No toca Supabase.
 */
process.env.DB_TYPE = 'postgresql';

const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src');

const PRODUCT_ID = 4, CLIENT_ID = 1, MEETING_ID = 81, VOTING_ID = 500;

let members = [], attendance = [], votes = [];
let mSeq = 1, aSeq = 1, vSeq = 1;

function add(curso, tipo, nombre, doc, doc2, nombre2) {
  members.push({ id: mSeq++, client_id: CLIENT_ID, product_id: PRODUCT_ID, name: nombre,
    member_type: tipo, numero_documento: doc,
    secondary_document: doc2 || null, secondary_name: nombre2 || null,
    rol_organico: curso, tipo_participante: tipo === 'suplente' ? 'SUPLENTE' : 'PRINCIPAL',
    // El importador marca puede_votar = false en TODO suplente. Esa es la
    // trampa que bloqueaba a la suplente de CUARTO F.
    puede_votar: tipo === 'principal', cuenta_quorum: tipo === 'principal',
    principal_id: null, active: true });
  return members[members.length - 1];
}
function presente(m) {
  attendance.push({ id: aSeq++, meeting_id: MEETING_ID, member_id: m.id, status: 'present', pending_approval: false });
}
function votar(m) { votes.push({ id: vSeq++, voting_id: VOTING_ID, member_id: m.id }); }

// Datos reales del reporte
const panche  = add('CUARTO C', 'principal', 'CAMILO ANDRES PANCHE', '1072647375');
const esneider = add('CUARTO C', 'suplente',  'CORDOBA ROA ESNEIDER', '83235747');
const nancy   = add('CUARTO F', 'suplente',  'SANCHEZ GONZALEZ NANCY PILAR', '1015400791');
const mongui  = add('TERCERO J', 'principal', 'MONGUI MICHAEL ANDRES', '1014207966', '1014218012', 'ANGELA SUAREZ');
const soloSup = add('QUINTO Z', 'principal', 'PRINCIPAL AUSENTE', '999001');
const supZ    = add('QUINTO Z', 'suplente',  'SUPLENTE DE QUINTO Z', '999002');
const contab  = add('CONTABILIDAD', 'principal', 'LA CONTADORA', '999003');
contab.tipo_participante = 'CONTABILIDAD';

const norm = (v) => String(v ?? '').replace(/\D/g, '');

const fakeDb = {
  async execute(sql, params = []) {
    const q = sql.replace(/\s+/g, ' ').trim();

    if (q.startsWith('SELECT id, product_id, client_id, type, status FROM meetings')) {
      return [[{ id: MEETING_ID, product_id: PRODUCT_ID, client_id: CLIENT_ID, type: 'asamblea', status: 'scheduled' }]];
    }
    if (q.startsWith('SELECT DISTINCT rol_organico FROM members') && q.includes("IN ('principal', 'suplente')")) {
      const set = new Set(members.filter(m => m.product_id === Number(params[0]) && m.active && m.rol_organico
        && !['CONTABILIDAD'].includes(String(m.tipo_participante).toUpperCase())).map(m => m.rol_organico));
      return [[...set].map(rol_organico => ({ rol_organico }))];
    }
    if (q.startsWith('SELECT DISTINCT rol_organico FROM members')) {
      const set = new Set(members.filter(m => m.product_id === Number(params[0]) && m.member_type === 'principal' && m.active && m.rol_organico
        && !['CONTABILIDAD'].includes(String(m.tipo_participante).toUpperCase())).map(m => m.rol_organico));
      return [[...set].map(rol_organico => ({ rol_organico }))];
    }
    if (q.startsWith('SELECT COUNT(*) AS n FROM members m')) {
      return [[{ n: members.filter(m => m.product_id === Number(params[0]) && m.member_type === 'principal' && m.active).length }]];
    }
    if (q.includes('FROM attendance a JOIN members m')) {
      const byId = new Map(members.map(m => [m.id, m]));
      return [attendance.filter(a => a.meeting_id === Number(params[0]) && a.status === 'present' && !a.pending_approval)
        .map(a => byId.get(a.member_id))
        .filter(m => m && m.product_id === Number(params[1]) && m.active
          && !['CONTABILIDAD'].includes(String(m.tipo_participante).toUpperCase()))
        .map(m => ({ member_id: m.id, acting_as_principal: false, name: m.name,
          member_type: m.member_type, rol_organico: m.rol_organico, numero_documento: m.numero_documento }))];
    }
    if (q.startsWith('SELECT v.id, m.name, m.numero_documento FROM votes v')) {
      const byId = new Map(members.map(m => [m.id, m]));
      const curso = params[2];
      const hit = votes.filter(v => v.voting_id === Number(params[0]))
        .map(v => ({ v, m: byId.get(v.member_id) }))
        .filter(x => x.m && x.m.product_id === Number(params[1])
          && String(x.m.rol_organico).toUpperCase().trim() === curso && x.m.active);
      return [hit.slice(0, 1).map(x => ({ id: x.v.id, name: x.m.name, numero_documento: x.m.numero_documento }))];
    }
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

const AVS = require(path.join(SRC, 'services/assemblyVotingService.js'));
const Member = require(path.join(SRC, 'models/Member.js'));

const elegir = (member) => AVS.checkEligibility({ votingId: VOTING_ID, meetingId: MEETING_ID, member });

let fallos = 0, pasos = 0;
function check(n, real, esp) {
  pasos++;
  const ok = JSON.stringify(real) === JSON.stringify(esp);
  if (!ok) { fallos++; console.log(`  FALLO  ${n}: esperado ${JSON.stringify(esp)}, obtuvo ${JSON.stringify(real)}`); }
  else console.log(`  ok     ${n} = ${JSON.stringify(real)}`);
}

(async () => {
  console.log('\n=== Caso 1 · Principal de CUARTO C vota (PASA) ===');
  presente(panche);
  presente(esneider);
  let r = await elegir(panche);
  check('Principal habilitado', r.permitido, true);
  check('Status', r.status, 'OK');

  console.log('\n=== Caso 2 · Suplente de CUARTO C con Principal presente ===');
  r = await elegir(esneider);
  check('Suplente bloqueado', r.permitido, false);
  check('Status', r.status, 'SUPLENTE_SIN_VOTO');
  check('El motivo nombra el curso', r.curso, 'CUARTO C');
  check('Y dice quien ejerce', r.representante, 'CAMILO ANDRES PANCHE');
  check('El mensaje NO habla de Junta Directiva', /Junta Directiva/i.test(r.mensaje), false);
  check('El mensaje explica la causa real', /Principal .* est[aá] presente/i.test(r.mensaje), true);
  console.log('  mensaje: ' + r.mensaje);

  console.log('\n=== Caso 3 · CUARTO F — Suplente sin Principal en el maestro (CRITICO) ===');
  presente(nancy);
  check('El importador la marco sin voto', nancy.puede_votar, false);
  r = await elegir(nancy);
  check('AUN ASI queda habilitada', r.permitido, true);
  check('Status', r.status, 'SUPLENTE_ACTUANDO');
  check('El mensaje explica que el curso no tiene Principal',
    /no tiene un Delegado Principal/i.test(r.mensaje), true);
  console.log('  mensaje: ' + r.mensaje);

  console.log('\n=== Caso 3b · Suplente con Principal ausente (no inexistente) ===');
  presente(supZ);   // el principal de QUINTO Z no asiste
  r = await elegir(supZ);
  check('Habilitado', r.permitido, true);
  check('Status', r.status, 'SUPLENTE_ACTUANDO');
  check('El mensaje dice que el Principal no se encuentra presente',
    /no se encuentra\s+presente/i.test(r.mensaje), true);

  console.log('\n=== Un solo voto por curso ===');
  votar(panche);
  r = await elegir(esneider);
  check('Tras votar el Principal, el Suplente sigue bloqueado', r.permitido, false);
  check('Ahora por voto ya emitido', r.status, 'ALREADY_VOTED');
  check('El mensaje nombra a quien voto', /CAMILO ANDRES PANCHE/.test(r.mensaje), true);

  console.log('\n=== Prueba 2 del MD · el Principal llega DESPUES de que voto el Suplente ===');
  votar(supZ);
  const principalZ = members.find(m => m.rol_organico === 'QUINTO Z' && m.member_type === 'principal');
  presente(principalZ);
  r = await elegir(principalZ);
  check('El curso no admite un segundo voto', r.permitido, false);
  check('Status', r.status, 'ALREADY_VOTED');

  console.log('\n=== Participante no computable ===');
  presente(contab);
  r = await elegir(contab);
  check('Contabilidad no vota', r.permitido, false);
  check('Status', r.status, 'NO_VOTE');
  check('Sin mencionar Junta Directiva', /Junta Directiva/i.test(r.mensaje), false);

  console.log('\n=== Caso 4 · MD-10 identidad exacta (TERCERO J) ===');
  const porPrimera = await Member.findByDocumentNumber('1014207966', CLIENT_ID);
  const porSegunda = await Member.findByDocumentNumber('1014218012', CLIENT_ID);
  check('Ambas cedulas resuelven el mismo registro', porPrimera.id === porSegunda.id, true);

  const idPrimera = AVS.identidadExacta(porPrimera);
  const idSegunda = AVS.identidadExacta(porSegunda);
  check('Con la primera cedula se muestra MONGUI', idPrimera.name, 'MONGUI MICHAEL ANDRES');
  check('Con la segunda cedula se muestra ANGELA', idSegunda.name, 'ANGELA SUAREZ');
  check('Y su documento es el que ingreso', idSegunda.numero_documento, '1014218012');
  check('La representacion sigue siendo del mismo nucleo', idSegunda.nucleo_titular, 'MONGUI MICHAEL ANDRES');
  check('La identidad NO fue sustituida', idSegunda.name === idPrimera.name, false);

  console.log(`\n${fallos === 0 ? 'TODO OK' : 'HAY FALLOS'} — ${pasos - fallos}/${pasos} comprobaciones pasaron\n`);
  process.exit(fallos === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
