const db = require('../config/database');

/**
 * MD-15 — Habilitación dinámica del voto en Asamblea.
 *
 * El derecho a voto NO se deriva del rol estático guardado en el registro
 * (`puede_votar`, PRINCIPAL / SUPLENTE), sino de quién ejerce **efectivamente**
 * la representación del curso en ese momento:
 *
 *   Principal presente                        -> vota el Principal
 *   Principal ausente   + Suplente presente   -> vota el Suplente actuando
 *   Principal INEXISTENTE + Suplente presente -> vota el Suplente actuando
 *   Principal + Suplente presentes            -> vota el Principal
 *
 * Y siempre: un máximo de un voto efectivo por curso.
 *
 * Por qué hacía falta: el importador marca `puede_votar = false` en todo
 * Suplente, y esa comprobación corría ANTES de mirar la representación. Por eso
 * la Suplente de CUARTO F —cuyo curso no tiene Principal en el maestro— quedó
 * bloqueada aunque era la representante efectiva, y con un mensaje de Junta
 * Directiva que además nombraba el curso como si fuera una sesión.
 */
class AssemblyVotingService {
  static _norm(s) {
    return String(s ?? '').toUpperCase().trim();
  }

  /**
   * ¿Algún Delegado de este curso ya emitió voto en esta votación?
   * Se consulta por curso, no por persona: el límite es del curso.
   */
  static async cursoYaVoto(votingId, meetingId, curso) {
    const AssemblyQuorumService = require('./assemblyQuorumService');
    const ctx = await AssemblyQuorumService._getMeetingContext(meetingId);
    if (!ctx?.product_id) return null;

    const isPG = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCond = isPG ? 'm.active = true' : 'm.active = 1';

    try {
      const [rows] = await db.execute(
        `SELECT v.id, m.name, m.numero_documento
         FROM votes v
         JOIN members m ON m.id = v.member_id
         WHERE v.voting_id = ? AND m.product_id = ?
           AND UPPER(TRIM(m.rol_organico)) = ? AND ${activeCond}
         LIMIT 1`,
        [votingId, ctx.product_id, this._norm(curso)]
      );
      return rows[0] || null;
    } catch (e) {
      console.warn('[assembly] no se pudo verificar el voto del curso:', e.message);
      return null;
    }
  }

  /**
   * Resuelve si una persona puede votar, según la representación efectiva.
   *
   * Devuelve { permitido, status, curso, representante, mensaje }.
   * `status` reutiliza los códigos ya conocidos por el frontend público.
   */
  static async checkEligibility({ votingId, meetingId, member }) {
    const AssemblyQuorumService = require('./assemblyQuorumService');

    // Administración, Contabilidad y Revisoría Fiscal asisten pero no votan
    if (AssemblyQuorumService.isNonComputable(member.tipo_participante)) {
      return {
        permitido: false,
        status: 'NO_VOTE',
        curso: member.rol_organico || null,
        mensaje: 'Su participación queda registrada en la Asamblea, pero esta condición ' +
                 'no genera representación ni derecho a voto.'
      };
    }

    const curso = this._norm(member.rol_organico);
    if (!curso) {
      return {
        permitido: false,
        status: 'NO_VOTE',
        curso: null,
        mensaje: 'Su registro no tiene un curso asociado en el maestro de Delegados, ' +
                 'así que no puede resolverse la representación. Informe a la mesa.'
      };
    }

    const status = await AssemblyQuorumService.getCourseRepresentationStatus(meetingId);
    const estadoCurso = status.find(c => this._norm(c.curso) === curso);

    if (!estadoCurso) {
      return {
        permitido: false,
        status: 'NO_VOTE',
        curso,
        mensaje: `El curso ${curso} no forma parte del maestro vigente de la Asamblea.`
      };
    }

    if (!estadoCurso.representado) {
      return {
        permitido: false,
        status: 'NOT_PRESENT',
        curso,
        mensaje: `El curso ${curso} no tiene una representación activa en este momento.`
      };
    }

    // ── Un solo voto por curso ────────────────────────────────────────────────
    const votoPrevio = await this.cursoYaVoto(votingId, meetingId, curso);
    if (votoPrevio) {
      const esElMismo = Number(votoPrevio.id) && String(votoPrevio.numero_documento || '') === String(member.numero_documento || '');
      return {
        permitido: false,
        status: 'ALREADY_VOTED',
        curso,
        mensaje: esElMismo
          ? 'Usted ya emitió el voto de este curso en esta votación.'
          : `El curso ${curso} ya emitió su voto en esta votación, a través de ${votoPrevio.name}. ` +
            'Cada curso dispone de un único voto.'
      };
    }

    // ── ¿Es esta persona la representante efectiva? ───────────────────────────
    const esRepresentante = Number(estadoCurso.votante_id) === Number(member.id);

    if (!esRepresentante) {
      const rep = estadoCurso.votante_nombre || 'otro Delegado';
      if (estadoCurso.tipo_votante === 'principal') {
        return {
          permitido: false,
          status: 'SUPLENTE_SIN_VOTO',
          curso,
          representante: rep,
          mensaje: 'No es posible registrar un voto adicional. El Delegado Principal del ' +
                   `curso ${curso} está presente y ejerce actualmente la representación. ` +
                   'Su asistencia permanece registrada, pero el Suplente no puede votar ' +
                   'mientras el Principal ejerza la representación.'
        };
      }
      return {
        permitido: false,
        status: 'SUPLENTE_SIN_VOTO',
        curso,
        representante: rep,
        mensaje: `La representación del curso ${curso} la ejerce actualmente ${rep}. ` +
                 'Cada curso dispone de una única representación.'
      };
    }

    // ── Representante efectivo: habilitado ────────────────────────────────────
    if (estadoCurso.tipo_votante === 'suplente') {
      return {
        permitido: true,
        status: 'SUPLENTE_ACTUANDO',
        curso,
        mensaje: estadoCurso.principal_inexistente
          ? 'Delegado Suplente reconocido. El curso no tiene un Delegado Principal ' +
            'asociado en el maestro vigente, así que usted ejerce la representación ' +
            'del curso y se encuentra habilitado para votar.'
          : 'Delegado Suplente reconocido. El Delegado Principal no se encuentra ' +
            'presente. Usted ejerce actualmente la representación del curso y se ' +
            'encuentra habilitado para votar.'
      };
    }

    return { permitido: true, status: 'OK', curso, mensaje: null };
  }

  /**
   * MD-10 — Identidad exacta.
   *
   * Una fila del maestro puede tener dos cédulas (madre y padre) y ambas
   * resuelven el mismo registro. La representación es única, pero la identidad
   * NO puede sustituirse: si la persona se autenticó con la cédula del segundo
   * progenitor, en pantalla debe aparecer esa persona, no la primera de la fila.
   */
  static identidadExacta(member) {
    const usoSecundario = member?.documento_usado === 'secundario';
    return {
      id: member.id,
      name: usoSecundario ? (member.secondary_name || member.name) : member.name,
      numero_documento: usoSecundario
        ? (member.secondary_document || member.numero_documento)
        : member.numero_documento,
      documento_usado: member?.documento_usado || 'primario',
      // Se conserva el titular de la fila para la trazabilidad del núcleo
      nucleo_titular: member.name,
      nucleo_documento: member.numero_documento
    };
  }
}

module.exports = AssemblyVotingService;
