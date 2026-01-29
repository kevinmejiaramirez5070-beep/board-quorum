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
    if (votesEmitted === 0) {
      return 0;
    }
    // Mayoría simple = floor(votos_emitidos / 2) + 1
    return Math.floor(votesEmitted / 2) + 1;
  }

  /**
   * Valida si una decisión alcanza la mayoría simple
   * @param {number} affirmativeVotes - Votos afirmativos
   * @param {number} totalVotesEmitted - Total de votos emitidos
   * @returns {Object} - { approved: boolean, majority: number, affirmative: number, message: string }
   */
  static validateSimpleMajority(affirmativeVotes, totalVotesEmitted) {
    const majority = this.calculateSimpleMajority(totalVotesEmitted);
    const approved = affirmativeVotes >= majority;

    const message = approved
      ? `Decisión APROBADA: ${affirmativeVotes} votos afirmativos (mayoría requerida: ${majority})`
      : `Decisión RECHAZADA: ${affirmativeVotes} votos afirmativos (mayoría requerida: ${majority})`;

    return {
      approved,
      majority,
      affirmative: affirmativeVotes,
      total: totalVotesEmitted,
      message
    };
  }

  /**
   * Obtiene información completa del quórum para una reunión
   * @param {number} meetingId - ID de la reunión
   * @param {number} clientId - ID del cliente
   * @returns {Promise<Object>} - Información completa del quórum
   */
  static async getQuorumInfo(meetingId, clientId) {
    const meeting = await Meeting.findById(meetingId, clientId);
    if (!meeting) {
      throw new Error('Meeting not found');
    }

    const present = await this.countPresentWithVote(meetingId);
    
    // Para asamblea, necesitaríamos contar el total de delegados
    // Por ahora, usamos el total de miembros activos del cliente
    let totalMembers = null;
    if (meeting.type === 'asamblea') {
      const allMembers = await Member.findAll(clientId);
      totalMembers = allMembers.length;
    }

    const required = this.calculateRequiredQuorum(meeting.type, totalMembers);
    const valid = present >= required;

    return {
      present,
      required,
      total: totalMembers || 12, // 12 para JD (11 + 1 JV), null para asamblea
      valid,
      type: meeting.type,
      message: valid
        ? `Quórum válido: ${present} presentes (mínimo requerido: ${required})`
        : `Quórum insuficiente: ${present} presentes (mínimo requerido: ${required})`
    };
  }
}

module.exports = QuorumService;






