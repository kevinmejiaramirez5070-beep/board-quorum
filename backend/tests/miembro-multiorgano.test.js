/**
 * Vinculación de una persona existente a un segundo órgano.
 *
 * Caso real: MARIA DEL PILAR HERRERA CHAPARRO (CC 52.791.026) ya está en
 * Asamblea General y debe incorporarse también a Junta Directiva como Vocal
 * Principal. La validación de documento único bloqueaba la operación.
 *
 *   1 PERSONA · 1 IDENTIFICACIÓN · N PERTENENCIAS A ÓRGANOS
 *
 * La identidad es única; la pertenencia no. Solo hay duplicado cuando la
 * persona ya pertenece al MISMO órgano.
 *
 * BD simulada en memoria. No toca Supabase.
 */
process.env.DB_TYPE = 'postgresql';

const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src');

const CLIENT = 1, ASAMBLEA = 4, JUNTA = 1;

let members = [];
let mSeq = 1;
function add(productId, nombre, doc, rol, tipo) {
  members.push({ id: mSeq++, client_id: CLIENT, product_id: productId, name: nombre,
    numero_documento: doc, tipo_documento: 'C.C.', rol_organico: rol,
    member_type: tipo || 'principal', tipo_participante: (tipo || 'principal').toUpperCase(),
    active: true });
  return members[members.length - 1];
}

// Maria del Pilar ya existe en Asamblea General
const maria = add(ASAMBLEA, 'MARIA DEL PILAR HERRERA CHAPARRO', '52791026', 'QUINTO A');
// Otra persona ya en Junta Directiva
add(JUNTA, 'OTRO MIEMBRO JD', '111222', 'VOCALES');

const norm = (v) => String(v ?? '').replace(/\D/g, '');

const fakeDb = {
  async execute(sql, params = []) {
    const q = sql.replace(/\s+/g, ' ').trim();
    if (q.startsWith('SELECT id, name, rol_organico FROM members')) {
      const hit = members.filter(m =>
        m.client_id === Number(params[0]) &&
        m.product_id === Number(params[1]) &&
        norm(m.numero_documento) === params[2] &&
        m.active);
      return [hit.slice(0, 1)];
    }
    return [[]];
  }
};
const dbPath = path.join(SRC, 'config/database.js');
require.cache[require.resolve(dbPath)] = { id: dbPath, filename: dbPath, loaded: true, exports: fakeDb };

const Member = require(path.join(SRC, 'models/Member.js'));

let fallos = 0, pasos = 0;
function check(n, real, esp) {
  pasos++;
  const ok = JSON.stringify(real) === JSON.stringify(esp);
  if (!ok) { fallos++; console.log(`  FALLO  ${n}: esperado ${JSON.stringify(esp)}, obtuvo ${JSON.stringify(real)}`); }
  else console.log(`  ok     ${n} = ${JSON.stringify(real)}`);
}

// Reproduce la deteccion de la pantalla: mismo organo = duplicado,
// otro organo = misma persona, se crea la pertenencia.
function clasificar(doc, productId) {
  const d = norm(doc);
  const coincidencias = members.filter(m => norm(m.numero_documento) === d && m.active);
  const duplicado = coincidencias.find(m => String(m.product_id) === String(productId)) || null;
  return { duplicado, enOtroOrgano: duplicado ? null : (coincidencias[0] || null) };
}

(async () => {
  console.log('\n=== Estado inicial ===');
  check('Maria existe una sola vez', members.filter(m => norm(m.numero_documento) === '52791026').length, 1);
  check('Y esta en Asamblea General', maria.product_id, ASAMBLEA);

  console.log('\n=== Registrarla en JUNTA DIRECTIVA (el caso que fallaba) ===');
  let r = clasificar('52.791.026', JUNTA);
  check('NO se marca como duplicado', r.duplicado, null);
  check('Se reconoce como persona ya registrada', !!r.enOtroOrgano, true);
  check('Y se sabe en que organo estaba', r.enOtroOrgano.product_id, ASAMBLEA);

  const bloqueoBackend = await Member.findInProductByDocument(CLIENT, JUNTA, '52.791.026');
  check('El backend tampoco la bloquea', bloqueoBackend, null);

  // Se crea la PERTENENCIA, no una segunda identidad
  const enJunta = add(JUNTA, 'MARIA DEL PILAR HERRERA CHAPARRO', '52791026', 'VOCALES');
  enJunta.cargo_funcional = 'VOCAL PRINCIPAL';

  console.log('\n=== Criterios de aceptacion del MD ===');
  const suyas = members.filter(m => norm(m.numero_documento) === '52791026');
  check('1. Un solo numero de identificacion', new Set(suyas.map(m => norm(m.numero_documento))).size, 1);
  check('2. Conserva su pertenencia a Asamblea', suyas.some(m => m.product_id === ASAMBLEA), true);
  check('3. Y ahora tambien esta en Junta Directiva', suyas.some(m => m.product_id === JUNTA), true);
  check('4. En Junta es Principal / Vocales / Vocal Principal',
    [enJunta.tipo_participante, enJunta.rol_organico, enJunta.cargo_funcional],
    ['PRINCIPAL', 'VOCALES', 'VOCAL PRINCIPAL']);
  check('5. No se creo una segunda identidad, sino dos pertenencias', suyas.length, 2);
  check('6. Su registro en Asamblea no se toco',
    [maria.rol_organico, maria.product_id, maria.active], ['QUINTO A', ASAMBLEA, true]);

  console.log('\n=== 7. Repetir la MISMA pertenencia si debe avisar ===');
  r = clasificar('52791026', JUNTA);
  check('Ahora si es duplicado', !!r.duplicado, true);
  check('Y nombra a la persona', r.duplicado.name, 'MARIA DEL PILAR HERRERA CHAPARRO');
  const bloqueo2 = await Member.findInProductByDocument(CLIENT, JUNTA, '52791026');
  check('El backend lo rechaza', !!bloqueo2, true);
  check('Con el nombre correcto', bloqueo2.name, 'MARIA DEL PILAR HERRERA CHAPARRO');

  console.log('\n=== El documento se normaliza antes de comparar ===');
  const conPuntos = await Member.findInProductByDocument(CLIENT, JUNTA, '52.791.026');
  check('52.791.026 encuentra a 52791026', !!conPuntos, true);

  console.log('\n=== Una persona nueva no se bloquea ===');
  r = clasificar('99887766', JUNTA);
  check('Sin duplicado', r.duplicado, null);
  check('Sin coincidencia en otro organo', r.enOtroOrgano, null);

  console.log(`\n${fallos === 0 ? 'TODO OK' : 'HAY FALLOS'} — ${pasos - fallos}/${pasos} comprobaciones pasaron\n`);
  process.exit(fallos === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
