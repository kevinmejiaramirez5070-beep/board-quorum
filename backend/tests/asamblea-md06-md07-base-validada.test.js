/**
 * Prueba MD-06 y MD-07 contra el Excel validado real:
 *   BOARD_QUORUM_ASAMBLEA_AGOSTO_2026_CARGA_FINAL.xlsx
 *
 * Verifica que el parser reproduzca 85 Principales + 55 Suplentes, que los
 * umbrales salgan 44 / 17, y que la carga de reemplazo retire los registros
 * activos de cargas anteriores sin convertir Suplentes en Principales.
 *
 * BD simulada en memoria. No toca Supabase.
 */
const path = require('path');
const fs = require('fs');
const SRC = path.resolve(__dirname, '..', 'src');

const XLSX_PATH = path.resolve(
  __dirname, '..', '..',
  'guia', 'car', '2. Documentos de Implementación',
  'BOARD_QUORUM_ASAMBLEA_AGOSTO_2026_CARGA_FINAL.xlsx'
);

const PRODUCT_ID = 4;
const CLIENT_ID = 1;

// ── BD simulada: tabla members en memoria ────────────────────────────────────
let members = [];
let seq = 1;

const fakeDb = {
  async execute(sql, params = []) {
    const q = sql.replace(/\s+/g, ' ').trim();

    if (q.startsWith('SELECT secondary_document FROM members')) return [[]];

    if (q.startsWith('SELECT id FROM members WHERE numero_documento')) {
      const found = members.filter(m => m.numero_documento === params[0] && m.product_id === params[1]);
      return [found.map(m => ({ id: m.id }))];
    }

    if (q.startsWith('UPDATE members SET name =')) {
      const id = params[params.length - 1];
      const m = members.find(x => x.id === id);
      if (m) {
        m.name = params[0]; m.rol_organico = params[3];
        m.member_type = params[4]; m.tipo_participante = params[5];
        m.active = true;
      }
      return [{}];
    }

    if (q.startsWith('INSERT INTO members')) {
      members.push({
        id: seq++, client_id: params[0], product_id: params[1], name: params[2],
        member_type: params[4], tipo_documento: params[5], numero_documento: params[6],
        rol_organico: params[7], tipo_participante: params[8],
        principal_id: null, active: true
      });
      return [[{ id: seq - 1 }]];
    }

    if (q.startsWith('SELECT id, numero_documento, name, member_type, rol_organico FROM members')) {
      return [members.filter(m => m.product_id === params[0] && m.active)];
    }

    // El servicio emite 'active = false' (PostgreSQL) o 'active = 0' (MySQL)
    if (q.startsWith('UPDATE members SET active = false') || q.startsWith('UPDATE members SET active = 0')) {
      const m = members.find(x => x.id === params[0]);
      if (m) m.active = false;
      return [{}];
    }

    if (q.startsWith('SELECT id, rol_organico FROM members') && q.includes("'principal'")) {
      return [members.filter(m => m.product_id === params[0] && m.member_type === 'principal' && m.active)
        .map(m => ({ id: m.id, rol_organico: m.rol_organico }))];
    }
    if (q.startsWith('SELECT id, rol_organico FROM members') && q.includes("'suplente'")) {
      return [members.filter(m => m.product_id === params[0] && m.member_type === 'suplente' && m.active)
        .map(m => ({ id: m.id, rol_organico: m.rol_organico }))];
    }

    if (q.startsWith('UPDATE members SET principal_id = ?')) {
      const m = members.find(x => x.id === params[1]);
      if (m) m.principal_id = params[0];
      return [{}];
    }
    if (q.startsWith('UPDATE members SET principal_id = NULL')) {
      const m = members.find(x => x.id === params[0]);
      if (m) m.principal_id = null;
      return [{}];
    }

    if (q.startsWith('SELECT COUNT(*) AS n FROM members') && q.includes("'principal'")) {
      return [[{ n: members.filter(m => m.product_id === params[0] && m.member_type === 'principal' && m.active).length }]];
    }
    if (q.startsWith('SELECT COUNT(*) AS n FROM members') && q.includes('principal_id IS NULL')) {
      return [[{ n: members.filter(m => m.product_id === params[0] && m.member_type === 'suplente' && m.active && m.principal_id == null).length }]];
    }
    if (q.startsWith('SELECT COUNT(*) AS n FROM members') && q.includes("'suplente'")) {
      return [[{ n: members.filter(m => m.product_id === params[0] && m.member_type === 'suplente' && m.active).length }]];
    }
    if (q.startsWith('SELECT COUNT(DISTINCT rol_organico) AS n FROM members')) {
      const tipo = q.includes("'principal'") ? 'principal' : 'suplente';
      const set = new Set(members.filter(m => m.product_id === params[0] && m.member_type === tipo && m.active).map(m => m.rol_organico));
      return [[{ n: set.size }]];
    }
    if (q.includes('assembly_import_log')) throw new Error('sin tabla de log');

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
  if (!XLSX_PATH) {
    console.log('SALTADA — no se encontro el Excel validado en:\n  ' + DOCS_DIR);
    process.exit(0);
  }
  console.log('Archivo: ' + path.basename(XLSX_PATH));

  console.log('\n=== MD-07 §2 · El parser reproduce la base validada ===');
  const parsed = await AMS.parseImportFile(XLSX_PATH);
  check('Registros leidos', parsed.length, 140);
  check('Principales', parsed.filter(r => r.member_type === 'principal').length, 85);
  check('Suplentes', parsed.filter(r => r.member_type === 'suplente').length, 55);

  console.log('\n=== MD-07 §5 · Validacion del lote ===');
  const { validRows, invalidRows, blocking } = AMS.validateBatch(parsed);
  check('Filas validas', validRows.length, 140);
  check('Filas invalidas', invalidRows.length, 0);
  check('Errores bloqueantes', blocking.length, 0);

  console.log('\n=== MD-07 §3 · Carga sobre un maestro que ya tenia datos viejos ===');
  // Simula la carga anterior: 22 Principales y 20 Suplentes de otra base.
  for (let i = 1; i <= 22; i++) {
    members.push({ id: seq++, client_id: CLIENT_ID, product_id: PRODUCT_ID, name: `Viejo P${i}`,
      member_type: 'principal', numero_documento: `900000${i}`, rol_organico: `VIEJO ${i}`,
      tipo_participante: 'PRINCIPAL', principal_id: null, active: true });
  }
  for (let i = 1; i <= 20; i++) {
    members.push({ id: seq++, client_id: CLIENT_ID, product_id: PRODUCT_ID, name: `Viejo S${i}`,
      member_type: 'suplente', numero_documento: `800000${i}`, rol_organico: `VIEJO ${i}`,
      tipo_participante: 'SUPLENTE', principal_id: null, active: true });
  }
  check('Maestro previo activo', members.filter(m => m.active).length, 42);

  const load = await AMS.loadMembers(validRows, PRODUCT_ID, CLIENT_ID, 1, 'upsert');
  check('Cargados OK', load.ok, 140);
  check('Errores de carga', load.errors, 0);

  const reemplazo = await AMS.deactivateAbsentMembers(PRODUCT_ID, validRows);
  check('Registros viejos retirados del maestro vigente', reemplazo.desactivados, 42);

  await AMS.linkSuplentesPrincipales(PRODUCT_ID);

  console.log('\n=== MD-07 §7 · Resultado esperado despues de la carga ===');
  const sum = await AMS.getMasterSummary(PRODUCT_ID);
  console.log(`  Total cargado: ${sum.total_principals + sum.total_suplentes}`);
  console.log(`  Principales:   ${sum.total_principals}`);
  console.log(`  Suplentes:     ${sum.total_suplentes}`);
  check('Principales vigentes', sum.total_principals, 85);
  check('Suplentes vigentes', sum.total_suplentes, 55);
  check('Total vigente', sum.total_principals + sum.total_suplentes, 140);
  check('Sin registros activos de cargas anteriores',
    members.filter(m => m.active && m.name.startsWith('Viejo')).length, 0);

  console.log('\n=== MD-07 §6 · El Suplente sin Principal conserva su rol y sigue activo ===');
  // En la base validada hay 5 cursos con Suplente pero sin Principal.
  const huerfanos = members.filter(m => m.active && m.member_type === 'suplente' && m.principal_id == null);
  check('Suplentes sin Principal', huerfanos.length, 5);
  check('Ninguno fue convertido a Principal',
    huerfanos.every(m => m.member_type === 'suplente' && m.tipo_participante === 'SUPLENTE'), true);
  check('Ninguno fue desactivado', huerfanos.every(m => m.active), true);
  check('Reportados en el resumen', sum.suplentes_sin_principal, 5);
  check('El maestro queda listo igual', sum.maestro_listo, true);
  console.log('  cursos sin Principal: ' + huerfanos.map(m => m.rol_organico).sort().join(', '));

  console.log('\n=== MD-06 · Valores de control 44 / 17 ===');
  check('Universo de quorum (solo Principales)', sum.universo_quorum, 85);
  check('Quorum inicial a las 6:00 p. m.', sum.quorum_inicial, 44);
  check('Minimo tras aplicar Momento Siguiente', sum.quorum_momento_siguiente, 17);
  check('Los 55 Suplentes NO aumentan el universo', sum.universo_quorum, 85);

  console.log(`\n${fallos === 0 ? 'TODO OK' : 'HAY FALLOS'} — ${pasos - fallos}/${pasos} comprobaciones pasaron\n`);
  process.exit(fallos === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
