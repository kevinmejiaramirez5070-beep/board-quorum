import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { votingService } from '../../services/votingService';
import jsPDF from 'jspdf';
import './VotingResults.css';

const VotingResults = () => {
  const { meetingId, votingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [votingId]);

  const loadResults = async () => {
    try {
      const response = await votingService.getResults(votingId);
      setResults(response.data);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = () => {
    if (!results) return;

    const { voting, results: voteResults, votes, totalVotes, majority, majorityValidation } = results;
    const doc = new jsPDF();
    
    // Configuración
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;
    const lineHeight = 7;
    
    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(language === 'es' ? 'Resultados de Votación' : 'Voting Results', margin, yPos);
    yPos += lineHeight * 2;
    
    // Título de la votación
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(voting.title, pageWidth - 2 * margin);
    doc.text(titleLines, margin, yPos);
    yPos += lineHeight * (titleLines.length + 1);
    
    // Fecha
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const date = new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`${language === 'es' ? 'Generado el' : 'Generated on'}: ${date}`, margin, yPos);
    yPos += lineHeight * 2;
    
    // Resumen
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(language === 'es' ? 'Resumen' : 'Summary', margin, yPos);
    yPos += lineHeight;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${language === 'es' ? 'Total de Votos' : 'Total Votes'}: ${totalVotes}`, margin, yPos);
    yPos += lineHeight;
    
    if (majority !== undefined) {
      doc.text(`${language === 'es' ? 'Mayoría Requerida' : 'Required Majority'}: ${majority}`, margin, yPos);
      yPos += lineHeight;
    }
    
    if (majorityValidation) {
      doc.setFont('helvetica', 'bold');
      const status = majorityValidation.approved 
        ? (language === 'es' ? 'APROBADA' : 'APPROVED')
        : (language === 'es' ? 'RECHAZADA' : 'REJECTED');
      doc.text(`${language === 'es' ? 'Resultado' : 'Result'}: ${status}`, margin, yPos);
      yPos += lineHeight;
      doc.setFont('helvetica', 'normal');
      doc.text(majorityValidation.message, margin, yPos);
      yPos += lineHeight * 2;
    } else {
      yPos += lineHeight;
    }
    
    // Distribución de votos
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(language === 'es' ? 'Distribución de Votos' : 'Vote Distribution', margin, yPos);
    yPos += lineHeight;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    voteResults.forEach((result, index) => {
      const percentage = totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0;
      const text = `${result.option}: ${result.votes} ${language === 'es' ? 'votos' : 'votes'} (${percentage.toFixed(1)}%)`;
      
      // Verificar si necesitamos una nueva página
      if (yPos > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.text(text, margin, yPos);
      yPos += lineHeight;
    });
    
    yPos += lineHeight;
    
    // Detalle de votos
    if (yPos > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      yPos = margin;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(language === 'es' ? 'Detalle de Votos' : 'Vote Details', margin, yPos);
    yPos += lineHeight;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Encabezados de tabla
    doc.setFont('helvetica', 'bold');
    doc.text(language === 'es' ? 'Miembro' : 'Member', margin, yPos);
    doc.text(language === 'es' ? 'Rol' : 'Role', margin + 80, yPos);
    doc.text(language === 'es' ? 'Voto' : 'Vote', margin + 130, yPos);
    yPos += lineHeight;
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += lineHeight;
    
    // Votos individuales
    doc.setFont('helvetica', 'normal');
    votes.forEach((vote) => {
      // Verificar si necesitamos una nueva página
      if (yPos > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = margin;
      }
      
      const memberName = doc.splitTextToSize(vote.member_name, 70);
      const role = doc.splitTextToSize(vote.role || '-', 40);
      const option = vote.option;
      
      doc.text(memberName, margin, yPos);
      doc.text(role, margin + 80, yPos);
      doc.text(option, margin + 130, yPos);
      yPos += lineHeight * Math.max(memberName.length, role.length, 1);
    });
    
    // Guardar PDF
    const fileName = `Resultados_Votacion_${voting.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
  };

  if (loading) return <div className="loading">{language === 'es' ? 'Cargando resultados...' : 'Loading results...'}</div>;
  if (!results) return <div className="error">{language === 'es' ? 'No se pudieron cargar los resultados' : 'Could not load results'}</div>;

  const { voting, results: voteResults, votes, totalVotes, majority, majorityValidation } = results;
  const maxVotes = Math.max(...voteResults.map(r => r.votes), 0);
  
  // Verificar si el usuario puede generar reportes (admin, admin_master, authorized)
  const canGenerateReports = user?.role === 'admin' || user?.role === 'admin_master' || user?.role === 'authorized';

  return (
    <div className="voting-results">
      <div className="container">
        <button onClick={() => navigate(`/meetings/${meetingId}`)} className="btn-back">
          ← Volver a Reunión
        </button>

        <div className="results-header">
          <h1>{language === 'es' ? 'Resultados de Votación' : 'Voting Results'}</h1>
          <h2>{voting.title}</h2>
        </div>

        <div className="results-summary">
          <div className="summary-card">
            <div className="summary-value">{totalVotes}</div>
            <div className="summary-label">{language === 'es' ? 'Total de Votos' : 'Total Votes'}</div>
          </div>
          {majority !== undefined && (
            <div className="summary-card">
              <div className="summary-value">{majority}</div>
              <div className="summary-label">{language === 'es' ? 'Mayoría Requerida' : 'Required Majority'}</div>
            </div>
          )}
          {majorityValidation && (
            <div className={`summary-card ${majorityValidation.approved ? 'approved' : 'rejected'}`}>
              <div className="summary-value">
                {majorityValidation.approved ? '✓' : '✗'}
              </div>
              <div className="summary-label">
                {majorityValidation.approved 
                  ? (language === 'es' ? 'APROBADA' : 'APPROVED')
                  : (language === 'es' ? 'RECHAZADA' : 'REJECTED')
                }
              </div>
            </div>
          )}
        </div>

        {majorityValidation && (
          <div className={`majority-validation ${majorityValidation.approved ? 'approved' : 'rejected'}`}>
            <h3>{language === 'es' ? 'Validación de Mayoría Simple' : 'Simple Majority Validation'}</h3>
            <div className="validation-details">
              <div className="validation-item">
                <span className="label">{language === 'es' ? 'Votos Afirmativos:' : 'Affirmative Votes:'}</span>
                <span className="value">{majorityValidation.affirmative}</span>
              </div>
              <div className="validation-item">
                <span className="label">{language === 'es' ? 'Mayoría Requerida:' : 'Required Majority:'}</span>
                <span className="value">{majorityValidation.majority}</span>
              </div>
              <div className="validation-item">
                <span className="label">{language === 'es' ? 'Total Votos Emitidos:' : 'Total Votes Cast:'}</span>
                <span className="value">{majorityValidation.total}</span>
              </div>
            </div>
            <div className={`validation-result ${majorityValidation.approved ? 'approved' : 'rejected'}`}>
              {majorityValidation.message}
            </div>
          </div>
        )}

        <div className="results-chart">
          <h3>{language === 'es' ? 'Distribución de Votos' : 'Vote Distribution'}</h3>
          <div className="chart-container">
            {voteResults.map((result, index) => {
              const percentage = totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0;
              return (
                <div key={index} className="chart-item">
                  <div className="chart-header">
                    <span className="chart-option">{result.option}</span>
                    <span className="chart-count">{result.votes} votos ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: index === 0 ? 'var(--success)' : index === 1 ? 'var(--danger)' : 'var(--warning)'
                      }}
                    >
                      <span className="chart-percentage">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="votes-detail">
          <h3>{language === 'es' ? 'Detalle de Votos' : 'Vote Details'}</h3>
          <div className="votes-table">
            <div className="table-header">
              <div>{language === 'es' ? 'Miembro' : 'Member'}</div>
              <div>{language === 'es' ? 'Rol' : 'Role'}</div>
              <div>{language === 'es' ? 'Voto' : 'Vote'}</div>
            </div>
            {votes.map(vote => (
              <div key={vote.id} className="table-row">
                <div><strong>{vote.member_name}</strong></div>
                <div>{vote.role}</div>
                <div>
                  <span className={`vote-badge option-${vote.option.toLowerCase()}`}>
                    {vote.option}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="results-actions">
          {canGenerateReports && (
            <button className="btn btn-primary" onClick={generatePDF}>
              📄 {language === 'es' ? 'Generar PDF' : 'Generate PDF'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => window.print()}>
            🖨️ {language === 'es' ? 'Imprimir' : 'Print'}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate(`/meetings/${meetingId}`)}>
            {language === 'es' ? '← Volver a Reunión' : '← Back to Meeting'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VotingResults;

