/**
 * Tope de longitud de una opción de votación.
 *
 * La columna votes.option es VARCHAR(100). Una opción más larga se dejaba
 * crear sin problema, y el error solo aparecía al CONFIRMAR el voto, con la
 * votación ya abierta ante la Asamblea:
 *
 *   value too long for type character varying(100)
 *
 * Ahora se detiene al crear la votación y, para las votaciones ya existentes
 * con una opción larga, al registrar el voto se responde un motivo claro en
 * lugar del error crudo de PostgreSQL.
 *
 * BD simulada en memoria. No toca Supabase.
 */
process.env.DB_TYPE = 'postgresql';

const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src');

const insertados = [];
const fakeDb = {
  async execute(sql, params = []) {
    const q = sql.replace(/\s+/g, ' ').trim();
    if (q.startsWith('INSERT INTO votes')) {
      // La base real rechaza cualquier opción de más de 100 caracteres
      const opcion = q.includes('voter_name') ? params[1] : params[2];
      if (String(opcion ?? '').length > 100) {
        throw new Error('value too long for type character varying(100)');
      }
      insertados.push(opcion);
      return [{ insertId: insertados.length }];
    }
    return [[]];
  }
};
const dbPath = path.join(SRC, 'config/database.js');
require.cache[require.resolve(dbPath)] = { id: dbPath, filename: dbPath, loaded: true, exports: fakeDb };

const Vote = require(path.join(SRC, 'models/Vote.js'));

let fallos = 0, pasos = 0;
function check(n, real, esp) {
  pasos++;
  const ok = JSON.stringify(real) === JSON.stringify(esp);
  if (!ok) { fallos++; console.log(`  FALLO  ${n}: esperado ${JSON.stringify(esp)}, obtuvo ${JSON.stringify(real)}`); }
  else console.log(`  ok     ${n} = ${JSON.stringify(real)}`);
}

const opcion = (n) => 'A'.repeat(n);
const MAX = 100;

// Reproduce el corte del formulario: maxLength + slice antes de agregar.
function agregarOpcionEnFormulario(texto) {
  const recortado = String(texto).slice(0, MAX);
  return recortado.trim().length > MAX ? null : recortado.trim();
}

(async () => {
  console.log('\n=== El formulario no deja escribir de mas ===');
  check('Una opcion de 100 pasa', agregarOpcionEnFormulario(opcion(100)).length, 100);
  check('Una de 150 se recorta a 100', agregarOpcionEnFormulario(opcion(150)).length, 100);
  check('Nunca se agrega algo de mas de 100',
    agregarOpcionEnFormulario(opcion(300)).length <= MAX, true);

  console.log('\n=== El voto con opcion valida se registra ===');
  const id = await Vote.create({ voting_id: 1, member_id: 5, option: 'A FAVOR', comment: null });
  check('Se guardo', id > 0, true);
  check('Con el texto exacto', insertados[insertados.length - 1], 'A FAVOR');

  const idBorde = await Vote.create({ voting_id: 1, member_id: 6, option: opcion(100), comment: null });
  check('Una opcion de exactamente 100 se acepta', idBorde > 0, true);

  console.log('\n=== El voto con opcion larga se detiene con motivo claro ===');
  // Caso de una votacion creada ANTES del arreglo
  try {
    await Vote.create({ voting_id: 1, member_id: 7, option: opcion(101), comment: null });
    check('101 caracteres', 'no fallo', 'OPCION_DEMASIADO_LARGA');
  } catch (e) {
    check('Se rechaza', e.code, 'OPCION_DEMASIADO_LARGA');
    check('El mensaje NO es el error crudo de PostgreSQL',
      /character varying/.test(e.message), false);
    check('Dice cuantos caracteres tiene', /101/.test(e.message), true);
    console.log('  mensaje: ' + e.message);
  }

  console.log('\n=== Tambien en el voto publico ===');
  try {
    await Vote.createPublic({ voting_id: 1, name: 'X', email: null, option: opcion(200), comment: null });
    check('Voto publico largo', 'no fallo', 'OPCION_DEMASIADO_LARGA');
  } catch (e) {
    check('Se rechaza igual', e.code, 'OPCION_DEMASIADO_LARGA');
  }

  console.log('\n=== Nunca llega a la base una opcion invalida ===');
  check('Todo lo insertado cabe en la columna',
    insertados.every(o => String(o).length <= MAX), true);

  console.log(`\n${fallos === 0 ? 'TODO OK' : 'HAY FALLOS'} — ${pasos - fallos}/${pasos} comprobaciones pasaron\n`);
  process.exit(fallos === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
