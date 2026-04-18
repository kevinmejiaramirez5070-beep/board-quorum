const Attendance = require('../models/Attendance');
const Meeting = require('../models/Meeting');
const Member = require('../models/Member');

/** Junta Directiva ASOCOLCI — preview.html / cliente 11 abr 2026: mínimo fijo, NO % sobre 20 personas */
const JD_QUORUM_MIN = 7;
const JD_VOTING_SLOTS = 12;

/**
 * Servicio para validar quórum y calcular mayorías según las reglas de ASOCOLCI
 */

class QuorumService {
  /**
   * Normaliza tipo de reunión. Si viene vacío (muchos creates antiguos sin campo type),
   * se asume Junta Directiva — era la causa del bug 8/11 (floor(20/2)+1).
   */
  static normalizeMeetingType(type) {
    if (type == null || String(type).trim() === '') return 'junta_directiva';
    const t = String(type).toLowerCase().trim().replace(/-/g, '_');
    if (t === 'junta directiva' || t === 'juntadirectiva') return 'junta_directiva';
    return t;
  }

  /**
   * Calcula el quórum requerido según el tipo de reunión
   * @param {string} meetingType - Tipo de reunión: 'junta_directiva' o 'asamblea'
   * @param {number} totalMembers - Total de miembros con derecho a voto
   * @returns {number} - Quórum requerido
   */
  static calculateRequiredQuorum(meetingType, totalMembers = null) {
    const mt = this.normalizeMeetingType(meetingType);
    if (mt === 'junta_directiva') {
      return JD_QUORUM_MIN;
    }
    if (mt === 'asamblea') {
      if (!totalMembers || totalMembers === 0) {
        throw new Error('Total de miembros requerido para calcular quórum de asamblea');
      }
      return Math.floor(totalMembers / 2) + 1;
    }
    if (mt === 'comite' || mt === 'consejo') {
      if (totalMembers && totalMembers > 0) {
        return Math.floor(totalMembers / 2) + 1;
      }
      return JD_QUORUM_MIN;
    }
    return totalMembers ? Math.floor(totalMembers / 2) + 1 : 1;
  }

  /**
   * Cuenta los miembros presentes con derecho a voto
   * @param {number} meetingId - ID de la reunión
   * @returns {Promise<number>} - Número de miembros presentes con derecho a voto
   */
  static async countPresentWithVote(meetingId) {
    // Usar el método específico que cuenta solo quienes tienen derecho a voto
    return await Attendance.countPresentWithVote(meetingId);
  }

  /**
   * Valida si hay quórum suficiente para instalar la sesión
   * @param {number} meetingId - ID de la reunión
   * @param {string} meetingType - Tipo de reunión
   * @param {number} totalMembers - Total de miembros (para asamblea)
   * @returns {Promise<Object>} - { valid: boolean, present: number, required: number, message: string }
   */
  static async validateQuorumForInstallation(meetingId, meetingType, totalMembers = null) {
    const mt = this.normalizeMeetingType(meetingType);
    const present = await this.countPresentWithVote(meetingId);

    let totalForAssembly = totalMembers;
    if (mt === 'asamblea' && (totalForAssembly == null || totalForAssembly === 0)) {
      const meeting = await Meeting.findById(meetingId, null);
      if (meeting) {
        totalForAssembly = await Member.countEligibleForQuorum(meeting.client_id, meeting.product_id ?? null);
        if (totalForAssembly === 0) {
          totalForAssembly = await Member.countEligibleForQuorum(meeting.client_id, null);
        }
      }
    }

    const required = this.calculateRequiredQuorum(mt, totalForAssembly);
    const valid = present >= required;

    let message = '';
    if (mt === 'junta_directiva') {
      message = valid
        ? `Quórum válido: ${present} votos computables (mínimo ${required} para Junta Directiva, ${JD_VOTING_SLOTS} cargos con voto).`
        : `Quórum insuficiente: ${present} votos computables (mínimo requerido: ${required}). Para Junta Directiva se requieren mínimo 7 miembros presentes, entre principales o suplentes que actúen como principales, incluyendo el voto institucional de la Junta de Vigilancia.`;
    } else {
      message = valid
        ? `Quórum válido: ${present} presentes (mínimo requerido: ${required})`
        : `Quórum insuficiente: ${present} presentes (mínimo requerido: ${required})`;
    }

    return {
      valid,
      present,
      required,
      message
    };
  }

  /**
   * Valida si hay quórum para realizar una votación
   * @param {number} meetingId - ID de la reunión
   * @param {string} meetingType - Tipo de reunión
   * @param {number} totalMembers - Total de miembros (para asamblea)
   * @param {boolean} sessionInstalled - Si la sesión está instalada
   * @returns {Promise<Object>} - { valid: boolean, present: number, required: number, message: string }
   */
  static async validateQuorumForVoting(meetingId, meetingType, totalMembers = null, sessionInstalled = false) {
    if (!sessionInstalled) {
      return {
        valid: false,
        present: 0,
        required: 0,
        message: 'La sesión no ha sido instalada formalmente. No se pueden realizar votaciones sin una sesión válida.'
      };
    }

    return await this.validateQuorumForInstallation(meetingId, meetingType, totalMembers);
  }

  /**
   * Calcula la mayoría simple requerida
   * @param {number} votesEmitted - Número de votos emitidos
   * @returns {number} - Mayoría simple requerida (mitad + 1)
   */
  static calculateSimpleMajority(votesEmitted) {
    const emitted = Number(votesEmitted) || 0;
    // Mayoría simple = floor(votos_emitidos / 2) + 1
    // Si no hay votos emitidos, la mayoría requerida sería 1 (pero la decisión NO puede aprobarse sin votos).
    return Math.floor(emitted / 2) + 1;
  }

  /**
   * Valida si una decisión alcanza la mayoría simple
   * @param {number} affirmativeVotes - Votos afirmativos
   * @param {number} totalVotesEmitted - Total de votos emitidos
   * @returns {Object} - { approved: boolean, majority: number, affirmative: number, message: string }
   */
  static validateSimpleMajority(affirmativeVotes, totalVotesEmitted) {
    const total = Number(totalVotesEmitted) || 0;
    const affirmative = Number(affirmativeVotes) || 0;

    // Regla legal: con 0 votos emitidos no se puede certificar una aprobación.
    if (total === 0) {
      return {
        approved: false,
        majority: 1,
        affirmative,
        total,
        message: 'Sin votos emitidos. No es posible aprobar una decisión ni generar un acta válida.'
      };
    }

    const majority = this.calculateSimpleMajority(total);
    const approved = affirmative >= majority;

    const message = approved
      ? `Decisión APROBADA: ${affirmative} votos afirmativos (mayoría requerida: ${majority})`
      : `Decisión RECHAZADA: ${affirmative} votos afirmativos (mayoría requerida: ${majority})`;

    return {
      approved,
      majority,
      affirmative,
      total,
      message
    };
  }

  /**
   * Obtiene información completa del quórum para una reunión (BUG-01, BUG-02).
   * Total dinámico desde BD (elegibles con cuenta_quorum). Si total sale 0, fallback a client_id solo.
   */
  static async getQuorumInfo(meetingId, clientId) {
    const meeting = await Meeting.findById(meetingId, clientId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    const mt = this.normalizeMeetingType(meeting.type);
    const present = await this.countPresentWithVote(meetingId);

    let total;
    let required;
    let percentage;
    let valid;
    let organLabel;

    if (mt === 'asamblea') {
      total = await Member.countEligibleForQuorum(clientId, meeting.product_id ?? null);
      if (total === 0) total = await Member.countEligibleForQuorum(clientId, null);
      required = this.calculateRequiredQuorum('asamblea', total);
      valid = total > 0 && present >= required;
      percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      organLabel = 'Asamblea General';
    } else if (mt === 'junta_directiva') {
      total = JD_VOTING_SLOTS;
      required = JD_QUORUM_MIN;
      valid = present >= required;
      percentage = Math.round((present / JD_VOTING_SLOTS) * 100);
      organLabel = 'Junta Directiva';
    } else {
      total = await Member.countEligibleForQuorum(clientId, meeting.product_id ?? null);
      if (total === 0) total = await Member.countEligibleForQuorum(clientId, null);
      required = this.calculateRequiredQuorum(mt, total);
      valid = total > 0 && present >= required;
      percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      organLabel = mt === 'comite' ? 'Comité' : mt === 'consejo' ? 'Consejo' : mt;
    }

    const message = valid
      ? `Quórum válido: ${present} presentes (mínimo requerido: ${required})`
      : `Quórum insuficiente: ${present} presentes (mínimo requerido: ${required})`;

    return {
      present,
      required,
      total,
      percentage,
      valid,
      met: valid,
      type: meeting.type,
      typeNormalized: mt,
      organLabel,
      quorumRule: mt === 'junta_directiva' ? 'jd_fixed_min_7_of_12_slots' : mt === 'asamblea' ? 'assembly_majority' : 'collegial',
      message
    };
  }
}

module.exports = QuorumService;






