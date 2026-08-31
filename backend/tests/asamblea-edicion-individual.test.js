/**
 * Edición individual del Maestro de Delegados.
 *
 * Corregir un dato puntual sin recargar el Excel completo, conservando las
 * mismas validaciones de la carga masiva: documento único, un Principal y un
 * Suplente por curso, recálculo de vínculos y trazabilidad del cambio.
 *
 * BD simulada en memoria. No toca Supabase.
 */
process.env.DB_TYPE = 'postgresql';

const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src');
const PROD = 4, CLIENT = 1;

let members = [], edits = [];
let mSeq = 1;

function add(curso, tipo, nombre, doc) {
  members.push({ id: mSeq++, client_id: CLIENT, product_id: PROD, name: nombre,
    member_type: tipo, numero_documento: doc, secondary_document: null, secondary_name: null,
    rol_organico: curso, tipo_participante: tipo === 'suplente' ? 'SUPLENTE' : 'PRINCIPAL',
    cuenta_quorum: tipo === 'principal', puede_votar: tipo === 'principal',
    principal_id: null, active: true });
  return members[members.length - 1];
}
const pA = add('QUINTO A', 'principal', 'ARIAS MARIA', '111');
const sA = add('QUINTO A', 'suplente', 'SOTO CARLA', '222');
const pB = add('QUINTO B', 'principal', 'GOMEZ ANA', '333');
const sC = add('QUINTO C', 'suplente', 'RUIZ LUISA', '444');   // curso sin Principal

const fakeDb = {
  async execute(sql, params = []) {
    const q = sql.replace(/\s+/g, ' ').trim();

    if (q.startsWith('SELECT * FROM members WHERE id = ? AND product_id')) {
      return [members.filter(m => m.id === Number(params[0]) && m.product_id === Number(params[1]))];
    }
    if (q.startsWith('SELECT * FROM members WHERE id = ? LIMIT')) {
      return [members.filter(m => m.id === Number(params[0]))];
    }
    if (q.startsWith('SELECT secondary_document FROM members')) return [[]];

    if (q.startsWith('SELECT id, name FROM members WHERE product_id = ? AND numero_documento')) {
      return [members.filter(m => m.product_id === Number(params[0]) && m.numero_documento === params[1]
        && m.id !== Number(params[2]) && m.active)];
    }
    if (q.startsWith('SELECT id, name FROM members WHERE product_id = ? AND member_type')) {
      return [members.filter(m => m.product_id === Number(params[0]) && m.member_type === params[1]
        && String(m.rol_organico).toUpperCase().trim() === params[2]
        && m.id !== Number(params[3]) && m.active)];
    }
    if (q.startsWith('UPDATE members SET name = ?, numero_documento')) {
      const id = Number(params[params.length - 2]);
      const m = members.find(x => x.id === id);
      if (m) {
        m.name = params[0]; m.numero_documento = params[1]; m.rol_organico = params[2];
        m.member_type = params[3]; m.tipo_participante = params[4];
        m.cuenta_quorum = m.member_type === 'principal';
      }
      return [{}];
    }
    if (q.startsWith('INSERT INTO assembly_member_edits')) {
      edits.push({ product_id: params[0], member_id: params[1], operator_id: params[2],
        operator_name: params[3], cambios: JSON.parse(params[4]) });
      return [{ insertId: edits.length }];
    }
    if (q.startsWith('SELECT id, member_id, operator_id, operator_name, cambios')) {
      return [edits.filter(e => e.member_id === Number(params[1]))
        .map((e, i) => ({ id: i + 1, ...e, cambios: JSON.stringify(e.cambios) }))];
    }
    // linkSuplentesPrincipales
    if (q.startsWith('SELECT id, rol_organico FROM members') && q.includes("'principal'")) {
      return [members.filter(m => m.product_id === Number(params[0]) && m.member_type === 'principal' && m.active)
        .map(m => ({ id: m.id, rol_organico: m.rol_organico }))];
    }
    if (q.startsWith('SELECT id, rol_organico FROM members') && q.includes("'suplente'")) {
      return [members.filter(m => m.product_id === Number(params[0]) && m.member_type === 'suplente' && m.active)
        .map(m => ({ id: m.id, rol_organico: m.rol_organico }))];
    }
    if (q.startsWith('UPDATE members SET principal_id = ?')) {
      const m = members.find(x => x.id === Number(params[1])); if (m) m.principal_id = params[0];
      return [{}];
    }
    if (q.startsWith('UPDATE members SET principal_id = NULL')) {
      const m = members.find(x => x.id === Number(params[0])); if (m) m.principal_id = null;
      return [{}];
    }
    // getMasterSummary
    if (q.startsWith('SELECT COUNT(*) AS n FROM members') && q.includes('principal_id IS NULL')) {
      return [[{ n: members.filter(m => m.product_id === Number(params[0]) && m.member_type === 'suplente' && m.active && m.principal_id == null).length }]];
    }
    if (q.startsWith('SELECT COUNT(*) AS n FROM members') && q.includes("'principal'")) {
      return [[{ n: members.filter(m => m.product_id === Number(params[0]) && m.member_type === 'principal' && m.active).length }]];
    }
    if (q.startsWith('SELECT COUNT(*) AS n FROM members') && q.includes("'suplente'")) {
      return [[{ n: members.filter(m => m.product_id === Number(params[0]) && m.member_type === 'suplente' && m.active).length }]];
    }
    if (q.startsWith('SELECT COUNT(DISTINCT rol_organico) AS n FROM members')) {
      const tipo = q.includes("'principal'") ? 'principal' : 'suplente';
      return [[{ n: new Set(members.filter(m => m.product_id === Number(params[0]) && m.member_type === tipo && m.active).map(m => m.rol_organico)).size }]];
    }
    if (q.includes('assembly_import_log')) throw new Error('sin tabla');
    return [[]];
  }
};
const dbPath = path.join(SRC, 'config/database.js');
require.cache[require.resolve(dbPath)] = { id: dbPath, filename: dbPath, loaded: true, exports: fakeDb };

const AMS = require(path.join(SRC, 'services/assemblyMembersService.js'));
const OP = { id: 9, name: 'Nohora Paez' };

let fallos = 0, pasos = 0;
function check(n, real, esp) {
  pasos++;
  const ok = JSON.stringify(real) === JSON.stringify(esp);
  if (!ok) { fallos++; console.log(`  FALLO  ${n}: esperado ${JSON.stringify(esp)}, obtuvo ${JSON.stringify(real)}`); }
  else console.log(`  ok     ${n} = ${JSON.stringify(real)}`);
}
const editar = (id, cambios) => AMS.updateMember(PROD, id, cambios, OP);

(async () => {
  console.log('\n=== CP-01 · Editar nombre ===');
  let r = await editar(pA.id, { name: 'ARIAS RODRIGUEZ MARIA' });
  check('Nombre guardado', members.find(m => m.id === pA.id).name, 'ARIAS RODRIGUEZ MARIA');
  check('El curso no cambia', members.find(m => m.id === pA.id).rol_organico, 'QUINTO A');
  check('El rol no cambia', members.find(m => m.id === pA.id).member_type, 'principal');
  check('Un solo cambio registrado', r.cambios.length, 1);
  check('Con valor anterior y nuevo', [r.cambios[0].antes, r.cambios[0].despues],
    ['ARIAS MARIA', 'ARIAS RODRIGUEZ MARIA']);

  console.log('\n=== CP-02 · Editar identificacion ===');
  r = await editar(pA.id, { numero_documento: '1.234.567' });
  check('Se normaliza a solo digitos', members.find(m => m.id === pA.id).numero_documento, '1234567');

  console.log('\n=== Validacion · documento duplicado ===');
  try {
    await editar(pA.id, { numero_documento: '333' });   // ya es de GOMEZ ANA
    check('Duplicado', 'no fallo', 'DOCUMENTO_DUPLICADO');
  } catch (e) { check('Documento duplicado se rechaza', e.code, 'DOCUMENTO_DUPLICADO'); }
  check('El documento no se toco', members.find(m => m.id === pA.id).numero_documento, '1234567');

  console.log('\n=== Validacion · campos obligatorios ===');
  for (const [caso, cambios, codigo] of [
    ['nombre vacio', { name: '  ' }, 'NOMBRE_VACIO'],
    ['documento no numerico', { numero_documento: 'ABC' }, 'DOCUMENTO_INVALIDO'],
    ['curso vacio', { rol_organico: '' }, 'CURSO_VACIO'],
    ['rol invalido', { member_type: 'vocal' }, 'ROL_INVALIDO']
  ]) {
    try { await editar(pA.id, cambios); check(caso, 'no fallo', codigo); }
    catch (e) { check(caso + ' se rechaza', e.code, codigo); }
  }

  console.log('\n=== Validacion · un solo Principal por curso ===');
  try {
    await editar(sA.id, { member_type: 'principal' });   // QUINTO A ya tiene Principal
    check('Curso ocupado', 'no fallo', 'CURSO_YA_OCUPADO');
  } catch (e) { check('No deja dos Principales en el mismo curso', e.code, 'CURSO_YA_OCUPADO'); }

  console.log('\n=== CP · Cambiar el rol cuando SI se puede ===');
  r = await editar(sC.id, { member_type: 'principal' });   // QUINTO C no tenia Principal
  check('Rol cambiado', members.find(m => m.id === sC.id).member_type, 'principal');
  check('cuenta_quorum se ajusta', members.find(m => m.id === sC.id).cuenta_quorum, true);
  check('Indicadores recalculados: Principales', r.summary.total_principals, 3);

  console.log('\n=== CP · Cambiar de curso recalcula el vinculo ===');
  check('El suplente de QUINTO A estaba vinculado', members.find(m => m.id === sA.id).principal_id, pA.id);
  r = await editar(sA.id, { rol_organico: 'QUINTO B' });
  check('Curso cambiado', members.find(m => m.id === sA.id).rol_organico, 'QUINTO B');
  check('Ahora se vincula al Principal de QUINTO B', members.find(m => m.id === sA.id).principal_id, pB.id);

  console.log('\n=== Sin cambios reales no se escribe nada ===');
  const antes = edits.length;
  r = await editar(pB.id, { name: 'GOMEZ ANA' });
  check('No registra cambios', r.cambios.length, 0);
  check('No agrega auditoria', edits.length, antes);

  console.log('\n=== Trazabilidad ===');
  const hist = await AMS.getMemberEdits(PROD, pA.id);
  check('Hay historial del delegado', hist.length > 0, true);
  check('Queda el usuario que edito', hist[0].operator_name, 'Nohora Paez');
  check('Y el detalle campo/antes/despues', Object.keys(hist[0].cambios[0]).sort(),
    ['antes', 'campo', 'despues']);

  console.log('\n=== Un delegado de otro organo no se puede editar ===');
  try {
    await AMS.updateMember(99, pA.id, { name: 'X' }, OP);
    check('Otro organo', 'no fallo', 'NO_ENCONTRADO');
  } catch (e) { check('Se rechaza', e.code, 'NO_ENCONTRADO'); }

  console.log(`\n${fallos === 0 ? 'TODO OK' : 'HAY FALLOS'} — ${pasos - fallos}/${pasos} comprobaciones pasaron\n`);
  process.exit(fallos === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
