const ApprovalService = require('../services/assemblyApprovalService');
const Meeting = require('../models/Meeting');

async function assertMeeting(req) {
  const meeting = await Meeting.findById(req.params.id, req.user.client_id);
  if (!meeting) { const err = new Error('Reunión no encontrada'); err.status = 404; throw err; }
  return meeting;
}
function handle(res, error) { res.status(error.status || 500).json({ message: error.message }); }

exports.create = async (req, res) => {
  try {
    await assertMeeting(req);
    const { nombre, descripcion, punto_orden_dia } = req.body;
    const result = await ApprovalService.createApprovalVote(req.params.id, nombre, descripcion || null, punto_orden_dia || null, req.user.id);
    res.status(201).json(result);
  } catch (e) { handle(res, e); }
};

exports.open = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await ApprovalService.openApprovalVote(req.params.id, req.params.approvalVoteId, req.user.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.vote = async (req, res) => {
  try {
    await assertMeeting(req);
    const { voter_id, voto_tipo } = req.body;
    if (!voter_id || !voto_tipo) return res.status(400).json({ message: 'voter_id y voto_tipo son requeridos' });
    const result = await ApprovalService.castApprovalVote(req.params.id, req.params.approvalVoteId, voter_id, voto_tipo, req.user.id);
    res.status(201).json(result);
  } catch (e) { handle(res, e); }
};

exports.close = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await ApprovalService.closeApprovalVote(req.params.id, req.params.approvalVoteId, req.user.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.list = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await ApprovalService.getApprovalVotesByMeeting(req.params.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.results = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await ApprovalService.getApprovalVoteResults(req.params.approvalVoteId);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.padron = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await ApprovalService.getApprovalVotePadron(req.params.approvalVoteId);
    res.json(result);
  } catch (e) { handle(res, e); }
};
