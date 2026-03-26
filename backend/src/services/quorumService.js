const Attendance = require('../models/Attendance');
const Meeting = require('../models/Meeting');
const Member = require('../models/Member');

/**
 * Servicio para validar quórum y calcular mayorías según las reglas de ASOCOLCI
 */

class QuorumService {
  /**
   * Calcula el quórum requerido según el tipo de reunión
   * @param {string} meetingType - Tipo de reunión: 'junta_directiva' o 'asamblea'
   * @param {number} totalMembers - Total de miembros con derecho a voto
   * @returns {number} - Quórum requerido
   */
  static calculateRequiredQuorum(meetingType, totalMembers = null) {
    if (meetingType === 'junta_directiva') {
      // Junta Directiva: 11 JD + 1 JV = 12 votos posibles
      // Quórum = (12 / 2) + 1 = 7
      return 7;
    } else if (meetingType === 'asamblea') {
      // Asamblea: floor(N/2) + 1
      if (!totalMembers || totalMembers === 0) {
        throw new Error('Total de miembros requerido para calcular quórum de asamblea');
      }
      return Math.floor(totalMembers / 2) + 1;
    }
    // Por defecto, mayoría simple
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
    const present = await this.countPresentWithVote(meetingId);
    const required = this.calculateRequiredQuorum(meetingType, totalMembers);
    
    const valid = present >= required;
    
    let message = '';
    if (meetingType === 'junta_directiva') {
      message = valid 
        ? `Quórum válido: ${present} presentes (mínimo requerido: ${required})`
        : `Quórum insuficiente: ${present} presentes (mínimo requerido: ${required}). Para iniciar una sesión de Junta Directiva se requieren mínimo 7 miembros presentes, entre principales o suplentes que actúen como principales, incluyendo el voto institucional de la Junta de Vigilancia.`;
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
    // Primero verificar que la sesión esté instalada
    if (!sessionInstalled) {
      return {
        valid: false,
        present: 0,
        required: 0,
        message: 'La sesión no ha sido instalada formalmente. No se pueden realizar votaciones sin una sesión válida.'
      };
    }

    // Para votar, se requiere el mismo quórum que para instalar la sesión
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

    const present = await this.countPresentWithVote(meetingId);
    let total = await Member.countEligibleForQuorum(clientId, meeting.product_id ?? null);
    if (total === 0) {
      total = await Member.countEligibleForQuorum(clientId, null);
    }
    const required = this.calculateRequiredQuorum(meeting.type, total);
    const valid = total > 0 && present >= required;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      present,
      required,
      total,
      percentage,
      valid,
      met: valid,
      type: meeting.type,
      message: valid
        ? `Quórum válido: ${present} presentes (mínimo requerido: ${required})`
        : `Quórum insuficiente: ${present} presentes (mínimo requerido: ${required})`
    };
  }
}

module.exports = QuorumService;






