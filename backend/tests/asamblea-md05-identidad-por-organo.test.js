/**
 * MD-05 §12 — La Asamblea se basa unicamente en su maestro de Delegados.
 *
 * Una cedula que solo existe en Junta Directiva no puede entrar a una Asamblea
 * heredando su cargo de alla (Junta de Vigilancia, Vocales, Suplente de Vocal).
 * Quien esta en los dos organos se resuelve con su rol del organo de la reunion.
 *
 * BD simulada en memoria. No toca Supabase.
 */
process.env.DB_TYPE = 'postgresql';
const path = require('path');
const SRC = path.resolve(__dirname, '..', 'src');
const PROD_ASAMBLEA = 4, PROD_JD = 1;

const members = [
  // Solo Junta Directiva — NO esta en el maestro de Asamblea
  { id:1, client_id:1, product_id:PROD_JD, name:'MIEMBRO JUNTA VIGILANCIA', numero_documento:'700001',
    secondary_document:null, rol_organico:'JUNTA DE VIGILANCIA', member_type:'junta_vigilancia',
    tipo_participante:'JUNTA_DE_VIGILANCIA', cuenta_quorum:true, puede_votar:true, active:true },
  { id:2, client_id:1, product_id:PROD_JD, name:'SUPLENTE DE VOCAL', numero_documento:'700002',
    secondary_document:null, rol_organico:'VOCALES', member_type:'suplente',
    tipo_participante:'SUPLENTE', cuenta_quorum:false, puede_votar:false, active:true },
  // En los DOS organos
  { id:3, client_id:1, product_id:PROD_JD, name:'JEFFERSON GALVIS DUARTE', numero_documento:'1015999986',
    secondary_document:null, rol_organico:'VICEPRESIDENCIA', member_type:'principal',
    tipo_participante:'PRINCIPAL', cuenta_quorum:true, puede_votar:true, active:true },
  { id:4, client_id:1, product_id:PROD_ASAMBLEA, name:'SANDRA MILENA JIMENEZ', numero_documento:'1024531922',
    secondary_document:'1015999986', secondary_name:'JEFFERSON GALVIS', rol_organico:'JARDIN B',
    member_type:'principal', tipo_participante:'PRINCIPAL', cuenta_quorum:true, puede_votar:true, active:true },
];
const norm = v => String(v ?? '').replace(/\D/g,'');
const fakeDb = { async execute(sql, params=[]) {
  const q = sql.replace(/\s+/g,' ').trim();
  if (q.includes('FROM members WHERE') && q.includes('documento_usado')) {
    const d = norm(params[0]);
    const estricto = q.includes('AND product_id = ?');
    const pid = estricto ? params[5] : null;
    let hit = members.filter(m => m.client_id===Number(params[4]) && m.active &&
      (norm(m.numero_documento)===d || (m.secondary_document && norm(m.secondary_document)===d)));
    if (estricto) hit = hit.filter(m => m.product_id === Number(pid));
    return [hit.map(m=>({...m, documento_usado: norm(m.numero_documento)===d?'primario':'secundario'}))];
  }
  return [[]];
}};
const dbPath=path.join(SRC,'config/database.js');
require.cache[require.resolve(dbPath)]={id:dbPath,filename:dbPath,loaded:true,exports:fakeDb};
const Member=require(path.join(SRC,'models/Member.js'));

let fallos=0,pasos=0;
const check=(n,r,e)=>{pasos++;const ok=JSON.stringify(r)===JSON.stringify(e);
  if(!ok){fallos++;console.log(`  FALLO  ${n}: esperado ${JSON.stringify(e)}, obtuvo ${JSON.stringify(r)}`);}
  else console.log(`  ok     ${n} = ${JSON.stringify(r)}`);};

(async()=>{
  console.log('\n=== En una ASAMBLEA (estricto al maestro de Asamblea) ===');
  const jv = await Member.findByDocumentNumber('700001', 1, PROD_ASAMBLEA, {strictProduct:true});
  check('Junta de Vigilancia NO entra heredando su cargo', jv, null);
  const voc = await Member.findByDocumentNumber('700002', 1, PROD_ASAMBLEA, {strictProduct:true});
  check('Suplente de Vocal NO entra heredando su cargo', voc, null);
  const jeff = await Member.findByDocumentNumber('1015999986', 1, PROD_ASAMBLEA, {strictProduct:true});
  check('Quien SI esta en el maestro entra con su rol de Asamblea', jeff && jeff.rol_organico, 'JARDIN B');
  check('Y con su identidad, no la de la fila', jeff && jeff.documento_usado, 'secundario');

  console.log('\n=== En una JUNTA DIRECTIVA (sin restringir) ===');
  const jv2 = await Member.findByDocumentNumber('700001', 1, PROD_JD, {strictProduct:false});
  check('Junta de Vigilancia sigue funcionando en su organo', jv2 && jv2.rol_organico, 'JUNTA DE VIGILANCIA');
  const jeff2 = await Member.findByDocumentNumber('1015999986', 1, PROD_JD, {strictProduct:false});
  check('En Junta Directiva es Vicepresidencia', jeff2 && jeff2.rol_organico, 'VICEPRESIDENCIA');

  console.log(`\n${fallos===0?'TODO OK':'HAY FALLOS'} — ${pasos-fallos}/${pasos}\n`);
  process.exit(fallos===0?0:1);
})();
