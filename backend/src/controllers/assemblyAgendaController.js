const AgendaService = require('../services/assemblyAgendaService');
const Meeting = require('../models/Meeting');

// Verifica que la reunión pertenece al cliente del usuario
async function assertMeeting(req) {
  const meeting = await Meeting.findById(req.params.id, req.user.client_id);
  if (!meeting) { const err = new Error('Reunión no encontrada'); err.status = 404; throw err; }
  return meeting;
}

function handle(res, error) {
  const status = error.status || 500;
  res.status(status).json({ message: error.message });
}

exports.createAgenda = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await AgendaService.createAgenda(req.params.id, req.body.tipo_sesion || 'ordinaria', req.user.id);
    res.status(201).json(result);
  } catch (e) { handle(res, e); }
};

exports.loadTemplate = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await AgendaService.loadOrdinaryAgendaTemplate(req.params.id, req.user.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.publishAgenda = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await AgendaService.publishAgenda(req.params.id, req.user.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.getAgenda = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await AgendaService.getAgendaWithProgress(req.params.id);
    res.json(result || { status: null, items: [] });
  } catch (e) { handle(res, e); }
};

exports.addItem = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await AgendaService.addAgendaItem(req.params.id, req.body, req.user.id);
    res.status(201).json(result);
  } catch (e) { handle(res, e); }
};

exports.updateItem = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await AgendaService.updateAgendaItem(req.params.id, req.params.itemId, req.body, req.user.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.removeItem = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await AgendaService.removeAgendaItem(req.params.id, req.params.itemId);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.startItem = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await AgendaService.startAgendaItem(req.params.id, req.params.itemId, req.user.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.completeItem = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await AgendaService.completeAgendaItem(req.params.id, req.params.itemId, req.body.resultado_resumen || null, req.user.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.skipItem = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await AgendaService.skipAgendaItem(req.params.id, req.params.itemId, req.user.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.linkVote = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await AgendaService.linkAgendaItemToVote(req.params.id, req.params.itemId, req.body.approval_vote_id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.linkElection = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await AgendaService.linkAgendaItemToElection(req.params.id, req.params.itemId, req.body.election_id);
    res.json(result);
  } catch (e) { handle(res, e); }
};
