const db = require('../config/database');

/**
 * Módulo 7 — Roles de Asamblea (autoridad de sesión).
 * Roles de SESIÓN (no perfiles de acceso): Presidente, Secretario(a), Comisiones.
 * Soporta personas externas (sin cuenta). Inmutable al cerrar la sesión.
 */

const ROLE_CATALOG = {
  presidente_asamblea: { label: 'Presidente de la Asamblea', unipersonal: true },
  secretario_asamblea: { label: 'Secretario(a) de la Asamblea', unipersonal: true },
  comision_verificadora: { label: 'Comisión Verificadora del Acta', unipersonal: false },
  comision_aprobadora: { label: 'Comisión Verificadora y Aprobadora del Acta', unipersonal: false },
};

class AssemblyRolesService {
  static get isPostgreSQL() {
    return !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
  }

  static get catalog() { return ROLE_CATALOG; }

  static async _getMeeting(meetingId) {
    const [rows] = await db.execute(`SELECT id, status, type, product_id FROM meetings WHERE id = ? LIMIT 1`, [meetingId]);
    return rows[0] || null;
  }

  static async logRoleEvent(eventType, meetingId, sessionRoleId, operatorId, roleType, personId = null, personName = null) {
    try {
      await db.execute(
        `INSERT INTO roles_log (meeting_id, session_role_id, event_type, role_type, operator_id, person_id, person_name, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [meetingId, sessionRoleId, eventType, roleType, operatorId, personId, personName]
      );
    } catch (e) { console.warn('[roles] logRoleEvent falló:', e.message); }
  }

  /** Asigna un rol de sesión con validaciones V-01 a V-06. */
  static async assignRole(meetingId, roleType, assignedBy, options = {}) {
    const { userId = null, personName = null, personType = null, agendaItemId = null, notas = null } = options;

    // V-01: catálogo
    if (!ROLE_CATALOG[roleType]) { const err = new Error('Tipo de rol no reconocido.'); err.status = 400; throw err; }

    const meeting = await this._getMeeting(meetingId);
    if (!meeting) { const err = new Error('Reunión no encontrada'); err.status = 404; throw err; }
    // V-04 / V-06: estado de sesión
    if (meeting.status === 'closed' || meeting.status === 'completed' || meeting.status === 'archived') {
      const err = new Error('La sesión está cerrada. Los roles son inmutables.'); err.status = 423; throw err;
    }
    if (!['pending', 'scheduled', 'active'].includes(meeting.status)) {
      const err = new Error('Solo se pueden asignar roles en sesiones activas o pendientes.'); err.status = 423; throw err;
    }

    // V-03: persona válida (interno con user_id, o externo con nombre)
    let resolvedType = personType;
    let resolvedName = personName;
    if (userId) {
      const [u] = await db.execute(`SELECT id, name FROM users WHERE id = ? LIMIT 1`, [userId]);
      if (!u[0]) { const err = new Error('La persona no existe en el sistema. Ingresa nombre completo para registrarla como externa.'); err.status = 400; throw err; }
      resolvedType = 'interno';
      resolvedName = resolvedName || u[0].name;
    } else {
      if (!personName || !String(personName).trim()) {
        const err = new Error('La persona no existe en el sistema. Ingresa nombre completo para registrarla como externa.'); err.status = 400; throw err;
      }
      resolvedType = 'externo';
      resolvedName = String(personName).trim();
    }

    // V-02: rol unipersonal no puede duplicarse activo
    if (ROLE_CATALOG[roleType].unipersonal) {
      const [exist] = await db.execute(
        `SELECT id FROM session_roles WHERE meeting_id = ? AND role_type = ? AND status = 'active' LIMIT 1`,
        [meetingId, roleType]
      );
      if (exist.length) {
        const err = new Error(`Ya existe un ${ROLE_CATALOG[roleType].label} activo en esta sesión. Revoca el actual antes de asignar uno nuevo.`);
        err.status = 409; throw err;
      }
    }

    const returning = this.isPostgreSQL ? ' RETURNING id' : '';
    const [rows] = await db.execute(
      `INSERT INTO session_roles (meeting_id, role_type, user_id, person_name, person_type, agenda_item_id, status, assigned_at, assigned_by, notas, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', NOW(), ?, ?, NOW(), NOW())${returning}`,
      [meetingId, roleType, userId, resolvedName, resolvedType, agendaItemId, assignedBy, notas]
    );
    const roleId = this.isPostgreSQL ? rows?.[0]?.id : rows?.insertId;
    await this.logRoleEvent('ROLE_ASSIGNED', meetingId, roleId, assignedBy, roleType, userId, resolvedName);
    return { session_role_id: roleId, role_type: roleType, person_name: resolvedName, person_type: resolvedType, status: 'active' };
  }

  static async revokeRole(meetingId, sessionRoleId, revokedBy) {
    const meeting = await this._getMeeting(meetingId);
    if (!meeting) { const err = new Error('Reunión no encontrada'); err.status = 404; throw err; }
    if (meeting.status === 'closed' || meeting.status === 'completed' || meeting.status === 'archived') {
      const err = new Error('La sesión está cerrada. Los roles son inmutables.'); err.status = 423; throw err;
    }
    const [rows] = await db.execute(`SELECT * FROM session_roles WHERE id = ? AND meeting_id = ? LIMIT 1`, [sessionRoleId, meetingId]);
    const role = rows[0];
    if (!role) { const err = new Error('Rol no encontrado.'); err.status = 404; throw err; }
    if (role.status === 'revoked') { const err = new Error('Este rol ya está revocado.'); err.status = 409; throw err; }

    await db.execute(`UPDATE session_roles SET status = 'revoked', revoked_at = NOW(), revoked_by = ?, updated_at = NOW() WHERE id = ?`, [revokedBy, sessionRoleId]);
    await this.logRoleEvent('ROLE_REVOKED', meetingId, sessionRoleId, revokedBy, role.role_type, role.user_id, role.person_name);
    return { session_role_id: sessionRoleId, role_type: role.role_type, status: 'revoked' };
  }

  static async getSessionRoles(meetingId) {
    const [rows] = await db.execute(
      `SELECT id, role_type, user_id, person_name, person_type, status, assigned_at, agenda_item_id
       FROM session_roles WHERE meeting_id = ? AND status = 'active' ORDER BY assigned_at`,
      [meetingId]
    );
    const result = {
      presidente_asamblea: null,
      secretario_asamblea: null,
      comision_verificadora: [],
      comision_aprobadora: []
    };
    for (const r of rows) {
      const item = { session_role_id: r.id, person_name: r.person_name, user_id: r.user_id, person_type: r.person_type, status: r.status, assigned_at: r.assigned_at };
      if (r.role_type === 'presidente_asamblea') result.presidente_asamblea = item;
      else if (r.role_type === 'secretario_asamblea') result.secretario_asamblea = item;
      else if (r.role_type === 'comision_verificadora') result.comision_verificadora.push(item);
      else if (r.role_type === 'comision_aprobadora') result.comision_aprobadora.push(item);
    }
    return result;
  }

  static async getRoleByType(meetingId, roleType) {
    const [rows] = await db.execute(
      `SELECT * FROM session_roles WHERE meeting_id = ? AND role_type = ? AND status = 'active' ORDER BY assigned_at`,
      [meetingId, roleType]
    );
    return ROLE_CATALOG[roleType]?.unipersonal ? (rows[0] || null) : rows;
  }

  static async getCommissionMembers(meetingId, commissionType) {
    const [rows] = await db.execute(
      `SELECT * FROM session_roles WHERE meeting_id = ? AND role_type = ? AND status = 'active' ORDER BY assigned_at`,
      [meetingId, commissionType]
    );
    return rows;
  }

  /** Objeto estructurado para el acta (Módulo 8) con roles_incompletos. */
  static async getRolesForActa(meetingId) {
    const roles = await this.getSessionRoles(meetingId);
    const mapItem = (r) => r ? { nombre: r.person_name, user_id: r.user_id, tipo: r.person_type, assigned_at: r.assigned_at } : null;

    const roles_incompletos = [];
    if (!roles.presidente_asamblea) roles_incompletos.push('presidente_asamblea');
    if (!roles.secretario_asamblea) roles_incompletos.push('secretario_asamblea');
    if (roles.comision_verificadora.length === 0) roles_incompletos.push('comision_verificadora');
    if (roles.comision_aprobadora.length === 0) roles_incompletos.push('comision_aprobadora');

    return {
      presidente: mapItem(roles.presidente_asamblea),
      secretario: mapItem(roles.secretario_asamblea),
      comision_verificadora: roles.comision_verificadora.map(mapItem),
      comision_aprobadora: roles.comision_aprobadora.map(mapItem),
      roles_incompletos
    };
  }
}

module.exports = AssemblyRolesService;
