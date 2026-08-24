const db = require('../config/database');

/**
 * MD-02 — Activación, control y trazabilidad del "Momento Siguiente".
 *
 * La Asamblea tiene una hora oficial de inicio (meetings.date). Si llegada esa hora
 * no se alcanzó el quórum inicial, un usuario operativo autorizado puede aplicar el
 * régimen de Momento Siguiente por indicación de Revisoría Fiscal.
 *
 * Reglas de fondo:
 *   - El universo de elegibles NO cambia. Cambia únicamente el mínimo requerido:
 *       quorum_inicial    = CEIL(N / 2) + 1     (MD-06: "mitad más uno")
 *       momento_siguiente = CEIL(N * 0.20)
 *     Base validada agosto 2026: N = 85 -> 44 y 17.
 *   - La ventana termina UNA HORA DESPUÉS DE LA HORA OFICIAL CONVOCADA,
 *     nunca una hora después del clic.
 *   - Todo queda trazado: quién, cuándo, con qué cifras, y el resultado posterior.
 */

const VENTANA_MS = 60 * 60 * 1000; // 1 hora desde la hora oficial de convocatoria

class AssemblyMomentService {
  static get isPostgreSQL() {
    return !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
  }

  static async _getMeeting(meetingId) {
    const [rows] = await db.execute(
      `SELECT id, client_id, product_id, title, date, type, status FROM meetings WHERE id = ? LIMIT 1`,
      [meetingId]
    );
    return rows[0] || null;
  }

  /** Hora oficial de inicio = fecha/hora de la convocatoria registrada en la reunión. */
  static getHoraOficial(meeting) {
    if (!meeting?.date) return null;
    const d = new Date(meeting.date);
    return isNaN(d.getTime()) ? null : d;
  }

  /** Hora límite del Momento Siguiente: hora oficial + 1 hora. NO depende del clic. */
  static getHoraLimite(meeting) {
    const oficial = this.getHoraOficial(meeting);
    return oficial ? new Date(oficial.getTime() + VENTANA_MS) : null;
  }

  /**
   * Estado actual del Momento Siguiente para una reunión.
   * Devuelve siempre un objeto (aplicado:false si nunca se activó), o null si la
   * tabla todavía no existe en la base.
   */
  static async getMomentState(meetingId) {
    const meeting = await this._getMeeting(meetingId);
    if (!meeting) return null;

    const horaOficial = this.getHoraOficial(meeting);
    const horaLimite = this.getHoraLimite(meeting);
    const ahora = new Date();

    let row = null;
    try {
      const [rows] = await db.execute(
        `SELECT * FROM assembly_moment_events WHERE meeting_id = ? ORDER BY id DESC LIMIT 1`,
        [meetingId]
      );
      row = rows[0] || null;
    } catch (e) {
      // La tabla se crea al arrancar el servidor; si aún no existe, no se bloquea el panel.
      return {
        aplicado: false,
        disponible: false,
        hora_oficial: horaOficial ? horaOficial.toISOString() : null,
        hora_limite: horaLimite ? horaLimite.toISOString() : null,
        motivo_no_disponible: 'tabla_no_disponible'
      };
    }

    const horaOficialAlcanzada = horaOficial ? ahora >= horaOficial : false;
    const ventanaVencida = horaLimite ? ahora > horaLimite : false;

    if (!row) {
      return {
        aplicado: false,
        // Solo se ofrece cuando ya llegó la hora oficial y aún no venció la ventana.
        disponible: horaOficialAlcanzada && !ventanaVencida,
        hora_oficial: horaOficial ? horaOficial.toISOString() : null,
        hora_limite: horaLimite ? horaLimite.toISOString() : null,
        hora_oficial_alcanzada: horaOficialAlcanzada,
        ventana_vencida: ventanaVencida,
        motivo_no_disponible: !horaOficialAlcanzada
          ? 'antes_de_hora_oficial'
          : ventanaVencida ? 'ventana_vencida' : null
      };
    }

    return {
      aplicado: true,
      disponible: false,
      moment_event_id: row.id,
      aplicado_por_id: row.operator_id,
      aplicado_por_nombre: row.operator_name,
      aplicado_por_rol: row.operator_role,
      aplicado_at: row.applied_at,
      hora_oficial: row.hora_oficial || (horaOficial ? horaOficial.toISOString() : null),
      hora_limite: row.hora_limite || (horaLimite ? horaLimite.toISOString() : null),
      elegibles: Number(row.elegibles || 0),
      quorum_inicial: Number(row.quorum_inicial || 0),
      presentes_al_aplicar: Number(row.presentes_al_aplicar || 0),
      quorum_momento_siguiente: Number(row.quorum_momento_siguiente || 0),
      alcanzado: row.alcanzado === true || row.alcanzado === 1,
      alcanzado_at: row.alcanzado_at,
      presentes_al_alcanzar: row.presentes_al_alcanzar != null ? Number(row.presentes_al_alcanzar) : null,
      cerrado_sin_quorum: row.cerrado_sin_quorum === true || row.cerrado_sin_quorum === 1,
      cerrado_at: row.cerrado_at,
      ventana_vencida: ventanaVencida
    };
  }

  /**
   * Aplica el Momento Siguiente. Registra la foto completa del quórum en ese instante.
   * No recalcula la ventana: la hora límite sigue atada a la hora oficial convocada.
   */
  static async applyMomentoSiguiente(meetingId, operator, { confirmado = false } = {}) {
    if (!confirmado) {
      const err = new Error('Se requiere confirmación explícita para aplicar el Momento Siguiente.');
      err.code = 'CONFIRMACION_REQUERIDA';
      throw err;
    }

    const meeting = await this._getMeeting(meetingId);
    if (!meeting) {
      const err = new Error('Reunión no encontrada');
      err.code = 'NOT_FOUND';
      throw err;
    }

    const QuorumService = require('./quorumService');
    if (QuorumService.normalizeMeetingType(meeting.type) !== 'asamblea') {
      const err = new Error('El Momento Siguiente solo aplica a reuniones de Asamblea.');
      err.code = 'TIPO_INVALIDO';
      throw err;
    }

    const previo = await this.getMomentState(meetingId);
    if (previo?.aplicado) {
      const err = new Error('El Momento Siguiente ya fue aplicado para esta Asamblea.');
      err.code = 'YA_APLICADO';
      throw err;
    }

    const horaOficial = this.getHoraOficial(meeting);
    const horaLimite = this.getHoraLimite(meeting);
    const ahora = new Date();

    if (horaOficial && ahora < horaOficial) {
      const err = new Error(
        `Aún no llega la hora oficial de inicio (${horaOficial.toLocaleString('es-CO')}). ` +
        'Hasta ese momento la Asamblea se evalúa bajo el quórum inicial.'
      );
      err.code = 'ANTES_DE_HORA_OFICIAL';
      throw err;
    }

    // La ventana está atada a la hora convocada, no al clic. Si ya venció, no
    // tiene efecto aplicarla: se rechaza en vez de crear un registro nacido cerrado.
    if (horaLimite && ahora > horaLimite) {
      const err = new Error(
        `La ventana del Momento Siguiente venció a las ${horaLimite.toLocaleString('es-CO')} ` +
        `(una hora después de la hora oficial convocada, ${horaOficial.toLocaleString('es-CO')}). ` +
        'Ya no es posible aplicarla.'
      );
      err.code = 'VENTANA_VENCIDA';
      throw err;
    }

    const AssemblyQuorumService = require('./assemblyQuorumService');
    const elegibles = await AssemblyQuorumService.getTotalPrincipals(meeting.product_id);
    if (!elegibles || elegibles <= 0) {
      const err = new Error('El maestro de Delegados no tiene Principales habilitados. No es posible aplicar el Momento Siguiente.');
      err.code = 'SIN_MAESTRO';
      throw err;
    }

    const presentes = await AssemblyQuorumService.getRepresentedCoursesCount(meetingId);
    // MD-06: "mitad más uno". Para N impar se exige el primer entero que supera
    // N/2 + 1 (85 -> 42,5 + 1 = 43,5 -> 44).
    const quorumInicial = Math.ceil(elegibles / 2) + 1;
    const quorumSiguiente = Math.ceil(elegibles * 0.20);

    const [ins] = await db.execute(
      `INSERT INTO assembly_moment_events
         (meeting_id, operator_id, operator_name, operator_role, applied_at,
          hora_oficial, hora_limite, elegibles, quorum_inicial,
          presentes_al_aplicar, quorum_momento_siguiente, alcanzado, cerrado_sin_quorum, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${this.isPostgreSQL ? 'false, false' : '0, 0'}, NOW())`,
      [
        meetingId,
        operator?.id ?? null,
        operator?.name || operator?.email || null,
        operator?.role || null,
        ahora,
        horaOficial,
        horaLimite,
        elegibles,
        quorumInicial,
        presentes,
        quorumSiguiente
      ]
    );

    await AssemblyQuorumService.logQuorumEvent(
      meetingId, 'MOMENTO_SIGUIENTE_APLICADO', null, operator?.id ?? null,
      { cursos: presentes, estado: 'QUORUM_INICIAL' },
      { cursos: presentes, estado: 'MOMENTO_SIGUIENTE' },
      `Aplicado por ${operator?.name || operator?.email || 'usuario'} (${operator?.role || 's/rol'}). ` +
      `Elegibles ${elegibles}; quórum inicial ${quorumInicial}; presentes ${presentes}; ` +
      `nuevo mínimo ${quorumSiguiente}; hora límite ${horaLimite ? horaLimite.toISOString() : 's/hora'}.`
    );

    // Puede quedar alcanzado de inmediato si ya había presentes suficientes.
    await this.evaluateMomentOutcome(meetingId);

    return await this.getMomentState(meetingId);
  }

  /**
   * Reevalúa el resultado del Momento Siguiente tras un cambio de asistencia o
   * al consultar el panel. Marca "alcanzado" con hora exacta, o cierra la ventana
   * sin quórum cuando vence la hora límite.
   *
   * Nota: quórum alcanzado ≠ Asamblea instalada. Aquí solo se certifica el quórum.
   */
  static async evaluateMomentOutcome(meetingId) {
    let row;
    try {
      const [rows] = await db.execute(
        `SELECT * FROM assembly_moment_events WHERE meeting_id = ? ORDER BY id DESC LIMIT 1`,
        [meetingId]
      );
      row = rows[0];
    } catch (e) {
      return null;
    }
    if (!row) return null;

    const yaAlcanzado = row.alcanzado === true || row.alcanzado === 1;
    const yaCerrado = row.cerrado_sin_quorum === true || row.cerrado_sin_quorum === 1;
    if (yaAlcanzado || yaCerrado) return row;

    const AssemblyQuorumService = require('./assemblyQuorumService');
    const presentes = await AssemblyQuorumService.getRepresentedCoursesCount(meetingId);
    const minimo = Number(row.quorum_momento_siguiente || 0);
    const ahora = new Date();
    const limite = row.hora_limite ? new Date(row.hora_limite) : null;
    const trueVal = this.isPostgreSQL ? 'true' : '1';

    if (minimo > 0 && presentes >= minimo) {
      await db.execute(
        `UPDATE assembly_moment_events
           SET alcanzado = ${trueVal}, alcanzado_at = ?, presentes_al_alcanzar = ?
         WHERE id = ?`,
        [ahora, presentes, row.id]
      );
      await AssemblyQuorumService.logQuorumEvent(
        meetingId, 'MOMENTO_SIGUIENTE_ALCANZADO', null, null,
        {}, { cursos: presentes, estado: 'MOMENTO_SIGUIENTE' },
        `Quórum de Momento Siguiente alcanzado: ${presentes} representaciones (mínimo ${minimo}).`
      );
      return { ...row, alcanzado: true, alcanzado_at: ahora, presentes_al_alcanzar: presentes };
    }

    if (limite && ahora > limite) {
      await db.execute(
        `UPDATE assembly_moment_events
           SET cerrado_sin_quorum = ${trueVal}, cerrado_at = ?, presentes_al_alcanzar = ?
         WHERE id = ?`,
        [ahora, presentes, row.id]
      );
      await AssemblyQuorumService.logQuorumEvent(
        meetingId, 'MOMENTO_SIGUIENTE_CERRADO', null, null,
        {}, { cursos: presentes, estado: 'SIN_QUORUM' },
        `Momento Siguiente finalizado sin quórum: ${presentes} representaciones (mínimo ${minimo}). ` +
        `Hora límite ${limite.toISOString()}.`
      );
      return { ...row, cerrado_sin_quorum: true, cerrado_at: ahora };
    }

    return row;
  }
}

module.exports = AssemblyMomentService;
module.exports.VENTANA_MS = VENTANA_MS;
