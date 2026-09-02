/**
 * Indicadores del Maestro de Delegados.
 *
 * Reproduce la estructura real de ASOCOLCI:
 *   50 cursos con Principal + Suplente
 *   35 cursos con Principal sin Suplente
 *    5 cursos con Suplente sin Principal
 *   -> 85 Principales, 55 Suplentes, 140 activos
 *
 * "Sin suplente" mostraba 30 porque restaba cursos_con_principal menos
 * cursos_con_suplente, y ese segundo conteo incluye los 5 cursos que solo
 * tienen Suplente. El valor correcto es 35.
 *
 * BD simulada en memoria. No toca Supabase.
 */
process.env.DB_TYPE = 'postgresql';

const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src');
const PROD = 4;

let members = [];
let mSeq = 1;
function add(curso, tipo, activo = true) {
  members.push({ id: mSeq++, product_id: PROD, member_type: tipo, rol_organico: curso,
    active: activo, principal_id: null });
}

for (let i = 1; i <= 50; i++) { add(`CON AMBOS ${i}`, 'principal'); add(`CON AMBOS ${i}`, 'suplente'); }
for (let i = 1; i <= 35; i++) { add(`SOLO PRINCIPAL ${i}`, 'principal'); }
for (let i = 1; i <= 5; i++)  { add(`SOLO SUPLENTE ${i}`, 'suplente'); }
// Históricos de una carga anterior
for (let i = 1; i <= 7; i++)  { add(`VIEJO ${i}`, 'principal', false); }

const norm = (v) => String(v ?? '').toUpperCase().trim();

const fakeDb = {
  async execute(sql, params = []) {
    const q = sql.replace(/\s+/g, ' ').trim();
    const act = members.filter(m => m.product_id === Number(params[0]) && m.active);

    if (q.includes('cursos_sin_suplente')) {
      const cursosPrincipal = new Set(act.filter(m => m.member_type === 'principal').map(m => norm(m.rol_organico)));
      const cursosSuplente = new Set(act.filter(m => m.member_type === 'suplente').map(m => norm(m.rol_organico)));
      return [[{ n: [...cursosPrincipal].filter(c => !cursosSuplente.has(c)).length }]];
    }
    if (q.startsWith('SELECT COUNT(*) AS n FROM members WHERE product_id = ? AND NOT')) {
      return [[{ n: members.filter(m => m.product_id === Number(params[0]) && !m.active).length }]];
    }
    if (q.startsWith('SELECT COUNT(*) AS n FROM members') && q.includes('principal_id IS NULL')) {
      const cursosPrincipal = new Set(act.filter(m => m.member_type === 'principal').map(m => norm(m.rol_organico)));
      return [[{ n: act.filter(m => m.member_type === 'suplente' && !cursosPrincipal.has(norm(m.rol_organico))).length }]];
    }
    if (q.startsWith('SELECT COUNT(*) AS n FROM members') && q.includes("'principal'")) {
      return [[{ n: act.filter(m => m.member_type === 'principal').length }]];
    }
    if (q.startsWith('SELECT COUNT(*) AS n FROM members') && q.includes("'suplente'")) {
      return [[{ n: act.filter(m => m.member_type === 'suplente').length }]];
    }
    if (q.startsWith('SELECT COUNT(DISTINCT rol_organico) AS n FROM members')) {
      const tipo = q.includes("'principal'") ? 'principal' : 'suplente';
      return [[{ n: new Set(act.filter(m => m.member_type === tipo).map(m => norm(m.rol_organico))).size }]];
    }
    if (q.includes('assembly_import_log')) throw new Error('sin tabla');
    return [[]];
  }
};
const dbPath = path.join(SRC, 'config/database.js');
require.cache[require.resolve(dbPath)] = { id: dbPath, filename: dbPath, loaded: true, exports: fakeDb };

const AMS = require(path.join(SRC, 'services/assemblyMembersService.js'));

let fallos = 0, pasos = 0;
function check(n, real, esp) {
  pasos++;
  const ok = JSON.stringify(real) === JSON.stringify(esp);
  if (!ok) { fallos++; console.log(`  FALLO  ${n}: esperado ${JSON.stringify(esp)}, obtuvo ${JSON.stringify(real)}`); }
  else console.log(`  ok     ${n} = ${JSON.stringify(real)}`);
}

(async () => {
  const s = await AMS.getMasterSummary(PROD);

  console.log('\n=== Indicadores del maestro ===');
  check('Principales', s.total_principals, 85);
  check('Suplentes', s.total_suplentes, 55);
  check('Cursos con Principal', s.cursos_con_principal, 85);
  check('Suplentes sin Principal asociado', s.suplentes_sin_principal, 5);
  check('Cursos con Principal SIN Suplente', s.sin_suplente, 35);

  console.log('\n=== Registros activos e historicos ===');
  check('Activos', s.registros_activos, 140);
  check('Inactivos', s.registros_inactivos, 7);
  check('Total de registros', s.registros_totales, 147);

  console.log('\n=== El universo de quorum NO cambia ===');
  check('Universo', s.universo_quorum, 85);
  check('Quorum inicial', s.quorum_inicial, 44);
  check('Momento Siguiente', s.quorum_momento_siguiente, 17);
  check('Los 5 sin Principal no bloquean el maestro', s.maestro_listo, true);

  console.log('\n=== Conciliacion ===');
  console.log(`  85 cursos con Principal = 50 con Suplente + ${s.sin_suplente} sin Suplente`);
  check('Concilia', 50 + s.sin_suplente, s.cursos_con_principal);

  console.log(`\n${fallos === 0 ? 'TODO OK' : 'HAY FALLOS'} — ${pasos - fallos}/${pasos} comprobaciones pasaron\n`);
  process.exit(fallos === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
