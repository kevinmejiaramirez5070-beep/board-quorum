const db = require('../config/database');

/**
 * MD-11 — Vinculación Reunión de Asamblea → Maestro vigente.
 *
 * Una reunión de tipo Asamblea debe resolver SIEMPRE un único órgano (producto),
 * y de ahí un único maestro y un único universo de elegibles. Si la reunión se
 * crea sin `product_id` — pasa cuando no se entra desde la pantalla del órgano —
 * queda huérfana: el panel muestra 0 elegibles y el cálculo antiguo terminaba
 * contando miembros de todos los órganos del cliente.
 *
 * Aquí se resuelve el producto de Asamblea del cliente y, cuando la reunión no
 * lo tiene, se le graba. Así todas las funcionalidades — quórum, asistencia,
 * votación, Momento Siguiente, proyección y reportes — leen el mismo universo.
 */

const PATRON_ASAMBLEA = /ASAMBLEA/i;

class AssemblyProductResolver {
  static get isPostgreSQL() {
    return !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
  }

  /**
   * Productos de Asamblea del cliente, ordenados por cuántos Delegados
   * Principales activos tiene cada uno. El maestro vigente es el que tiene
   * Principales cargados.
   */
  static async findAssemblyProducts(clientId) {
    const isPG = this.isPostgreSQL;
    const activeProd = isPG ? 'p.active = true' : 'p.active = 1';
    const activeMem = isPG ? 'm.active = true' : 'm.active = 1';

    const [rows] = await db.execute(
      `SELECT p.id, p.name,
              COUNT(m.id) AS principales
       FROM products p
       LEFT JOIN members m
         ON m.product_id = p.id AND m.member_type = 'principal' AND ${activeMem}
       WHERE p.client_id = ? AND ${activeProd}
       GROUP BY p.id, p.name`,
      [clientId]
    );

    return rows
      .filter(r => PATRON_ASAMBLEA.test(String(r.name || '')))
      .map(r => ({ id: Number(r.id), name: r.name, principales: Number(r.principales || 0) }))
      .sort((a, b) => b.principales - a.principales);
  }

  /**
   * Resuelve el producto de Asamblea de un cliente.
   *
   * Devuelve { product_id, name } cuando la asociación es inequívoca, o
   * { product_id: null, motivo, candidatos } cuando no se puede decidir sola.
   * MD-11 §8: en ese caso la reunión no debe quedar operativa sin resolverlo.
   */
  static async resolve(clientId) {
    const candidatos = await this.findAssemblyProducts(clientId);

    if (candidatos.length === 0) {
      return {
        product_id: null,
        motivo: 'SIN_PRODUCTO_ASAMBLEA',
        mensaje: 'Este cliente no tiene un órgano de Asamblea General configurado. ' +
                 'Créelo antes de programar una reunión de Asamblea.',
        candidatos: []
      };
    }

    if (candidatos.length === 1) {
      return { product_id: candidatos[0].id, name: candidatos[0].name, motivo: null, candidatos };
    }

    // Varios órganos de Asamblea: gana el que tiene el maestro cargado, siempre
    // que sea el único con Principales. Si hay empate, decide el usuario.
    const conMaestro = candidatos.filter(c => c.principales > 0);
    if (conMaestro.length === 1) {
      return { product_id: conMaestro[0].id, name: conMaestro[0].name, motivo: null, candidatos };
    }

    return {
      product_id: null,
      motivo: 'AMBIGUO',
      mensaje: 'Hay más de un órgano de Asamblea con Delegados cargados. ' +
               'Seleccione explícitamente a cuál pertenece esta reunión.',
      candidatos
    };
  }

  /**
   * Devuelve el product_id que debe usar una reunión de Asamblea y, si la
   * reunión no lo tenía, lo graba para que no vuelva a quedar huérfana.
   *
   * `meeting` necesita al menos { id, client_id, product_id, type }.
   */
  static async ensureMeetingProduct(meeting) {
    if (!meeting) return null;
    if (meeting.product_id != null) return Number(meeting.product_id);

    const QuorumService = require('./quorumService');
    if (QuorumService.normalizeMeetingType(meeting.type) !== 'asamblea') return null;

    const r = await this.resolve(meeting.client_id);
    if (r.product_id == null) return null;

    try {
      await db.execute(
        `UPDATE meetings SET product_id = ?, updated_at = NOW() WHERE id = ? AND product_id IS NULL`,
        [r.product_id, meeting.id]
      );
      meeting.product_id = r.product_id;
      console.log(`[assembly] Reunión ${meeting.id} vinculada al órgano ${r.product_id} (${r.name}).`);
    } catch (e) {
      console.warn('[assembly] no se pudo grabar el órgano en la reunión:', e.message);
    }
    return r.product_id;
  }
}

module.exports = AssemblyProductResolver;
