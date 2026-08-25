/**
 * Prueba MD-09 — Contingencia: Delegado no encontrado por identificación.
 *
 * Verifica que la solicitud no afecte el quórum mientras esté pendiente, que el
 * operador (no la persona) asigne curso y rol, que se corrija el registro
 * existente en vez de duplicar la identidad, y que un curso nunca genere más de
 * una representación.
 *
 * BD simulada en memoria. No toca Supabase.
 */
// Se corre en modo PostgreSQL, que es como opera produccion (Supabase/Render):
// condiciones active = true y RETURNING id en los INSERT.
process.env.DB_TYPE = 'postgresql';

const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src');

const PRODUCT_ID = 4, CLIENT_ID = 1, MEETING_ID = 75;

let members = [], attendance = [], quorumLog = [];
let mSeq = 1, aSeq = 1;

function principal(curso, doc, nombre) {
  members.push({ id: mSeq++, client_id: CLIENT_ID, product_id: PRODUCT_ID, name: nombre,
    member_type: 'principal', numero_documento: doc, secondary_document: null,
    rol_organico: curso, tipo_participante: 'PRINCIPAL', principal_id: null, active: true });
  return members[members.length - 1];
}
function suplente(curso, doc, nombre) {
  members.push({ id: mSeq++, client_id: CLIENT_ID, product_id: PRODUCT_ID, name: nombre,
    member_type: 'suplente', numero_documento: doc, secondary_document: null,
    rol_organico: curso, tipo_participante: 'SUPLENTE', principal_id: null, active: true });
  return members[members.length - 1];
}
function solicitud({ doc, nombre, curso }) {
  attendance.push({ id: aSeq++, meeting_id: MEETING_ID, member_id: null, status: 'present',
    pending_approval: true, manual_name: nombre, manual_document: doc, manual_curso: curso,
    manual_position: 'PENDIENTE VALIDAR', manual_motivo: 'Identificación no encontrada',
    contingencia: true, created_at: new Date() });
  return attendance[attendance.length - 1];
}
function presente(memberId) {
  attendance.push({ id: aSeq++, meeting_id: MEETING_ID, member_id: memberId, status: 'present',
    pending_approval: false, created_at: new Date() });
}

// ── Maestro de prueba: 4 cursos con Principal, uno con Suplente ──────────────
principal('QUINTO A', '111', 'ARIAS MARIA');
principal('QUINTO B', '222', 'PEREZ MARIA HELENA');   // cedula mal digitada a proposito
principal('QUINTO C', '333', 'GOMEZ ANA');
principal('QUINTO D', '444', 'RUIZ LUISA');
suplente('QUINTO A', '555', 'SOTO CARLA');

const fakeDb = {
  async execute(sql, params = []) {
    const q = sql.replace(/\s+/g, ' ').trim();

    if (q.startsWith('SELECT id, client_id, product_id, type FROM meetings')) {
      return [[{ id: MEETING_ID, client_id: CLIENT_ID, product_id: PRODUCT_ID, type: 'asamblea' }]];
    }
    if (q.startsWith('SELECT id, product_id, client_id, type, status FROM meetings')) {
      return [[{ id: MEETING_ID, product_id: PRODUCT_ID, client_id: CLIENT_ID, type: 'asamblea', status: 'scheduled' }]];
    }
    if (q.includes('FROM meetings WHERE id')) {
      return [[{ id: MEETING_ID, client_id: CLIENT_ID, product_id: PRODUCT_ID, date: new Date(), date_wall: null, type: 'asamblea', status: 'scheduled' }]];
    }
    if (q.startsWith('SELECT * FROM attendance WHERE id')) {
      return [attendance.filter(a => a.id === Number(params[0]))];
    }
    if (q.includes('FROM attendance a WHERE a.meeting_id')) {
      return [attendance.filter(a => a.meeting_id === Number(params[0]) && a.pending_approval && a.member_id == null)];
    }
    // Solo el maestro que pide listPending. Se ancla al SELECT exacto porque
    // 'FROM members m WHERE m.product_id' tambien aparece en el COUNT del universo
    // y en el DISTINCT de cursos, que deben responder otra cosa.
    if (q.startsWith('SELECT m.id, m.name, m.numero_documento')) {
      return [members.filter(m => m.product_id === Number(params[0]) && m.active)];
    }
    if (q.startsWith('SELECT id, name, numero_documento, rol_organico, member_type, active FROM members WHERE id')) {
      return [members.filter(m => m.id === Number(params[0]) && m.product_id === Number(params[1]))];
    }
    if (q.startsWith('SELECT id, name FROM members WHERE product_id')) {
      const curso = params[2];
      return [members.filter(m => m.product_id === Number(params[0]) && m.member_type === params[1]
        && String(m.rol_organico).toUpperCase().trim() === curso && m.active)];
    }
    if (q.startsWith('SELECT id FROM members WHERE numero_documento')) {
      return [members.filter(m => m.numero_documento === params[0] && m.product_id === Number(params[1]))];
    }
    if (q.startsWith('SELECT id FROM members WHERE product_id') && q.includes("'principal'")) {
      const curso = params[1];
      return [members.filter(m => m.product_id === Number(params[0]) && m.member_type === 'principal'
        && String(m.rol_organico).toUpperCase().trim() === curso && m.active)];
    }
    if (q.startsWith('UPDATE members SET numero_documento')) {
      const m = members.find(x => x.id === Number(params[1]));
      if (m) { m.numero_documento = params[0]; m.active = true; }
      return [{}];
    }
    if (q.startsWith('UPDATE members SET name =')) {
      const m = members.find(x => x.id === Number(params[4]));
      if (m) { m.name = params[0]; m.rol_organico = params[1]; m.member_type = params[2]; m.tipo_participante = params[3]; m.active = true; }
      return [{}];
    }
    if (q.startsWith('UPDATE members SET active')) {
      const m = members.find(x => x.id === Number(params[0]));
      if (m) m.active = true;
      return [{}];
    }
    if (q.startsWith('UPDATE members SET principal_id')) {
      const m = members.find(x => x.id === Number(params[1]));
      if (m) m.principal_id = params[0];
      return [{}];
    }
    if (q.startsWith('INSERT INTO members')) {
      members.push({ id: mSeq++, client_id: params[0], product_id: params[1], name: params[2],
        member_type: params[3], numero_documento: params[4], rol_organico: params[5],
        tipo_participante: params[6], secondary_document: null, principal_id: null, active: true });
      return [[{ id: mSeq - 1 }]];
    }
    if (q.startsWith('UPDATE attendance SET member_id')) {
      const a = attendance.find(x => x.id === Number(params[5]));
      if (a) {
        a.member_id = params[0]; a.pending_approval = false; a.status = 'present';
        a.manual_curso = params[1]; a.manual_rol = params[2];
        a.decision = 'aprobado'; a.decision_motivo = params[3]; a.approved_by = params[4];
        a.contingencia = true;
      }
      return [{}];
    }
    if (q.startsWith('UPDATE attendance SET pending_approval')) {
      const a = attendance.find(x => x.id === Number(params[2]));
      if (a) {
        a.pending_approval = false; a.status = 'rejected'; a.member_id = null;
        a.decision = 'rechazado'; a.decision_motivo = params[0]; a.approved_by = params[1];
      }
      return [{}];
    }
    // Motor de quorum
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
        .map(m => ({ member_id: m.id, acting_as_principal: false, name: m.name, member_type: m.member_type, rol_organico: m.rol_organico }));
      return [rows];
    }
    if (q.includes('representation_powers')) throw new Error('no existe');
    if (q.includes('assembly_moment_events')) throw new Error('no existe');
    if (q.startsWith('INSERT INTO quorum_log')) { quorumLog.push(params[1]); return [{ insertId: 1 }]; }
    return [[]];
  }
};
const dbPath = path.join(SRC, 'config/database.js');
require.cache[require.resolve(dbPath)] = { id: dbPath, filename: dbPath, loaded: true, exports: fakeDb };

const CS = require(path.join(SRC, 'services/assemblyContingencyService.js'));
const AQS = require(path.join(SRC, 'services/assemblyQuorumService.js'));

let fallos = 0, pasos = 0;
function check(n, real, esp) {
  pasos++;
  const ok = JSON.stringify(real) === JSON.stringify(esp);
  if (!ok) { fallos++; console.log(`  FALLO  ${n}: esperado ${JSON.stringify(esp)}, obtuvo ${JSON.stringify(real)}`); }
  else console.log(`  ok     ${n} = ${JSON.stringify(real)}`);
}
const OPERADOR = { id: 9, name: 'Nohora Paez', email: 'n@a.com', role: 'admin' };

(async () => {
  console.log('\n=== MD-09 §5 · La solicitud pendiente no afecta el quorum ===');
  check('Universo inicial', await AQS.getTotalPrincipals(PRODUCT_ID), 4);
  const s1 = solicitud({ doc: '999', nombre: 'PEREZ MARIA HELENA', curso: 'QUINTO B' });
  check('Representaciones con la solicitud pendiente', await AQS.getRepresentedCoursesCount(MEETING_ID), 0);
  check('El universo no cambia', await AQS.getTotalPrincipals(PRODUCT_ID), 4);

  console.log('\n=== MD-09 §4 · La persona NO se autodeclara Principal ni Suplente ===');
  const pend = await CS.listPending(MEETING_ID);
  check('Solicitudes pendientes', pend.length, 1);
  check('Estado', pend[0].estado, 'PENDIENTE_DE_VALIDACION');
  check('No cuenta para quorum', pend[0].cuenta_para_quorum, false);
  check('No puede votar', pend[0].puede_votar, false);
  check('La solicitud no trae rol asignado', pend[0].rol, undefined);

  console.log('\n=== MD-09 §9 · Sugiere el registro existente para no duplicar identidad ===');
  const sug = pend[0].posibles_coincidencias;
  check('Hay coincidencias sugeridas', sug.length > 0, true);
  check('La primera es el Principal de QUINTO B', sug[0].rol_organico, 'QUINTO B');
  console.log('  motivos: ' + sug[0].motivos.join(', '));

  console.log('\n=== MD-09 §7 · Aprobar exige motivo ===');
  try {
    await CS.approve(s1.id, OPERADOR, { member_id: sug[0].member_id, motivo: '' });
    check('Sin motivo', 'no fallo', 'MOTIVO_REQUERIDO');
  } catch (e) { check('Sin motivo se rechaza', e.code, 'MOTIVO_REQUERIDO'); }

  console.log('\n=== MD-09 §9 · Al aprobar se corrige el registro, no se duplica ===');
  const totalAntes = members.length;
  const r1 = await CS.approve(s1.id, OPERADOR, {
    member_id: sug[0].member_id,
    motivo: 'Cedula mal digitada en el maestro, verificada contra documento fisico'
  });
  check('Decision', r1.decision, 'aprobado');
  check('NO se creo una segunda identidad', members.length, totalAntes);
  check('Se corrigio el documento', members.find(m => m.id === sug[0].member_id).numero_documento, '999');
  check('Rol tomado del maestro', r1.rol, 'principal');
  check('Curso tomado del maestro', r1.curso, 'QUINTO B');
  check('Quedo trazada la correccion', r1.correccion_maestro.campo, 'numero_documento');

  console.log('\n=== MD-09 §8 · Aprobado como Principal ocupa la representacion ===');
  check('Representaciones tras aprobar', await AQS.getRepresentedCoursesCount(MEETING_ID), 1);

  console.log('\n=== MD-09 §8 · Un curso nunca genera mas de una representacion ===');
  presente(members.find(m => m.rol_organico === 'QUINTO A' && m.member_type === 'principal').id);
  presente(members.find(m => m.rol_organico === 'QUINTO A' && m.member_type === 'suplente').id);
  check('QUINTO A con Principal y Suplente presentes', await AQS.getRepresentedCoursesCount(MEETING_ID), 2);

  console.log('\n=== MD-09 §7 · Aprobar como Delegado nuevo, con rol que define el operador ===');
  const s2 = solicitud({ doc: '777', nombre: 'TORRES ELENA', curso: 'QUINTO E' });
  try {
    await CS.approve(s2.id, OPERADOR, { curso: 'QUINTO E', rol: '', motivo: 'x' });
    check('Sin rol', 'no fallo', 'ROL_REQUERIDO');
  } catch (e) { check('Sin rol se rechaza', e.code, 'ROL_REQUERIDO'); }

  const r2 = await CS.approve(s2.id, OPERADOR, {
    curso: 'QUINTO E', rol: 'principal', motivo: 'Delegada acreditada, faltaba en la carga'
  });
  check('Incorporada al maestro', r2.member_id > 0, true);
  check('Curso asignado', r2.curso, 'QUINTO E');
  check('Rol asignado por el operador', r2.rol, 'principal');
  check('El universo crece a 5', await AQS.getTotalPrincipals(PRODUCT_ID), 5);
  check('Representaciones', await AQS.getRepresentedCoursesCount(MEETING_ID), 3);

  console.log('\n=== MD-09 §9 · No se puede crear un segundo Principal del mismo curso ===');
  const s3 = solicitud({ doc: '888', nombre: 'OTRA PERSONA', curso: 'QUINTO A' });
  try {
    await CS.approve(s3.id, OPERADOR, { curso: 'QUINTO A', rol: 'principal', motivo: 'prueba' });
    check('Curso ocupado', 'no fallo', 'CURSO_YA_OCUPADO');
  } catch (e) { check('Curso ocupado se rechaza', e.code, 'CURSO_YA_OCUPADO'); }

  console.log('\n=== MD-09 §7 · Rechazar: la persona no adquiere condicion de Delegado ===');
  const r3 = await CS.reject(s3.id, OPERADOR, { motivo: 'No figura en el listado de la Asamblea' });
  check('Decision', r3.decision, 'rechazado');
  check('Representaciones no cambian', await AQS.getRepresentedCoursesCount(MEETING_ID), 3);
  check('Sin member_id', attendance.find(a => a.id === s3.id).member_id, null);
  check('Estado rechazado', attendance.find(a => a.id === s3.id).status, 'rejected');

  console.log('\n=== MD-09 · No se puede decidir dos veces ===');
  try {
    await CS.reject(s3.id, OPERADOR, { motivo: 'otra vez' });
    check('Segunda decision', 'no fallo', 'YA_RESUELTA');
  } catch (e) { check('Segunda decision se rechaza', e.code, 'YA_RESUELTA'); }

  console.log('\n=== MD-09 §11-12 · Trazabilidad e identificacion como contingencia ===');
  check('Evento de aprobacion', quorumLog.includes('CONTINGENCIA_APROBADA'), true);
  check('Evento de rechazo', quorumLog.includes('CONTINGENCIA_RECHAZADA'), true);
  const aprobada = attendance.find(a => a.id === s1.id);
  check('Marcada como contingencia', aprobada.contingencia, true);
  check('Motivo guardado', !!aprobada.decision_motivo, true);
  check('Usuario que decidio', aprobada.approved_by, 9);

  console.log(`\n${fallos === 0 ? 'TODO OK' : 'HAY FALLOS'} — ${pasos - fallos}/${pasos} comprobaciones pasaron\n`);
  process.exit(fallos === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
