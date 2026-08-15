const ActaService = require('../services/assemblyActaService');
const Meeting = require('../models/Meeting');

async function assertMeeting(req) {
  const meeting = await Meeting.findById(req.params.id, req.user.client_id);
  if (!meeting) { const err = new Error('Reunión no encontrada'); err.status = 404; throw err; }
  return meeting;
}
function handle(res, error) {
  const body = { message: error.message };
  if (error.detalle) body.detalle = error.detalle;
  res.status(error.status || 500).json(body);
}

exports.init = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await ActaService.initActa(req.params.id, req.user.id, req.body || {});
    res.status(201).json(result);
  } catch (e) { handle(res, e); }
};

exports.preview = async (req, res) => {
  try {
    await assertMeeting(req);
    res.json(await ActaService.getActaPreview(req.params.id));
  } catch (e) { handle(res, e); }
};

exports.preconditions = async (req, res) => {
  try {
    await assertMeeting(req);
    res.json(await ActaService.validateActaPreconditions(req.params.id));
  } catch (e) { handle(res, e); }
};

exports.saveNarrative = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await ActaService.saveNarrative(req.params.id, req.params.agendaItemId, req.body.narrative_text || '', req.user.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.getNarratives = async (req, res) => {
  try {
    await assertMeeting(req);
    res.json(await ActaService.getNarratives(req.params.id));
  } catch (e) { handle(res, e); }
};

exports.pdf = async (req, res) => {
  try {
    await assertMeeting(req);
    const buffer = await ActaService.generateActaPDF(req.params.id, req.user.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="acta-asamblea-${req.params.id}.pdf"`);
    res.send(buffer);
  } catch (e) { handle(res, e); }
};

exports.close = async (req, res) => {
  try {
    if (req.user.role !== 'admin_master') {
      return res.status(403).json({ message: 'Solo el Admin Master puede generar el Acta definitiva.' });
    }
    await assertMeeting(req);
    const result = await ActaService.closeActa(req.params.id, req.user.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};
