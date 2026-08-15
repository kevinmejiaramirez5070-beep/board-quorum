const db = require('../config/database');
const crypto = require('crypto');

/**
 * Módulo 8 — Generación de Acta y Expediente (módulo terminal).
 * Consolida datos de M1-M7 (solo los CONSULTA), permite narrativa libre por punto,
 * valida precondiciones, y genera el Acta como PDF almacenado en BD (base64 + SHA-256).
 * VF-03 M8 = PDF en base de datos (confirmado).
 */
class AssemblyActaService {
  static get isPostgreSQL() {
    return !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
  }

  static async _getMeeting(meetingId) {
    const [rows] = await db.execute(`SELECT * FROM meetings WHERE id = ? LIMIT 1`, [meetingId]);
    return rows[0] || null;
  }
  static async _getActa(meetingId) {
    const [rows] = await db.execute(`SELECT * FROM actas WHERE meeting_id = ? LIMIT 1`, [meetingId]);
    return rows[0] || null;
  }

  static async logActaEvent(eventType, meetingId, actaId, operatorId, version = null, detalle = '') {
    try {
      await db.execute(
        `INSERT INTO acta_log (meeting_id, acta_id, event_type, operator_id, version, detalle, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [meetingId, actaId, eventType, operatorId, version, detalle || null]
      );
    } catch (e) { console.warn('[acta] logActaEvent falló:', e.message); }
  }

  /** Inicializa el borrador del acta (idempotente). */
  static async initActa(meetingId, operatorId, options = {}) {
    const meeting = await this._getMeeting(meetingId);
    if (!meeting) { const err = new Error('Reunión no encontrada'); err.status = 404; throw err; }
    const QuorumService = require('./quorumService');
    if (QuorumService.normalizeMeetingType(meeting.type) !== 'asamblea') { const err = new Error('El acta solo aplica a sesiones de Asamblea.'); err.status = 400; throw err; }
    if (meeting.status === 'pending' || meeting.status === 'scheduled') { const err = new Error('La sesión aún no ha iniciado.'); err.status = 423; throw err; }

    const existing = await this._getActa(meetingId);
    if (existing) {
      if (existing.status === 'final') { const err = new Error('Ya existe un Acta definitiva para esta sesión.'); err.status = 409; throw err; }
      return { acta_id: existing.id, meeting_id: Number(meetingId), status: existing.status, version_borrador: existing.version_borrador };
    }

    const returning = this.isPostgreSQL ? ' RETURNING id' : '';
    const [rows] = await db.execute(
      `INSERT INTO actas (meeting_id, status, version_borrador, tipo_sesion, numero_sesion, lugar, modalidad, hora_inicio, generada_por, generada_at, created_at, updated_at)
       VALUES (?, 'draft', 0, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())${returning}`,
      [meetingId, options.tipo_sesion || 'ordinaria', options.numero_sesion || null, options.lugar || meeting.location || null, options.modalidad || 'presencial', meeting.date || null, operatorId]
    );
    const actaId = this.isPostgreSQL ? rows?.[0]?.id : rows?.insertId;
    await this.logActaEvent('ACTA_BORRADOR_GENERADA', meetingId, actaId, operatorId, 0);
    return { acta_id: actaId, meeting_id: Number(meetingId), status: 'draft', version_borrador: 0 };
  }

  /** Consolida datos de M1-M7 en un objeto único. Cada sección con try/catch. */
  static async buildActaPayload(meetingId) {
    const meeting = await this._getMeeting(meetingId);
    const payload = { meta: {}, quorum: null, asistencia: [], poderes: [], mesa_directiva: {}, comisiones: {}, orden_del_dia: [], roles_incompletos: [] };

    payload.meta = {
      meeting_id: Number(meetingId),
      titulo: meeting?.title || 'Asamblea General de Delegados',
      tipo_sesion: 'ordinaria',
      hora_inicio: meeting?.date || null,
      hora_cierre: meeting?.updated_at || null,
      lugar: meeting?.location || null,
      fecha_generacion: new Date().toISOString()
    };

    // M1 — quórum
    try {
      const AssemblyQuorumService = require('./assemblyQuorumService');
      const panel = await AssemblyQuorumService.getFullAssemblyPanel(meetingId);
      payload.quorum = {
        estado: panel.estado, cursos_habilitados: panel.cursos_habilitados, cursos_representados: panel.cursos_representados,
        principales_presentes: panel.principales_presentes, suplentes_actuando: panel.suplentes_actuando,
        apoderados: panel.representaciones_por_poder, quorum_m1: panel.quorum_m1, quorum_m2: panel.quorum_m2, total_principales: panel.total_principales
      };
    } catch (e) { payload.quorum = { disponible: false, razon: e.message }; }

    // M2 — asistencia
    try {
      const isPG = this.isPostgreSQL;
      const [asis] = await db.execute(
        `SELECT a.member_id, a.status, a.acting_as_principal, a.arrival_time,
                COALESCE(m.name, a.manual_name) AS nombre, m.numero_documento, m.member_type, m.rol_organico
         FROM attendance a LEFT JOIN members m ON m.id = a.member_id
         WHERE a.meeting_id = ? ORDER BY a.arrival_time`,
        [meetingId]
      );
      payload.asistencia = asis.map(r => ({
        member_id: r.member_id, nombre: r.nombre, numero_documento: r.numero_documento,
        tipo: r.member_type || 'invitado', curso: r.rol_organico,
        asistio: r.status === 'present', acting_as_principal: r.acting_as_principal === true || r.acting_as_principal === 1,
        hora_ingreso: r.arrival_time
      }));
    } catch (e) { payload.asistencia = []; }

    // M3 — poderes
    try {
      const PowersService = require('./assemblyPowersService');
      payload.poderes = await PowersService.getPowersByMeeting(meetingId);
    } catch (e) { payload.poderes = []; }

    // M7 — roles
    try {
      const RolesService = require('./assemblyRolesService');
      const acta = await RolesService.getRolesForActa(meetingId);
      payload.mesa_directiva = { presidente: acta.presidente, secretario: acta.secretario };
      payload.comisiones = { verificadora: acta.comision_verificadora, aprobadora: acta.comision_aprobadora };
      payload.roles_incompletos = acta.roles_incompletos;
    } catch (e) { payload.mesa_directiva = {}; payload.comisiones = {}; }

    // M6 + M4 + M5 + narrativas → orden del día con resultados
    try {
      const AgendaService = require('./assemblyAgendaService');
      const agenda = await AgendaService.getAgendaWithProgress(meetingId);
      const narrativas = await this.getNarratives(meetingId);
      const narrMap = {};
      narrativas.forEach(n => { narrMap[n.agenda_item_id] = n.narrative_text; });

      let approvals = [], elections = [];
      try { approvals = await require('./assemblyApprovalService').getApprovalVotesByMeeting(meetingId); } catch (e) {}
      try { elections = await require('./assemblyElectionsService').getElectionsByMeeting(meetingId); } catch (e) {}

      if (agenda) {
        payload.meta.tipo_sesion = agenda.tipo_sesion;
        payload.orden_del_dia = agenda.items.map(it => {
          let resultado = null;
          if (it.tipo === 'votacion_documental') {
            const av = approvals.find(a => a.approval_vote_id === it.approval_vote_id) || approvals.find(a => a.punto_orden_dia === it.numero);
            if (av) resultado = { tipo: 'votacion_documental', nombre: av.nombre, total_padron: av.total_padron, votos_a_favor: av.votos_a_favor, votos_en_contra: av.votos_en_contra, abstenciones: av.abstenciones, decision: av.decision };
          } else if (it.tipo === 'eleccion') {
            const el = elections.find(e => e.election_id === it.election_id) || elections.find(e => e.punto_orden_dia === it.numero);
            if (el) resultado = { tipo: 'eleccion', nombre: el.nombre, total_padron: el.total_padron, votos_emitidos: el.votos_emitidos, candidatos: el.resultado?.candidatos || [], ganador_nombre: el.resultado?.ganador_nombre || null, empate: el.resultado?.empate || false };
          }
          return { numero: it.numero, nombre: it.nombre, tipo: it.tipo, status: it.status, emergente: it.emergente, iniciado_at: it.iniciado_at, completado_at: it.completado_at, narrative: narrMap[it.agenda_item_id] || null, resultado };
        });
      }
    } catch (e) { payload.orden_del_dia = []; }

    return payload;
  }

  /** Valida PC-01 a PC-06. */
  static async validateActaPreconditions(meetingId) {
    const meeting = await this._getMeeting(meetingId);
    const pc = [];
    const cerrada = meeting && (meeting.status === 'completed' || meeting.status === 'closed' || meeting.status === 'archived');
    pc.push({ codigo: 'PC-01', descripcion: 'Sesión cerrada', cumplida: !!cerrada });

    let agendaCerrada = false, rolesOk = false, rolesIncompletos = [];
    try {
      const AgendaService = require('./assemblyAgendaService');
      const header = await AgendaService.getAgendaHeader(meetingId);
      agendaCerrada = header && header.status === 'closed';
    } catch (e) {}
    pc.push({ codigo: 'PC-02', descripcion: 'Agenda cerrada', cumplida: !!agendaCerrada });

    try {
      const RolesService = require('./assemblyRolesService');
      const acta = await RolesService.getRolesForActa(meetingId);
      rolesIncompletos = acta.roles_incompletos || [];
      // Para el acta se exigen al menos presidente y secretario
      rolesOk = !rolesIncompletos.includes('presidente_asamblea') && !rolesIncompletos.includes('secretario_asamblea');
    } catch (e) {}
    pc.push({ codigo: 'PC-03', descripcion: 'Presidente y Secretario asignados', cumplida: !!rolesOk, detalle: rolesIncompletos });

    let sinVotAbierta = true, sinElecAbierta = true;
    try { const [r] = await db.execute(`SELECT id FROM approval_votes WHERE meeting_id = ? AND status = 'open' LIMIT 1`, [meetingId]); sinVotAbierta = r.length === 0; } catch (e) {}
    try { const [r] = await db.execute(`SELECT id FROM elections WHERE meeting_id = ? AND status = 'open' LIMIT 1`, [meetingId]); sinElecAbierta = r.length === 0; } catch (e) {}
    pc.push({ codigo: 'PC-04', descripcion: 'Sin votaciones documentales abiertas', cumplida: sinVotAbierta });
    pc.push({ codigo: 'PC-05', descripcion: 'Sin elecciones abiertas', cumplida: sinElecAbierta });

    let quorumRegistrado = false;
    try { const [r] = await db.execute(`SELECT id FROM quorum_log WHERE meeting_id = ? LIMIT 1`, [meetingId]); quorumRegistrado = r.length > 0; } catch (e) {}
    pc.push({ codigo: 'PC-06', descripcion: 'Quórum registrado', cumplida: quorumRegistrado });

    return { valida: pc.every(p => p.cumplida), precondiciones: pc };
  }

  static async saveNarrative(meetingId, agendaItemId, narrativeText, operatorId) {
    const acta = await this._getActa(meetingId);
    if (acta && acta.status === 'final') { const err = new Error('El Acta está cerrada. No puede modificarse.'); err.status = 423; throw err; }
    if (narrativeText && narrativeText.length > 2000) { const err = new Error('Narrativa supera el máximo permitido (2000 caracteres).'); err.status = 400; throw err; }

    const [existing] = await db.execute(`SELECT id FROM acta_narratives WHERE meeting_id = ? AND agenda_item_id = ? LIMIT 1`, [meetingId, agendaItemId]);
    if (existing.length) {
      await db.execute(`UPDATE acta_narratives SET narrative_text = ?, actualizado_at = NOW() WHERE id = ?`, [narrativeText, existing[0].id]);
    } else {
      await db.execute(`INSERT INTO acta_narratives (meeting_id, agenda_item_id, narrative_text, ingresado_por, ingresado_at, actualizado_at) VALUES (?, ?, ?, ?, NOW(), NOW())`, [meetingId, agendaItemId, narrativeText, operatorId]);
    }
    return { agenda_item_id: agendaItemId, guardado: true };
  }

  static async getNarratives(meetingId) {
    const [rows] = await db.execute(`SELECT agenda_item_id, narrative_text, ingresado_por, actualizado_at FROM acta_narratives WHERE meeting_id = ?`, [meetingId]);
    return rows;
  }

  static async getActaPreview(meetingId) {
    const payload = await this.buildActaPayload(meetingId);
    const acta = await this._getActa(meetingId);
    return { payload, acta: acta ? { acta_id: acta.id, status: acta.status, version_borrador: acta.version_borrador, pdf_hash: acta.pdf_hash } : null };
  }

  // ── Generación de PDF con jsPDF (texto Latin-1 seguro) ─────────────────────
  static _pdfFromPayload(payload) {
    const { jsPDF } = require('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 18;
    const LH = 6;
    const check = (need = 8) => { if (y + need > 285) { doc.addPage(); y = 18; } };
    const line = (txt, size = 10, bold = false, color = [0, 0, 0]) => {
      check();
      doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...color);
      const lines = doc.splitTextToSize(String(txt ?? ''), pageW - margin * 2);
      doc.text(lines, margin, y); y += LH * lines.length;
    };
    const sep = () => { check(); doc.setDrawColor(180); doc.line(margin, y, pageW - margin, y); y += 4; };
    const fecha = (d) => d ? new Date(d).toLocaleString('es-ES') : '-';

    // 1. Encabezado
    doc.setFillColor(30, 41, 59); doc.rect(0, 0, pageW, 10, 'F');
    line('ASOCOLCI — ASAMBLEA GENERAL DE DELEGADOS', 14, true);
    line(payload.meta.titulo || '', 11, true);
    line(`Sesion ${payload.meta.tipo_sesion || 'ordinaria'} · Inicio: ${fecha(payload.meta.hora_inicio)}`, 9, false, [90, 90, 90]);
    if (payload.meta.lugar) line(`Lugar: ${payload.meta.lugar}`, 9, false, [90, 90, 90]);
    y += 2; sep();

    // 2. Quórum
    line('VERIFICACION DE QUORUM', 12, true);
    if (payload.quorum && !payload.quorum.disponible) {
      const q = payload.quorum;
      line(`Estado: ${q.estado} · Cursos habilitados: ${q.cursos_habilitados} · Cursos representados: ${q.cursos_representados}`);
      line(`Principales presentes: ${q.principales_presentes} · Suplentes actuando: ${q.suplentes_actuando} · Apoderados: ${q.apoderados}`);
      line(`Quorum Momento 1: ${q.quorum_m1} · Momento 2: ${q.quorum_m2} · Total principales: ${q.total_principales}`);
    } else { line('Sin datos de quorum.'); }
    y += 2; sep();

    // 3. Mesa directiva
    line('MESA DIRECTIVA', 12, true);
    const pres = payload.mesa_directiva?.presidente;
    const sec = payload.mesa_directiva?.secretario;
    line(`Presidente: ${pres ? pres.nombre + ' (' + pres.tipo + ')' : 'No designado'}`);
    line(`Secretario(a): ${sec ? sec.nombre + ' (' + sec.tipo + ')' : 'No designado'}`);
    y += 2; sep();

    // 4. Orden del día (lista)
    line('ORDEN DEL DIA', 12, true);
    (payload.orden_del_dia || []).forEach(it => {
      line(`${it.numero}. ${it.nombre} — ${String(it.status || '').toUpperCase()}${it.emergente ? ' (emergente)' : ''}`, 9);
    });
    y += 2; sep();

    // 5. Desarrollo
    line('DESARROLLO DE LA SESION', 12, true);
    (payload.orden_del_dia || []).forEach(it => {
      check(20);
      line(`PUNTO ${it.numero} — ${it.nombre} [${it.tipo}]`, 10, true);
      if (it.narrative) line(it.narrative, 9, false, [60, 60, 60]);
      if (it.resultado && it.resultado.tipo === 'votacion_documental') {
        const r = it.resultado;
        line(`Votacion: A favor ${r.votos_a_favor} · En contra ${r.votos_en_contra} · Abstenciones ${r.abstenciones} · Padron ${r.total_padron}`, 9);
        line(`DECISION: ${r.decision}`, 10, true, r.decision === 'APROBADO' ? [5, 150, 105] : [220, 38, 38]);
      } else if (it.resultado && it.resultado.tipo === 'eleccion') {
        const r = it.resultado;
        (r.candidatos || []).forEach(c => line(`   ${c.nombre}: ${c.votos} votos`, 9));
        line(r.empate ? 'RESULTADO: EMPATE' : `GANADOR: ${r.ganador_nombre || 'N/A'}`, 10, true, [5, 150, 105]);
      }
      line(`Estado: ${String(it.status || '').toUpperCase()} ${it.completado_at ? '· ' + fecha(it.completado_at) : ''}`, 8, false, [120, 120, 120]);
      y += 2;
    });
    sep();

    // 6. Poderes
    line('PODERES DE REPRESENTACION', 12, true);
    if ((payload.poderes || []).length === 0) line('No se registraron poderes en esta sesion.');
    else payload.poderes.forEach(p => line(`${p.poderdante_nombre} -> ${p.apoderado_nombre || '-'} (Curso: ${p.curso}) — ${String(p.status || '').toUpperCase()}`, 9));
    y += 2; sep();

    // 7. Comisión
    line('COMISION VERIFICADORA Y APROBADORA DEL ACTA', 12, true);
    const com = [...(payload.comisiones?.verificadora || []), ...(payload.comisiones?.aprobadora || [])];
    if (com.length === 0) line('No se designo comision.');
    else com.forEach(c => line(`· ${c.nombre} (${c.tipo})`, 9));
    y += 2; sep();

    // 8. Cierre
    line('CIERRE DE LA SESION', 12, true);
    const total = (payload.orden_del_dia || []).length;
    const omitidos = (payload.orden_del_dia || []).filter(i => i.status === 'omitido').length;
    line(`Total de puntos: ${total} · Omitidos: ${omitidos}`);
    y += 4; sep();

    // 9. Firmas
    check(30);
    line('FIRMAS', 12, true); y += 12;
    doc.setDrawColor(60);
    doc.line(margin, y, margin + 70, y); doc.line(pageW - margin - 70, y, pageW - margin, y); y += 5;
    doc.setFontSize(9); doc.setTextColor(0, 0, 0);
    doc.text(pres?.nombre || '____________', margin, y); doc.text(sec?.nombre || '____________', pageW - margin - 70, y); y += 4;
    doc.setTextColor(120, 120, 120);
    doc.text('Presidente de la Asamblea', margin, y); doc.text('Secretario(a) de la Asamblea', pageW - margin - 70, y);

    // Pie con fecha de generación
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i); doc.setFontSize(7); doc.setTextColor(150, 150, 150);
      doc.text(`BOARD QUORUM · Acta generada ${fecha(payload.meta.fecha_generacion)} · Pag ${i}/${pages}`, margin, 292);
    }

    return Buffer.from(doc.output('arraybuffer'));
  }

  /** Genera el PDF del borrador (incrementa versión). Retorna Buffer. */
  static async generateActaPDF(meetingId, operatorId) {
    const acta = await this._getActa(meetingId);
    // Si es final, devolver el PDF persistido
    if (acta && acta.status === 'final' && acta.pdf_base64) {
      return Buffer.from(acta.pdf_base64, 'base64');
    }
    const payload = await this.buildActaPayload(meetingId);
    const pdf = this._pdfFromPayload(payload);
    if (acta) {
      await db.execute(`UPDATE actas SET version_borrador = version_borrador + 1, contenido_json = ?, updated_at = NOW() WHERE id = ?`, [JSON.stringify(payload), acta.id]);
      await this.logActaEvent('ACTA_BORRADOR_GENERADA', meetingId, acta.id, operatorId, (acta.version_borrador || 0) + 1);
    }
    return pdf;
  }

  /** Genera el Acta definitiva (irreversible, solo admin_master). */
  static async closeActa(meetingId, adminMasterId) {
    const acta = await this._getActa(meetingId);
    if (acta && acta.status === 'final') { const err = new Error('Ya existe un Acta definitiva para esta sesión.'); err.status = 409; throw err; }

    const pre = await this.validateActaPreconditions(meetingId);
    if (!pre.valida) {
      const err = new Error('No se cumplen todas las precondiciones para el Acta definitiva.');
      err.status = 409; err.detalle = pre.precondiciones.filter(p => !p.cumplida); throw err;
    }

    // Asegurar que existe el registro de acta
    let actaId = acta?.id;
    if (!actaId) { const init = await this.initActa(meetingId, adminMasterId); actaId = init.acta_id; }

    const payload = await this.buildActaPayload(meetingId);
    const pdf = this._pdfFromPayload(payload);
    const base64 = pdf.toString('base64');
    const hash = crypto.createHash('sha256').update(pdf).digest('hex');

    await db.execute(
      `UPDATE actas SET status = 'final', contenido_json = ?, pdf_base64 = ?, pdf_hash = ?, cerrada_por = ?, cerrada_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [JSON.stringify(payload), base64, hash, adminMasterId, actaId]
    );
    await this.logActaEvent('ACTA_DEFINITIVA_GENERADA', meetingId, actaId, adminMasterId, null, `hash ${hash.slice(0, 16)}`);
    return { acta_id: actaId, status: 'final', pdf_hash: hash };
  }
}

module.exports = AssemblyActaService;
