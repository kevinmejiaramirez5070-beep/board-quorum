/**
 * Prueba MD-02 — Momento Siguiente, con BD simulada.
 * Foco: la ventana NO se cuenta desde el clic, sino desde la hora convocada.
 */
const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src');

const PRODUCT_ID = 7, MEETING_ID = 99;
// Convocatoria: hace 5 minutos. La ventana sigue abierta (convocatoria + 1 hora).
const HORA_OFICIAL = new Date(Date.now() - 5 * 60 * 1000);

let members = [], id = 1;
const CURSOS = Array.from({ length: 20 }, (_, i) => `CURSO ${String(i + 1).padStart(2, '0')}`);
for (const curso of CURSOS) {
  members.push({ id: id++, product_id: PRODUCT_ID, member_type: 'principal', rol_organico: curso, active: true, tipo_participante: null, name: `Principal ${curso}` });
  members.push({ id: id++, product_id: PRODUCT_ID, member_type: 'suplente', rol_organico: curso, active: true, tipo_participante: null, name: `Suplente ${curso}` });
}
const byId = new Map(members.map(m => [m.id, m]));
let attendance = [];
let momentRows = [];
let momentSeq = 1;
let quorumLog = [];

const presente = (curso, tipo) => {
  const m = members.find(x => x.rol_organico === curso && x.member_type === tipo);
  attendance.push({ meeting_id: MEETING_ID, member_id: m.id, status: 'present', pending_approval: false });
};

const fakeDb = {
  async execute(sql, params = []) {
    const q = sql.replace(/\s+/g, ' ').trim();

    if (q.startsWith('SELECT id, product_id, client_id, type, status FROM meetings')) {
      return [[{ id: MEETING_ID, product_id: PRODUCT_ID, client_id: 1, type: 'asamblea', status: 'scheduled' }]];
    }
    if (q.includes('FROM meetings WHERE id')) {
      return [[{ id: MEETING_ID, client_id: 1, product_id: PRODUCT_ID, title: 'TEST ASAMBLEA NRO 1', date: HORA_OFICIAL, type: 'asamblea', status: 'scheduled' }]];
    }
    if (q.startsWith('SELECT DISTINCT rol_organico FROM members')) {
      const set = new Set(members.filter(m => m.product_id === params[0] && m.member_type === 'principal' && m.active).map(m => m.rol_organico));
      return [[...set].map(rol_organico => ({ rol_organico }))];
    }
    if (q.startsWith('SELECT COUNT(*) AS n FROM members')) {
      return [[{ n: members.filter(m => m.product_id === params[0] && m.member_type === 'principal' && m.active).length }]];
    }
    if (q.includes('FROM attendance a JOIN members m')) {
      const rows = attendance.filter(a => a.meeting_id === params[0] && a.status === 'present' && !a.pending_approval)
        .map(a => byId.get(a.member_id))
        .filter(m => m && m.product_id === params[1] && m.active)
        .map(m => ({ member_id: m.id, acting_as_principal: false, name: m.name, member_type: m.member_type, rol_organico: m.rol_organico }));
      return [rows];
    }
    if (q.includes('representation_powers')) throw new Error('no existe');

    if (q.startsWith('SELECT * FROM assembly_moment_events')) {
      const rows = momentRows.filter(r => r.meeting_id === params[0]).sort((a, b) => b.id - a.id).slice(0, 1);
      return [rows];
    }
    if (q.startsWith('INSERT INTO assembly_moment_events')) {
      const [meeting_id, operator_id, operator_name, operator_role, applied_at,
             hora_oficial, hora_limite, elegibles, quorum_inicial,
             presentes_al_aplicar, quorum_momento_siguiente] = params;
      momentRows.push({
        id: momentSeq++, meeting_id, operator_id, operator_name, operator_role, applied_at,
        hora_oficial, hora_limite, elegibles, quorum_inicial, presentes_al_aplicar,
        quorum_momento_siguiente, alcanzado: false, alcanzado_at: null,
        presentes_al_alcanzar: null, cerrado_sin_quorum: false, cerrado_at: null
      });
      return [{ insertId: momentSeq - 1 }];
    }
    if (q.startsWith('UPDATE assembly_moment_events')) {
      const rowId = params[params.length - 1];
      const row = momentRows.find(r => r.id === rowId);
      if (q.includes('alcanzado =')) { row.alcanzado = true; row.alcanzado_at = params[0]; row.presentes_al_alcanzar = params[1]; }
      if (q.includes('cerrado_sin_quorum =')) { row.cerrado_sin_quorum = true; row.cerrado_at = params[0]; row.presentes_al_alcanzar = params[1]; }
      return [{}];
    }
    if (q.startsWith('INSERT INTO quorum_log')) { quorumLog.push(params[1]); return [{ insertId: 1 }]; }
    return [[]];
  }
};
const dbPath = path.join(SRC, 'config/database.js');
require.cache[require.resolve(dbPath)] = { id: dbPath, filename: dbPath, loaded: true, exports: fakeDb };

const MS = require(path.join(SRC, 'services/assemblyMomentService.js'));

let fallos = 0, pasos = 0;
function check(n, real, esp) {
  pasos++;
  const ok = JSON.stringify(real) === JSON.stringify(esp);
  if (!ok) { fallos++; console.log(`  FALLO  ${n}: esperado ${JSON.stringify(esp)}, obtuvo ${JSON.stringify(real)}`); }
  else console.log(`  ok     ${n} = ${JSON.stringify(real)}`);
}
const hhmm = (d) => d ? new Date(d).toTimeString().slice(0, 5) : '—';

(async () => {
  console.log('\n=== MD-02 · Confirmacion obligatoria (MD-03 §8) ===');
  try {
    await MS.applyMomentoSiguiente(MEETING_ID, { id: 5, name: 'Nohora', role: 'admin' }, { confirmado: false });
    check('Sin confirmar debe fallar', 'no fallo', 'CONFIRMACION_REQUERIDA');
  } catch (e) { check('Sin confirmar se rechaza', e.code, 'CONFIRMACION_REQUERIDA'); }

  console.log('\n=== MD-02 §5 · Aplicacion: el universo NO cambia, solo el minimo ===');
  presente('CURSO 01', 'principal');
  presente('CURSO 02', 'principal');
  presente('CURSO 03', 'suplente');
  const st = await MS.applyMomentoSiguiente(MEETING_ID, { id: 5, name: 'Nohora Paez', role: 'admin' }, { confirmado: true });
  check('Aplicado', st.aplicado, true);
  check('Elegibles (no cambian)', st.elegibles, 20);
  check('Quorum inicial registrado', st.quorum_inicial, 11);
  check('Nuevo minimo CEIL(20*0.20)', st.quorum_momento_siguiente, 4);
  check('Presentes al aplicar', st.presentes_al_aplicar, 3);
  check('Aplicado por', st.aplicado_por_nombre, 'Nohora Paez');
  check('Rol registrado', st.aplicado_por_rol, 'admin');

  console.log('\n=== MD-02 §6 · El boton NO inicia una hora nueva ===');
  console.log(`  Hora convocada:      ${hhmm(st.hora_oficial)}`);
  console.log(`  Hora de aplicacion:  ${hhmm(st.aplicado_at)}`);
  console.log(`  Hora limite:         ${hhmm(st.hora_limite)}`);
  check('Hora oficial = convocatoria', hhmm(st.hora_oficial), hhmm(HORA_OFICIAL));
  check('Hora limite = convocatoria + 1h',
    hhmm(st.hora_limite), hhmm(new Date(HORA_OFICIAL.getTime() + 60 * 60 * 1000)));
  const limiteDesdeClic = new Date(new Date(st.aplicado_at).getTime() + 60 * 60 * 1000);
  check('La hora limite NO se conto desde el clic',
    new Date(st.hora_limite).getTime() === limiteDesdeClic.getTime(), false);

  console.log('\n=== MD-02 §10 · Al alcanzar el 20% queda la hora exacta ===');
  check('Aun no alcanzado (3 < 4)', st.alcanzado, false);
  presente('CURSO 04', 'principal');
  await MS.evaluateMomentOutcome(MEETING_ID);
  const st2 = await MS.getMomentState(MEETING_ID);
  check('Alcanzado con la 4a representacion', st2.alcanzado, true);
  check('Presentes al alcanzarlo', st2.presentes_al_alcanzar, 4);
  check('Quedo hora exacta', !!st2.alcanzado_at, true);

  console.log('\n=== MD-02 §5 · Un curso no aporta dos representaciones ===');
  presente('CURSO 01', 'suplente'); // principal ya estaba presente
  await MS.evaluateMomentOutcome(MEETING_ID);
  const AQS = require(path.join(SRC, 'services/assemblyQuorumService.js'));
  check('Representaciones siguen en 4', await AQS.getRepresentedCoursesCount(MEETING_ID), 4);

  console.log('\n=== MD-02 · No se puede aplicar dos veces ===');
  try {
    await MS.applyMomentoSiguiente(MEETING_ID, { id: 6, name: 'Otro', role: 'authorized' }, { confirmado: true });
    check('Segunda aplicacion', 'no fallo', 'YA_APLICADO');
  } catch (e) { check('Segunda aplicacion se rechaza', e.code, 'YA_APLICADO'); }

  console.log('\n=== MD-02 §11 · Vence la ventana sin alcanzar el minimo ===');
  momentRows = []; attendance = []; momentSeq = 1;
  presente('CURSO 01', 'principal');
  // Se aplica con la ventana abierta (convocada hace 55 min) y solo 1 representacion.
  HORA_OFICIAL.setTime(Date.now() - 55 * 60 * 1000);
  await MS.applyMomentoSiguiente(MEETING_ID, { id: 5, name: 'Nohora Paez', role: 'admin' }, { confirmado: true });
  check('Aplicado con 1 presente (minimo 4)', (await MS.getMomentState(MEETING_ID)).alcanzado, false);
  // Pasa la hora limite sin llegar al minimo.
  momentRows[0].hora_limite = new Date(Date.now() - 60 * 1000);
  await MS.evaluateMomentOutcome(MEETING_ID);
  const st3 = await MS.getMomentState(MEETING_ID);
  check('Cerrado sin quorum', st3.cerrado_sin_quorum, true);
  check('No quedo marcado como alcanzado', st3.alcanzado, false);
  check('Quedo hora de cierre', !!st3.cerrado_at, true);

  console.log('\n=== MD-02 §6 · Con la ventana vencida ya no se puede aplicar ===');
  momentRows = []; momentSeq = 1;
  HORA_OFICIAL.setTime(Date.now() - 3 * 60 * 60 * 1000); // convocada hace 3 horas
  try {
    await MS.applyMomentoSiguiente(MEETING_ID, { id: 5, name: 'Nohora', role: 'admin' }, { confirmado: true });
    check('Ventana vencida', 'no fallo', 'VENTANA_VENCIDA');
  } catch (e) { check('Ventana vencida se rechaza', e.code, 'VENTANA_VENCIDA'); }

  console.log('\n=== MD-02 §2 · Antes de la hora oficial no se puede aplicar ===');
  momentRows = []; momentSeq = 1;
  HORA_OFICIAL.setTime(Date.now() + 2 * 60 * 60 * 1000); // convocada en 2 horas
  try {
    await MS.applyMomentoSiguiente(MEETING_ID, { id: 5, name: 'Nohora', role: 'admin' }, { confirmado: true });
    check('Antes de hora oficial', 'no fallo', 'ANTES_DE_HORA_OFICIAL');
  } catch (e) { check('Antes de hora oficial se rechaza', e.code, 'ANTES_DE_HORA_OFICIAL'); }
  const disp = await MS.getMomentState(MEETING_ID);
  check('Boton no disponible aun', disp.disponible, false);
  check('Motivo', disp.motivo_no_disponible, 'antes_de_hora_oficial');

  console.log('\n=== MD-02 §8 · Trazabilidad en quorum_log ===');
  check('Eventos registrados', quorumLog.includes('MOMENTO_SIGUIENTE_APLICADO'), true);
  check('Evento alcanzado', quorumLog.includes('MOMENTO_SIGUIENTE_ALCANZADO'), true);
  check('Evento cierre', quorumLog.includes('MOMENTO_SIGUIENTE_CERRADO'), true);

  console.log(`\n${fallos === 0 ? 'TODO OK' : 'HAY FALLOS'} — ${pasos - fallos}/${pasos} comprobaciones pasaron\n`);
  process.exit(fallos === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
