const ElectionsService = require('../services/assemblyElectionsService');
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
    const { nombre, descripcion, punto_orden_dia, tipo_eleccion } = req.body;
    const result = await ElectionsService.createElection(req.params.id, nombre, descripcion || null, punto_orden_dia || null, tipo_eleccion || 'unipersonal', req.user.id);
    res.status(201).json(result);
  } catch (e) { handle(res, e); }
};

exports.addCandidate = async (req, res) => {
  try {
    await assertMeeting(req);
    const { nombre, descripcion } = req.body;
    const result = await ElectionsService.addCandidate(req.params.electionId, nombre, descripcion || null);
    res.status(201).json(result);
  } catch (e) { handle(res, e); }
};

exports.open = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await ElectionsService.openElection(req.params.id, req.params.electionId, req.user.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.vote = async (req, res) => {
  try {
    await assertMeeting(req);
    const { voter_id, candidate_id, voto_nulo, nota_nulo } = req.body;
    if (!voter_id) return res.status(400).json({ message: 'voter_id es requerido' });
    const result = await ElectionsService.castVote(req.params.id, req.params.electionId, voter_id, candidate_id || null, req.user.id, !!voto_nulo, nota_nulo || null);
    res.status(201).json(result);
  } catch (e) { handle(res, e); }
};

exports.close = async (req, res) => {
  try {
    await assertMeeting(req);
    const result = await ElectionsService.closeElection(req.params.id, req.params.electionId, req.user.id);
    res.json(result);
  } catch (e) { handle(res, e); }
};

exports.list = async (req, res) => {
  try {
    await assertMeeting(req);
    res.json(await ElectionsService.getElectionsByMeeting(req.params.id));
  } catch (e) { handle(res, e); }
};

exports.results = async (req, res) => {
  try {
    await assertMeeting(req);
    res.json(await ElectionsService.getElectionResults(req.params.electionId));
  } catch (e) { handle(res, e); }
};

exports.padron = async (req, res) => {
  try {
    await assertMeeting(req);
    res.json(await ElectionsService.getElectionPadron(req.params.electionId));
  } catch (e) { handle(res, e); }
};

exports.candidates = async (req, res) => {
  try {
    await assertMeeting(req);
    res.json(await ElectionsService.getElectionCandidates(req.params.electionId));
  } catch (e) { handle(res, e); }
};
