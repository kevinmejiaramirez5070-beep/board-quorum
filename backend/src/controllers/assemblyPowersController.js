const PowersService = require('../services/assemblyPowersService');
const Meeting = require('../models/Meeting');

async function assertMeeting(req) {
  const meeting = await Meeting.findById(req.params.id, req.user.client_id);
  if (!meeting) { const err = new Error('Reunión no encontrada'); err.status = 404; throw err; }
  return meeting;
}
function handle(res, error) {
  res.status(error.status || 500).json({ message: error.message });
}

exports.registerPower = async (req, res) => {
  try {
    await assertMeeting(req);
    const { poderdante_id, apoderado_id, notas } = req.body;
    if (!poderdante_id || !apoderado_id) { return res.status(400).json({ message: 'poderdante_id y apoderado_id son requeridos' }); }
    const result = await PowersService.registerPower(req.params.id, poderdante_id, apoderado_id, req.user.id, notas || null);
    res.status(201).json(result);
  } catch (e) { handle(res, e); }
};

exports.getPowers = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await PowersService.getPowersByMeeting(req.params.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.getApoderadoLoad = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await PowersService.getApoderadoLoad(req.params.memberId, req.params.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

// NOTA: el endpoint de revocación (DELETE) NO se implementa hasta resolver VF-06
// (quién tiene autoridad para revocar un poder).
