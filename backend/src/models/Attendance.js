const db = require('../config/database');

class Attendance {
  static async findByMeeting(meetingId) {
    const [rows] = await db.execute(
      `SELECT a.*,
         COALESCE(m.name, a.manual_name) AS member_name,
         COALESCE(m.rol_organico, m.position, m.role, a.manual_position, '') AS role,
         m.email
       FROM attendance a
       LEFT JOIN members m ON a.member_id = m.id
       WHERE a.meeting_id = ?
       ORDER BY a.arrival_time, a.id`,
      [meetingId]
    );
    return rows;
  }

  static async create(data) {
    const { 
      meeting_id, member_id, status, arrival_time, acting_as_principal = 0,
      pending_approval = false, manual_name = null, manual_position = null, manual_document = null
    } = data;
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const pendingValue = isPostgreSQL ? (pending_approval ? 'true' : 'false') : (pending_approval ? 1 : 0);
    const returningClause = isPostgreSQL ? ' RETURNING id' : '';
    
    // Si member_id es null, es un registro manual
    const memberIdValue = member_id !== null && member_id !== undefined ? member_id : null;
    
    const [result] = await db.execute(
      `INSERT INTO attendance (meeting_id, member_id, status, arrival_time, acting_as_principal, 
        pending_approval, manual_name, manual_position, manual_document, created_at)
       VALUES (?, ?, ?, ?, ?, ${pendingValue}, ?, ?, ?, NOW())${returningClause}`,
      [meeting_id, memberIdValue, status, arrival_time, acting_as_principal, 
       manual_name, manual_position, manual_document]
    );
    
    if (isPostgreSQL) {
      return result?.[0]?.id;
    }
    return result.insertId;
  }

  static async update(id, data) {
    const { status, arrival_time, acting_as_principal } = data;
    const updateFields = [];
    const updateValues = [];
    
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (arrival_time !== undefined) {
      updateFields.push('arrival_time = ?');
      updateValues.push(arrival_time);
    }
    if (acting_as_principal !== undefined) {
      updateFields.push('acting_as_principal = ?');
      updateValues.push(acting_as_principal);
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);
    
    await db.execute(
      `UPDATE attendance SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
  }

  /**
   * Cuenta votos computables para quórum (reglas ASOCOLCI).
   *
   * Reglas:
   *  1. JV (junta_vigilancia): suma exactamente 1 si hay al menos 1 presente, sin importar cuántos asistan.
   *  2. Suplente: suma 1 SOLO si su principal NO está presente.
   *     Detección de suplente (en orden):
   *       a) member_type = 'suplente'
   *       b) tipo_participante = 'SUPLENTE'
   *       c) position contiene la palabra 'SUPLENTE' (cubre datos históricos sin tipo_participante)
   *     Detección de que el principal está presente (en orden):
   *       a) principal_id apunta a un miembro que también está presente
   *       b) Fallback rol_organico: hay algún principal presente con mismo rol_organico
   *       c) Fallback posición: hay algún no-suplente presente cuyo position comparte la
   *          palabra base del cargo (ej: "TESORERO SUPLENTE" → busca presente con "TESORERO")
   *  3. Principal (cualquier otro): suma 1.
   *  Solo se cuentan miembros con cuenta_quorum=true y sin pending_approval.
   */
  static async countPresentWithVote(meetingId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const cuentaQuorumCond = isPostgreSQL ? 'm.cuenta_quorum = true' : 'm.cuenta_quorum = 1';
    const pendingOkCond = isPostgreSQL
      ? 'COALESCE(a.pending_approval, false) = false'
      : '(a.pending_approval IS NULL OR a.pending_approval = 0)';

    const [rows] = await db.execute(
      `SELECT a.member_id,
              m.member_type,
              m.tipo_participante,
              m.principal_id,
              m.rol_organico,
              m.position
       FROM attendance a
       JOIN members m ON a.member_id = m.id
       WHERE a.meeting_id = ?
         AND a.status = 'present'
         AND a.member_id IS NOT NULL
         AND ${cuentaQuorumCond}
         AND ${pendingOkCond}`,
      [meetingId]
    );

    if (!rows || rows.length === 0) return 0;

    const norm = (s) => String(s || '').toUpperCase().trim();

    const isJvRow = (r) => {
      const mt = String(r.member_type || '').toLowerCase().trim();
      const tp = norm(r.tipo_participante);
      return mt === 'junta_vigilancia' || tp === 'JUNTA_DE_VIGILANCIA';
    };

    const isSuplenteRow = (r) => {
      const mt = String(r.member_type || '').toLowerCase().trim();
      const tp = norm(r.tipo_participante);
      const pos = norm(r.position);
      // Detección por member_type, tipo_participante, o por la palabra SUPLENTE en position
      return mt === 'suplente' || tp === 'SUPLENTE' || /\bSUPLENTE\b/.test(pos);
    };

    const presentIds = new Set(rows.map(r => Number(r.member_id)));

    let votes = 0;
    let jvPresent = false;

    for (const row of rows) {
      if (isJvRow(row)) {
        jvPresent = true;
        continue;
      }

      if (isSuplenteRow(row)) {
        // a) principal_id directo: si ese miembro está presente → no cuenta
        if (row.principal_id && presentIds.has(Number(row.principal_id))) {
          continue;
        }

        // b) Fallback rol_organico: si hay un principal presente con mismo rol_organico
        if (norm(row.rol_organico)) {
          const principalPresentByOrg = rows.some(r =>
            !isJvRow(r) && !isSuplenteRow(r) &&
            norm(r.rol_organico) === norm(row.rol_organico)
          );
          if (principalPresentByOrg) continue;
        }

        // c) Fallback posición: "TESORERO SUPLENTE" → palabras base ["TESORERO"]
        //    busca si hay un no-suplente presente cuyo position comparte esa palabra
        const posBase = norm(row.position)
          .replace(/\bSUPLENTE\b/g, '')
          .trim()
          .split(/\s+/)
          .filter(w => w.length > 3); // descarta preposiciones / palabras cortas

        if (posBase.length > 0) {
          const principalPresentByPos = rows.some(r => {
            if (isJvRow(r) || isSuplenteRow(r)) return false;
            const rPos = norm(r.position);
            const rOrg = norm(r.rol_organico);
            return posBase.some(w => rPos.includes(w) || rOrg.includes(w));
          });
          if (principalPresentByPos) continue;
        }

        // El principal no está presente → el suplente sí suma
        votes++;
      } else {
        // Principal u otro tipo con cuenta_quorum: suma 1
        votes++;
      }
    }

    if (jvPresent) votes += 1;
    return votes;
  }

  static async countByStatus(meetingId, status) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM attendance WHERE meeting_id = ? AND status = ?',
      [meetingId, status]
    );
    return rows[0].count;
  }

  static async countTotal(meetingId) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM attendance WHERE meeting_id = ?',
      [meetingId]
    );
    return rows[0].count;
  }

  /**
   * Busca asistencia por miembro y reunión
   */
  static async findByMemberAndMeeting(meetingId, memberId) {
    const [rows] = await db.execute(
      'SELECT * FROM attendance WHERE meeting_id = ? AND member_id = ?',
      [meetingId, memberId]
    );
    return rows[0] || null;
  }

  /**
   * Comprueba si ya existe un registro de asistencia para este número de documento en la reunión.
   * Evita registro duplicado (Comentario 02 / BUG-03).
   */
  static async findByDocumentAndMeeting(meetingId, documentNumber) {
    if (!documentNumber) return null;
    const doc = String(documentNumber).trim();
    const [rows] = await db.execute(
      `SELECT a.* FROM attendance a
       LEFT JOIN members m ON a.member_id = m.id
       WHERE a.meeting_id = ?
         AND (m.numero_documento = ? OR a.manual_document = ?)
       LIMIT 1`,
      [meetingId, doc, doc]
    );
    return rows[0] || null;
  }

  /**
   * Busca asistencias pendientes de aprobación
   */
  static async findPendingApproval(meetingId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const pendingCondition = isPostgreSQL ? 'pending_approval = true' : 'pending_approval = 1';
    const [rows] = await db.execute(
      `SELECT a.*, m.name as member_name, m.email, m.position
       FROM attendance a
       LEFT JOIN members m ON a.member_id = m.id
       WHERE a.meeting_id = ? AND ${pendingCondition}`,
      [meetingId]
    );
    return rows;
  }

  /**
   * Aprueba una asistencia pendiente
   */
  static async approveAttendance(attendanceId) {
    // Regla de validación:
    // - Si es INVITADO o PERSONAL ADMIN: solo quitar pending_approval (NUNCA asignar member_id).
    // - Si es PENDIENTE DE VALIDAR de un miembro del órgano: intentar asignar member_id por manual_document
    //   para que SÍ cuente en quórum (si el documento existe en members).
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const pendingValue = isPostgreSQL ? 'false' : '0';

    const invitedCond = isPostgreSQL
      ? "a.manual_position ILIKE '%INVITADO%'"
      : "LOWER(a.manual_position) LIKE '%invitado%'";
    const personalAdminCond = isPostgreSQL
      ? "a.manual_position ILIKE '%PERSONAL ADMIN%'"
      : "LOWER(a.manual_position) LIKE '%personal admin%'";

    const sql = `
      UPDATE attendance a
      SET
        pending_approval = ${pendingValue},
        status = 'present',
        member_id = CASE
          WHEN ${invitedCond} THEN NULL
          WHEN ${personalAdminCond} THEN NULL
          ELSE (
            SELECT m.id
            FROM members m
            JOIN meetings meet ON meet.id = a.meeting_id
            WHERE m.client_id = meet.client_id
              AND m.numero_documento = a.manual_document
            LIMIT 1
          )
        END,
        updated_at = NOW()
      WHERE a.id = ?
    `;

    await db.execute(sql, [attendanceId]);
  }

  /**
   * Rechaza una asistencia pendiente (no cuenta en quórum).
   * Dejamos status = 'rejected' para que el contador de quórum (status='present') no la tome.
   */
  static async rejectAttendance(attendanceId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const pendingValue = isPostgreSQL ? 'false' : '0';
    await db.execute(
      `UPDATE attendance
       SET pending_approval = ${pendingValue},
           status = 'rejected',
           member_id = NULL,
           updated_at = NOW()
       WHERE id = ?`,
      [attendanceId]
    );
  }
}

module.exports = Attendance;

