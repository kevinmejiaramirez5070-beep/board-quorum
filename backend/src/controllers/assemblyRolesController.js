const RolesService = require('../services/assemblyRolesService');
const Meeting = require('../models/Meeting');

async function assertMeeting(req) {
  const meeting = await Meeting.findById(req.params.id, req.user.client_id);
  if (!meeting) { const err = new Error('Reunión no encontrada'); err.status = 404; throw err; }
  return meeting;
}
function handle(res, error) {
  res.status(error.status || 500).json({ message: error.message });
}

exports.assignRole = async (req, res) => {
  try {
    await assertMeeting(req);
    const { role_type, user_id, person_name, person_type, agenda_item_id, notas } = req.body;
    const result = await RolesService.assignRole(req.params.id, role_type, req.user.id, {
      userId: user_id || null, personName: person_name || null, personType: person_type || null,
      agendaItemId: agenda_item_id || null, notas: notas || null
    });
    res.status(201).json(result);
  } catch (e) { handle(res, e); }
};

exports.getRoles = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await RolesService.getSessionRoles(req.params.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.getRolesForActa = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await RolesService.getRolesForActa(req.params.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.getRoleByType = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await RolesService.getRoleByType(req.params.id, req.params.roleType);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.revokeRole = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await RolesService.revokeRole(req.params.id, req.params.sessionRoleId, req.user.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};
