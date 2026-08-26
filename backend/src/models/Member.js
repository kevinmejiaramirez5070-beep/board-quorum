const db = require('../config/database');

class Member {
  static async findAll(clientId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    const [rows] = await db.execute(
      `SELECT * FROM members WHERE client_id = ? AND ${activeCondition} ORDER BY name`,
      [clientId]
    );
    return rows;
  }

  static async findById(id, clientId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    const [rows] = await db.execute(
      `SELECT * FROM members WHERE id = ? AND client_id = ? AND ${activeCondition}`,
      [id, clientId]
    );
    return rows[0];
  }

  static async create(data) {
    const { 
      client_id, product_id = null, name, email = null, role = 'member', position = null,
      member_type = 'principal', principal_id = null, user_id = null,
      tipo_documento = null, numero_documento = null, rol_organico = null,
      tipo_participante = null, rol_en_votacion = null,
      cargo_funcional = null,
      cuenta_quorum = 1, puede_votar = 1
    } = data;
    // Normalizar documento: eliminar todo lo que no sea dígito
    const docNormalizado = numero_documento ? String(numero_documento).replace(/\D/g, '') : null;
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeValue = isPostgreSQL ? 'true' : '1';
    const cuentaQuorumValue = isPostgreSQL ? (cuenta_quorum ? 'true' : 'false') : (cuenta_quorum ? 1 : 0);
    const puedeVotarValue = isPostgreSQL ? (puede_votar ? 'true' : 'false') : (puede_votar ? 1 : 0);
    const returningClause = isPostgreSQL ? ' RETURNING id' : '';

    // Intentar incluir cargo_funcional si la columna existe en la BD
    // Si no existe se hace el INSERT sin ella (fallback)
    try {
      const [rows] = await db.execute(
        `INSERT INTO members (
          client_id, product_id, name, email, role, position,
          member_type, principal_id, user_id,
          tipo_documento, numero_documento, rol_organico,
          tipo_participante, rol_en_votacion, cargo_funcional,
          cuenta_quorum, puede_votar,
          active, created_at
        )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${cuentaQuorumValue}, ${puedeVotarValue}, ${activeValue}, NOW())${returningClause}`,
        [
          client_id, product_id, name, email, role, position,
          member_type, principal_id, user_id,
          tipo_documento, docNormalizado, rol_organico,
          tipo_participante, rol_en_votacion, cargo_funcional
        ]
      );
      if (isPostgreSQL) return rows?.[0]?.id;
      return rows?.insertId;
    } catch (colErr) {
      // Si cargo_funcional no existe en la BD, reintentar sin esa columna
      if (colErr.message && (colErr.message.includes('cargo_funcional') || colErr.message.includes('column') || colErr.message.includes('Unknown column'))) {
        const [rows] = await db.execute(
          `INSERT INTO members (
            client_id, product_id, name, email, role, position,
            member_type, principal_id, user_id,
            tipo_documento, numero_documento, rol_organico,
            tipo_participante, rol_en_votacion,
            cuenta_quorum, puede_votar,
            active, created_at
          )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${cuentaQuorumValue}, ${puedeVotarValue}, ${activeValue}, NOW())${returningClause}`,
          [
            client_id, product_id, name, email, role, position,
            member_type, principal_id, user_id,
            tipo_documento, docNormalizado, rol_organico,
            tipo_participante, rol_en_votacion
          ]
        );
        if (isPostgreSQL) return rows?.[0]?.id;
        return rows?.insertId;
      }
      throw colErr;
    }
  }

  static async update(id, data) {
    const { 
      product_id, name, email, role, position, member_type, principal_id, user_id,
      tipo_documento, numero_documento, rol_organico,
      tipo_participante, rol_en_votacion, cargo_funcional,
      cuenta_quorum, puede_votar
    } = data;
    const updateFields = [];
    const updateValues = [];
    
    if (product_id !== undefined) {
      updateFields.push('product_id = ?');
      updateValues.push(product_id);
    }
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (position !== undefined) {
      updateFields.push('position = ?');
      updateValues.push(position);
    }
    if (member_type !== undefined) {
      updateFields.push('member_type = ?');
      updateValues.push(member_type);
    }
    if (principal_id !== undefined) {
      updateFields.push('principal_id = ?');
      updateValues.push(principal_id);
    }
    if (user_id !== undefined) {
      updateFields.push('user_id = ?');
      updateValues.push(user_id);
    }
    if (tipo_documento !== undefined) {
      updateFields.push('tipo_documento = ?');
      updateValues.push(tipo_documento);
    }
    if (numero_documento !== undefined) {
      updateFields.push('numero_documento = ?');
      updateValues.push(numero_documento ? String(numero_documento).replace(/\D/g, '') : null);
    }
    if (rol_organico !== undefined) {
      updateFields.push('rol_organico = ?');
      updateValues.push(rol_organico);
    }
    if (tipo_participante !== undefined) {
      updateFields.push('tipo_participante = ?');
      updateValues.push(tipo_participante);
    }
    if (rol_en_votacion !== undefined) {
      updateFields.push('rol_en_votacion = ?');
      updateValues.push(rol_en_votacion);
    }
    if (cargo_funcional !== undefined) {
      updateFields.push('cargo_funcional = ?');
      updateValues.push(cargo_funcional);
    }
    if (cuenta_quorum !== undefined) {
      updateFields.push('cuenta_quorum = ?');
      updateValues.push(cuenta_quorum);
    }
    if (puede_votar !== undefined) {
      updateFields.push('puede_votar = ?');
      updateValues.push(puede_votar);
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);
    
    await db.execute(
      `UPDATE members SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
  }

  /**
   * Busca un miembro por user_id
   */
  static async findByUserId(userId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    const [rows] = await db.execute(
      `SELECT * FROM members WHERE user_id = ? AND ${activeCondition}`,
      [userId]
    );
    return rows[0];
  }

  /**
   * Obtiene miembros con derecho a voto (principales, suplentes actuando, JV)
   */
  static async findWithVoteRight(clientId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    const [rows] = await db.execute(
      `SELECT * FROM members 
       WHERE client_id = ? 
       AND ${activeCondition} 
       AND (member_type = 'principal' OR member_type = 'junta_vigilancia')
       ORDER BY name`,
      [clientId]
    );
    return rows;
  }

  /**
   * Cuenta total de miembros con derecho a voto
   */
  static async countWithVoteRight(clientId) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    const [rows] = await db.execute(
      `SELECT COUNT(*) as count FROM members 
       WHERE client_id = ? 
       AND ${activeCondition} 
       AND (member_type = 'principal' OR member_type = 'junta_vigilancia')`,
      [clientId]
    );
    return rows[0].count;
  }

  /**
   * Cuenta miembros elegibles para quórum (cuenta_quorum = true).
   * Si productId es null, cuenta todos del cliente; si no, solo miembros de ese producto (BUG-01, BUG-02).
   */
  static async countEligibleForQuorum(clientId, productId = null) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    const quorumCondition = isPostgreSQL ? 'cuenta_quorum = true' : 'cuenta_quorum = 1';
    let query = `SELECT COUNT(*) as count FROM members 
       WHERE client_id = ? AND ${activeCondition} AND ${quorumCondition}`;
    const params = [clientId];
    if (productId != null && productId !== '') {
      query += ' AND (product_id = ? OR product_id IS NULL)';
      params.push(productId);
    }
    const [rows] = await db.execute(query, params);
    const count = rows[0]?.count ?? 0;
    return typeof count === 'string' ? parseInt(count, 10) : count;
  }

  static async delete(id) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeValue = isPostgreSQL ? 'false' : '0';
    await db.execute(
      `UPDATE members SET active = ${activeValue}, updated_at = NOW() WHERE id = ?`,
      [id]
    );
  }

  /**
   * Busca un miembro por número de documento
   */
  /**
   * MD-05 §12 — Una misma persona puede pertenecer a Junta Directiva y a
   * Asamblea con roles distintos. Para una reunión hay que resolver la identidad
   * del ÓRGANO de esa reunión: si no, quien es Vicepresidente en Junta y padre
   * delegado en Asamblea se resuelve con su rol de Junta y el núcleo familiar
   * queda partido en dos registros.
   *
   * `productId` es opcional: cuando se pasa, los miembros de ese órgano tienen
   * prioridad sobre los de cualquier otro.
   */
  static async findByDocumentNumber(documentNumber, clientId, productId = null) {
    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';
    // Normalizar el parámetro de entrada: solo dígitos
    const docNorm = documentNumber ? String(documentNumber).replace(/\D/g, '') : documentNumber;
    // Normalizar también el lado de la BD para tolerar documentos guardados con formato
    // (ej: "52.209.188" en BD debe coincidir con "52209188" en input)
    const dbNormExpr = isPostgreSQL
      ? "regexp_replace(numero_documento, '[^0-9]', '', 'g')"
      : "REPLACE(REPLACE(REPLACE(REPLACE(numero_documento, '.', ''), '-', ''), ' ', ''), ',', '')";
    // MD-10 — El maestro de ASOCOLCI trae madre y padre en la MISMA fila: una
    // fila es un núcleo familiar con dos cédulas válidas. La segunda se guarda en
    // secondary_document. Si solo se busca en numero_documento, la cédula del
    // segundo progenitor devuelve "CÉDULA NO ENCONTRADA" aunque sí esté cargada.
    // Ambas resuelven el MISMO registro, así que el núcleo sigue generando una
    // sola representación: no se crean dos miembros ni dos posiciones.
    const secNormExpr = isPostgreSQL
      ? "regexp_replace(COALESCE(secondary_document, ''), '[^0-9]', '', 'g')"
      : "REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(secondary_document, ''), '.', ''), '-', ''), ' ', ''), ',', '')";

    const [rows] = await db.execute(
      `SELECT id, name, numero_documento, secondary_document, secondary_name,
              tipo_documento, position, rol_organico,
              cuenta_quorum, puede_votar, rol_en_votacion, tipo_participante,
              member_type, principal_id,
              CASE WHEN ${dbNormExpr} = ? THEN 'primario' ELSE 'secundario' END AS documento_usado
       FROM members
       WHERE (${dbNormExpr} = ? OR numero_documento = ?
              OR (${secNormExpr} <> '' AND ${secNormExpr} = ?))
         AND client_id = ? AND ${activeCondition}
       ORDER BY
         CASE WHEN ? IS NOT NULL AND product_id = ? THEN 0 ELSE 1 END,
         CASE WHEN ${dbNormExpr} = ? THEN 0 ELSE 1 END`,
      [docNorm, docNorm, documentNumber, docNorm, clientId, productId, productId, docNorm]
    );
    return rows[0] || null;
  }
}

module.exports = Member;

