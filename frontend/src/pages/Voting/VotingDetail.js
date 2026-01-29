import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { votingService } from '../../services/votingService';
import { voteService } from '../../services/voteService';
import './VotingDetail.css';

const VotingDetail = () => {
  const { meetingId, votingId } = useParams();
  const navigate = useNavigate();
  const [voting, setVoting] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadVotingData();
  }, [votingId]);

  const loadVotingData = async () => {
    try {
      const [votingRes, votesRes] = await Promise.all([
        votingService.getByMeeting(meetingId).then(res => 
          res.data.find(v => v.id === parseInt(votingId))
        ),
        voteService.getByVoting(votingId)
      ]);
      
      setVoting(votingRes);
      setVotes(votesRes.data);
    } catch (error) {
      console.error('Error loading voting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (e) => {
    e.preventDefault();
    if (!selectedOption) {
      alert('Por favor selecciona una opción');
      return;
    }

    setSubmitting(true);
    try {
      // En producción, member_id vendría del contexto de autenticación
      const memberId = 1; // Temporal
      await voteService.cast({
        voting_id: parseInt(votingId),
        member_id: memberId,
        option: selectedOption
      });
      alert('Voto registrado exitosamente');
      loadVotingData();
    } catch (error) {
      console.error('Error casting vote:', error);
      const errorMessage = error.response?.data?.message || 'Error al registrar el voto';
      const quorumInfo = error.response?.data?.quorum;
      if (quorumInfo) {
        alert(`${errorMessage}\n\n${quorumInfo.message}`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (!voting) return <div className="error">Votación no encontrada</div>;

  const options = ['Sí', 'No', 'Abstención'];

  return (
    <div className="voting-detail">
      <div className="container">
        <button onClick={() => navigate(`/meetings/${meetingId}`)} className="btn-back">
          ← Volver a Reunión
        </button>

        <div className="voting-header">
          <h1>{voting.title}</h1>
          <span className={`voting-status status-${voting.status}`}>
            {voting.status}
          </span>
        </div>

        {voting.description && (
          <div className="voting-description">
            <p>{voting.description}</p>
          </div>
        )}

        {voting.status === 'active' && (
          <div className="voting-form-section">
            <h2>Registrar Voto</h2>
            <form onSubmit={handleVote} className="voting-form">
              <div className="options-group">
                {options.map(option => (
                  <label key={option} className="option-radio">
                    <input
                      type="radio"
                      name="vote"
                      value={option}
                      checked={selectedOption === option}
                      onChange={(e) => setSelectedOption(e.target.value)}
                    />
                    <span className="radio-label">{option}</span>
                  </label>
                ))}
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-large"
                disabled={submitting || !selectedOption}
              >
                {submitting ? 'Registrando...' : 'Registrar Voto'}
              </button>
            </form>
          </div>
        )}

        <div className="votes-section">
          <h2>Votos Registrados ({votes.length})</h2>
          {votes.length === 0 ? (
            <p className="empty">No hay votos registrados aún</p>
          ) : (
            <div className="votes-list">
              {votes.map(vote => (
                <div key={vote.id} className="vote-item">
                  <div className="vote-member">
                    <strong>{vote.member_name}</strong>
                    <span className="vote-role">{vote.role}</span>
                  </div>
                  <span className={`vote-option option-${vote.option.toLowerCase()}`}>
                    {vote.option}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VotingDetail;

