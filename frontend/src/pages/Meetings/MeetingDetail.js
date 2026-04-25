import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { meetingService } from '../../services/meetingService';
import { attendanceService } from '../../services/attendanceService';
import { votingService } from '../../services/votingService';
import { displayNameWithAccents } from '../../utils/nameDisplay';
import jsPDF from 'jspdf';
import './MeetingDetail.css';

const MeetingDetail = () => {
  const { id, meetingId } = useParams();
  const meetingIdParam = meetingId || id;
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { client, user } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [votings, setVotings] = useState([]);
  const [quorum, setQuorum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [votingLink, setVotingLink] = useState(null);
  const [attendanceLink, setAttendanceLink] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [showQuorumProjection, setShowQuorumProjection] = useState(false);
  const [quorumDetail, setQuorumDetail] = useState(null);
  const [showQuorumDetail, setShowQuorumDetail] = useState(false);
  const [showJvModal, setShowJvModal] = useState(false);
  const [jvRepresentative, setJvRepresentative] = useState(null);
  const [jvRepresentativeId, setJvRepresentativeId] = useState(null);
  const quorumIntervalRef = useRef(null);

  const getStatusLabel = (status) => {
    const labels = {
      es: {
        scheduled: 'Programada',
        active: 'Activa',
        completed: 'Completada'
      },
      en: {
        scheduled: 'Scheduled',
        active: 'Active',
        completed: 'Completed'
      }
    };
    return labels[language]?.[status] || status;
  };

  useEffect(() => {
    loadMeetingData();
    
    // Limpiar intervalo al desmontar
    return () => {
      if (quorumIntervalRef.current) {
        clearInterval(quorumIntervalRef.current);
      }
    };
  }, [meetingIdParam]);

  // Si se abre la pantalla con un hash (ej. #meeting-quorum-card),
  // nos aseguramos de hacer scroll al bloque correcto.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const targetId = hash.replace('#', '');
    if (!targetId) return;

    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [meetingIdParam]);

  // Polling cada 4 segundos: asistencia + quórum se actualizan solos (sin recargar página)
  useEffect(() => {
    if (!meeting || !meetingIdParam) return;

    if (quorumIntervalRef.current) {
      clearInterval(quorumIntervalRef.current);
    }

    const POLL_INTERVAL_MS = 4000;
    quorumIntervalRef.current = setInterval(() => {
      loadAttendanceAndQuorum();
    }, POLL_INTERVAL_MS);

    return () => {
      if (quorumIntervalRef.current) {
        clearInterval(quorumIntervalRef.current);
        quorumIntervalRef.current = null;
      }
    };
  }, [meeting?.id, meetingIdParam]);

  const loadMeetingData = async () => {
    try {
      // Cargar datos principales primero
      const [meetingRes, attendanceRes, votingsRes] = await Promise.all([
        meetingService.getById(meetingIdParam),
        attendanceService.getByMeeting(meetingIdParam),
        votingService.getByMeeting(meetingIdParam)
      ]);
      
      setMeeting(meetingRes.data);
      setAttendance(attendanceRes.data);
      
      // Generar el link de asistencia automáticamente
      const attendanceLink = `${window.location.origin}/public/meeting/${meetingIdParam}/attendance`;
      setAttendanceLink(attendanceLink);
      
      // Asegurar que votings sea un array
      const votingsData = Array.isArray(votingsRes.data) ? votingsRes.data : [];
      setVotings(votingsData);
      
      // VOT-LINK fix: link apunta a la reunión (votación activa dinámica), no a un ID fijo
      if (votingsData.length > 0) {
        const link = `${window.location.origin}/public/meeting/${meetingIdParam}/vote`;
        setVotingLink(link);
      } else {
        setVotingLink(null);
      }
      
      // Intentar cargar quorum, pero no fallar si hay error
      try {
        const quorumRes = await meetingService.getQuorum(meetingIdParam);
        setQuorum(quorumRes.data);
      } catch (quorumError) {
        console.warn('Error loading quorum (non-critical):', quorumError);
        setQuorum(null);
      }
    } catch (error) {
      console.error('Error loading meeting data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función separada para cargar solo el quórum (para actualización automática)
  const loadQuorum = async () => {
    try {
      const quorumRes = await meetingService.getQuorum(meetingIdParam);
      setQuorum(quorumRes.data);
    } catch (quorumError) {
      console.warn('Error loading quorum (non-critical):', quorumError);
    }
  };

  // Actualización de asistencia + quórum para polling (sin recargar página)
  const loadAttendanceAndQuorum = async () => {
    try {
      const [attendanceRes, quorumRes] = await Promise.all([
        attendanceService.getByMeeting(meetingIdParam),
        meetingService.getQuorum(meetingIdParam)
      ]);
      setAttendance(attendanceRes.data ?? []);
      setQuorum(quorumRes.data);
    } catch (err) {
      console.warn('Error en actualización automática asistencia/quórum:', err);
    }
  };

  const handleActivateVoting = async (targetVotingId) => {
    try {
      setErrorMessage(null);
      // VOT-SIMULTANEA: si ya hay una activa, pedir confirmación antes de continuar
      const activeVoting = votings.find(v => v.status === 'active');
      if (activeVoting && activeVoting.id !== targetVotingId) {
        const confirmMsg = language === 'es'
          ? `Hay una votación activa: "${activeVoting.title}". ¿Cerrarla y activar la nueva?`
          : `There is an active voting: "${activeVoting.title}". Close it and activate the new one?`;
        if (!window.confirm(confirmMsg)) return;
        // Cerrar la activa primero
        await votingService.close(activeVoting.id);
      }
      await votingService.activate(targetVotingId);
      loadMeetingData();
    } catch (error) {
      console.error('Error activating voting:', error);
      setErrorMessage(error.response?.data?.message || t('errorActivatingVoting'));
    }
  };

  const handleLoadQuorumDetail = async () => {
    try {
      const res = await meetingService.getQuorumDetail(meetingIdParam);
      setQuorumDetail(res.data);
      setShowQuorumDetail(true);
    } catch (err) {
      console.error('Error cargando detalle de quórum:', err);
    }
  };

  const handleSetJvRepresentative = async () => {
    if (!jvRepresentativeId) return;
    try {
      await meetingService.setJvRepresentative(meetingIdParam, jvRepresentativeId);
      const selected = attendance.find(a => String(a.member_id) === String(jvRepresentativeId));
      setJvRepresentative(selected);
      setShowJvModal(false);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Error al designar representante JV');
    }
  };

  const handleCloseVoting = async (targetVotingId) => {
    const confirmMsg = language === 'es'
      ? '¿Cerrar esta votación? No se podrán registrar más votos.'
      : 'Close this voting? No more votes will be accepted.';
    if (!window.confirm(confirmMsg)) return;
    try {
      setErrorMessage(null);
      await votingService.close(targetVotingId);
      loadMeetingData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || (language === 'es' ? 'Error al cerrar la votación' : 'Error closing voting'));
    }
  };

  const handleInstallSession = async () => {
    try {
      setErrorMessage(null);
      await meetingService.installSession(meetingIdParam);
      await loadMeetingData();
    } catch (error) {
      console.error('Error installing session:', error);
      const msg = error.response?.data?.message || (language === 'es' ? 'Error al instalar la sesión' : 'Error installing session');
      setErrorMessage(msg);
    }
  };

  const addPdfBranding = (doc, pdfTitle) => {
    const pageCount = doc.getNumberOfPages();
    const clientName = (client?.name || 'ASOCOLCI').toUpperCase();
    const meetingTypeLabel = meeting?.type === 'junta_directiva'
      ? (language === 'es' ? 'Junta Directiva' : 'Board of Directors')
      : meeting?.type === 'asamblea'
        ? (language === 'es' ? 'Asamblea General' : 'General Assembly')
        : (meeting?.type || (language === 'es' ? 'Reunión' : 'Meeting'));
    const meetingDateLabel = meeting?.date
      ? new Date(meeting.date).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')
      : '-';

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(clientName, 12, 9);
      doc.setFont('helvetica', 'normal');
      doc.text(`${meeting?.title || '-'} · ${meetingTypeLabel} · ${meetingDateLabel}`, 12, 14);
      doc.setLineWidth(0.2);
      doc.line(10, 20, pageWidth - 10, 20);

      // Footer
      doc.setLineWidth(0.2);
      doc.line(10, pageHeight - 14, pageWidth - 10, pageHeight - 14);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `${language === 'es' ? 'Generado por' : 'Generated by'} BOARD QUORUM · Plataforma de gobernanza · ${pdfTitle}`,
        12,
        pageHeight - 8
      );
      doc.text(
        `${language === 'es' ? 'Pág' : 'Page'} ${i}/${pageCount}`,
        pageWidth - 30,
        pageHeight - 8
      );
    }
  };

  // Generar PDF de asistencia
  const generateAttendancePDF = () => {
    if (!meeting || !attendance) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 28;
    let yPos = margin;
    const lineHeight = 7;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(language === 'es' ? 'Lista de Asistencia' : 'Attendance List', margin, yPos);
    yPos += lineHeight * 2;

    // Información de la reunión
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(language === 'es' ? 'Reunión:' : 'Meeting:', margin, yPos);
    yPos += lineHeight;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const meetingTitleLines = doc.splitTextToSize(meeting.title, pageWidth - 2 * margin);
    doc.text(meetingTitleLines, margin, yPos);
    yPos += lineHeight * (meetingTitleLines.length + 1);

    doc.text(`${language === 'es' ? 'Fecha:' : 'Date:'} ${new Date(meeting.date).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}`, margin, yPos);
    yPos += lineHeight;

    if (meeting.location) {
      doc.text(`${language === 'es' ? 'Ubicación:' : 'Location:'} ${meeting.location}`, margin, yPos);
      yPos += lineHeight;
    }

    yPos += lineHeight;

    // Resumen de quórum
    if (quorum) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'es' ? 'Resumen de Quórum' : 'Quorum Summary', margin, yPos);
      yPos += lineHeight;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${language === 'es' ? 'Presentes:' : 'Present:'} ${quorum.present}`, margin, yPos);
      yPos += lineHeight;
      doc.text(`${language === 'es' ? 'Total:' : 'Total:'} ${quorum.total}`, margin, yPos);
      yPos += lineHeight;
      const pct = quorum.percentage != null ? quorum.percentage : (quorum.total > 0 ? Math.round((quorum.present / quorum.total) * 100) : 0);
      doc.text(`${language === 'es' ? 'Porcentaje:' : 'Percentage:'} ${pct}%`, margin, yPos);
      yPos += lineHeight;
      doc.setFont('helvetica', 'bold');
      doc.text(quorum.met 
        ? (language === 'es' ? 'Quorum alcanzado' : 'Quorum reached')
        : (language === 'es' ? 'Quorum no alcanzado' : 'Quorum not reached'), 
        margin, yPos);
      yPos += lineHeight * 2;
    }

    // Lista de asistencia
    if (yPos > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(language === 'es' ? 'Lista de Asistentes' : 'Attendees List', margin, yPos);
    yPos += lineHeight;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(language === 'es' ? 'Miembro' : 'Member', margin, yPos);
    doc.text(language === 'es' ? 'Rol' : 'Role', margin + 80, yPos);
    doc.text(language === 'es' ? 'Estado' : 'Status', margin + 130, yPos);
    yPos += lineHeight;

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += lineHeight;

    // Asistentes (nombres y roles normalizados para PDF - BUG-05, BUG-06)
    doc.setFont('helvetica', 'normal');
    attendance.forEach((item) => {
      if (yPos > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        yPos = margin;
      }

      const memberName = doc.splitTextToSize(displayNameWithAccents(item.member_name) || '-', 70);
      const role = doc.splitTextToSize(displayNameWithAccents(item.role) || '-', 40);
      const status = item.pending_approval
        ? (language === 'es' ? 'Pendiente de validación' : 'Pending validation')
        : (item.status === 'present'
          ? (language === 'es' ? 'Presente' : 'Present')
          : (item.status === 'rejected'
            ? (language === 'es' ? 'Rechazado' : 'Rejected')
            : item.status));

      doc.text(memberName, margin, yPos);
      doc.text(role, margin + 80, yPos);
      doc.text(status, margin + 130, yPos);
      yPos += lineHeight * Math.max(memberName.length, role.length, 1);
    });

    // Fecha de generación
    yPos += lineHeight;
    if (yPos > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPos = margin;
    }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    const generatedDate = new Date().toLocaleString(language === 'es' ? 'es-ES' : 'en-US');
    doc.text(`${language === 'es' ? 'Generado el' : 'Generated on'}: ${generatedDate}`, margin, yPos);

    addPdfBranding(doc, language === 'es' ? 'Reporte de Asistencia' : 'Attendance Report');
    // Guardar PDF
    const fileName = `Asistencia_${meeting.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
  };

  const isAdminForApproval = user?.role === 'admin' || user?.role === 'admin_master';
  const canAuthorizedLive = user?.role === 'authorized' || user?.role === 'admin_master';
  const canAdminPrep = user?.role === 'admin' || user?.role === 'admin_master';

  const handleApproveAttendance = async (attendanceId) => {
    try {
      await attendanceService.approvePending(attendanceId);
      await loadAttendanceAndQuorum();
    } catch (error) {
      console.error('Error approving attendance:', error);
      setErrorMessage(error.response?.data?.message || (language === 'es' ? 'Error al aprobar asistencia' : 'Error approving attendance'));
    }
  };

  const handleRejectAttendance = async (attendanceId) => {
    try {
      await attendanceService.rejectPending(attendanceId);
      await loadAttendanceAndQuorum();
    } catch (error) {
      console.error('Error rejecting attendance:', error);
      setErrorMessage(error.response?.data?.message || (language === 'es' ? 'Error al rechazar asistencia' : 'Error rejecting attendance'));
    }
  };

  // Generar reporte completo de reunión (asistencia + todas las votaciones)
  const generateFullMeetingReport = async () => {
    if (!meeting || !attendance) return;

    try {
      // Cargar resultados de todas las votaciones
      const votingResultsPromises = votings.map(voting => 
        votingService.getResults(voting.id).catch(err => {
          console.warn(`Error loading results for voting ${voting.id}:`, err);
          return null;
        })
      );
      const allVotingResults = await Promise.all(votingResultsPromises);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 28;
      let yPos = margin;
      const lineHeight = 7;

      // Portada
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'es' ? 'REPORTE COMPLETO DE REUNIÓN' : 'COMPLETE MEETING REPORT', margin, yPos);
      yPos += lineHeight * 3;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const meetingTitleLines = doc.splitTextToSize(meeting.title, pageWidth - 2 * margin);
      doc.text(meetingTitleLines, margin, yPos);
      yPos += lineHeight * (meetingTitleLines.length + 1);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${language === 'es' ? 'Fecha:' : 'Date:'} ${new Date(meeting.date).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}`, margin, yPos);
      yPos += lineHeight;
      if (meeting.location) {
        doc.text(`${language === 'es' ? 'Ubicación:' : 'Location:'} ${meeting.location}`, margin, yPos);
        yPos += lineHeight;
      }
      yPos += lineHeight * 2;

      // Sección 1: Asistencia
      if (yPos > doc.internal.pageSize.getHeight() - 100) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'es' ? '1. ASISTENCIA' : '1. ATTENDANCE', margin, yPos);
      yPos += lineHeight * 2;

      if (quorum) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(language === 'es' ? 'Resumen de Quórum' : 'Quorum Summary', margin, yPos);
        yPos += lineHeight;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const pctFull = quorum.percentage != null ? quorum.percentage : (quorum.total > 0 ? Math.round((quorum.present / quorum.total) * 100) : 0);
        doc.text(`${language === 'es' ? 'Presentes:' : 'Present:'} ${quorum.present}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`${language === 'es' ? 'Total:' : 'Total:'} ${quorum.total}`, margin, yPos);
        yPos += lineHeight;
        doc.text(`${language === 'es' ? 'Porcentaje:' : 'Percentage:'} ${pctFull}%`, margin, yPos);
        yPos += lineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text(quorum.met 
          ? (language === 'es' ? 'Quorum alcanzado' : 'Quorum reached')
          : (language === 'es' ? 'Quorum no alcanzado' : 'Quorum not reached'), 
          margin, yPos);
        yPos += lineHeight * 2;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'es' ? 'Lista de Asistentes' : 'Attendees List', margin, yPos);
      yPos += lineHeight;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'es' ? 'Miembro' : 'Member', margin, yPos);
      doc.text(language === 'es' ? 'Rol' : 'Role', margin + 80, yPos);
      doc.text(language === 'es' ? 'Estado' : 'Status', margin + 130, yPos);
      yPos += lineHeight;

      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += lineHeight;

      doc.setFont('helvetica', 'normal');
      attendance.forEach((item) => {
        if (yPos > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage();
          yPos = margin;
        }

        const memberName = doc.splitTextToSize(displayNameWithAccents(item.member_name) || '-', 70);
        const role = doc.splitTextToSize(displayNameWithAccents(item.role) || '-', 40);
        const status = item.status === 'present' 
          ? (language === 'es' ? 'Presente' : 'Present')
          : item.status;

        doc.text(memberName, margin, yPos);
        doc.text(role, margin + 80, yPos);
        doc.text(status, margin + 130, yPos);
        yPos += lineHeight * Math.max(memberName.length, role.length, 1);
      });

      yPos += lineHeight * 2;

      // Sección 2: Votaciones
      if (votings.length > 0) {
        if (yPos > doc.internal.pageSize.getHeight() - 100) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(language === 'es' ? '2. VOTACIONES' : '2. VOTINGS', margin, yPos);
        yPos += lineHeight * 2;

        votings.forEach((voting, index) => {
          if (yPos > doc.internal.pageSize.getHeight() - 80) {
            doc.addPage();
            yPos = margin;
          }

          // Título de la votación
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. ${voting.title}`, margin, yPos);
          yPos += lineHeight;

          if (voting.description) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const descLines = doc.splitTextToSize(voting.description, pageWidth - 2 * margin);
            doc.text(descLines, margin, yPos);
            yPos += lineHeight * descLines.length;
          }

          // Resultados de la votación
          const votingResult = allVotingResults[index];
          if (votingResult && votingResult.data) {
            const { results: voteResults, votes, totalVotes, majorityValidation } = votingResult.data;

            yPos += lineHeight;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(language === 'es' ? 'Resultados:' : 'Results:', margin, yPos);
            yPos += lineHeight;

            doc.setFont('helvetica', 'normal');
            doc.text(`${language === 'es' ? 'Total de Votos:' : 'Total Votes:'} ${totalVotes}`, margin, yPos);
            yPos += lineHeight;

            voteResults.forEach((result) => {
              const percentage = totalVotes > 0 ? (result.votes / totalVotes) * 100 : 0;
              doc.text(`${result.option}: ${result.votes} (${percentage.toFixed(1)}%)`, margin + 10, yPos);
              yPos += lineHeight;
            });

            if (majorityValidation) {
              yPos += lineHeight;
              doc.setFont('helvetica', 'bold');
              const status = majorityValidation.approved 
                ? (language === 'es' ? 'APROBADA' : 'APPROVED')
                : (language === 'es' ? 'RECHAZADA' : 'REJECTED');
              doc.text(`${language === 'es' ? 'Resultado:' : 'Result:'} ${status}`, margin, yPos);
              yPos += lineHeight;
            }
          } else {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text(language === 'es' ? 'Sin resultados disponibles' : 'No results available', margin, yPos);
            yPos += lineHeight;
          }

          yPos += lineHeight * 2;
        });
      }

      // Fecha de generación
      if (yPos > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        yPos = margin;
      }
      yPos += lineHeight;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const generatedDate = new Date().toLocaleString(language === 'es' ? 'es-ES' : 'en-US');
      doc.text(`${language === 'es' ? 'Generado el' : 'Generated on'}: ${generatedDate}`, margin, yPos);

      addPdfBranding(doc, language === 'es' ? 'Reporte Completo' : 'Complete Report');
      // Guardar PDF
      const fileName = `Reporte_Completo_${meeting.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating full report:', error);
      alert(language === 'es' 
        ? 'Error al generar el reporte completo. Por favor, intente nuevamente.'
        : 'Error generating full report. Please try again.');
    }
  };

  if (loading) return <div className="loading">{t('loading')}</div>;
  if (!meeting) return <div className="error">{t('meetingNotFound')}</div>;

  return (
    <>
    <div className="meeting-detail">
      {errorMessage && (
        <div className="error-modal-overlay" onClick={() => setErrorMessage(null)}>
          <div className="error-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="error-card-header">
              <span className="error-icon">⚠️</span>
              <h3>{language === 'es' ? 'Error al Activar Votación' : 'Error Activating Voting'}</h3>
            </div>
            <div className="error-card-body">
              <p>{errorMessage}</p>
            </div>
            <div className="error-card-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setErrorMessage(null)}
              >
                {language === 'es' ? 'Aceptar' : 'Accept'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <button onClick={() => navigate('/meetings')} className="btn-back">
          ← {t('backToMeetings')}
        </button>

        <div className="meeting-header">
          <h1>{meeting.title}</h1>
          <span className={`status status-${meeting.status}`}>{getStatusLabel(meeting.status)}</span>
        </div>

        <div className="meeting-info">
          <div className="info-item">
            <strong>{language === 'es' ? 'Fecha:' : 'Date:'}</strong> {new Date(meeting.date).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
          </div>
          {meeting.location && (
            <div className="info-item">
              <strong>{language === 'es' ? 'Ubicación:' : 'Location:'}</strong> {meeting.location}
            </div>
          )}
          {meeting.description && (
            <div className="info-item">
              <strong>{language === 'es' ? 'Descripción:' : 'Description:'}</strong> {meeting.description}
            </div>
          )}
        </div>

        {canAuthorizedLive && (
          <div style={{ marginBottom: '24px', textAlign: 'right' }}>
            <button 
              className="btn btn-primary"
              onClick={generateFullMeetingReport}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '16px' }}
            >
              📊 {language === 'es' ? 'Generar Reporte Completo' : 'Generate Full Report'}
            </button>
          </div>
        )}

        {/* Sección de Links Importantes */}
        {(meeting.google_meet_link || votingLink || attendanceLink) && (
          <div className="links-section">
            <h3 style={{ marginBottom: '16px', fontSize: '20px', color: 'var(--text-primary)' }}>
              {language === 'es' ? 'Links Importantes' : 'Important Links'}
            </h3>
            <div className="links-grid">
              {meeting.google_meet_link && (
                <div className="link-card">
                  <div className="link-icon">📹</div>
                  <div className="link-content">
                    <h4>{language === 'es' ? 'Google Meet' : 'Google Meet'}</h4>
                    <p className="link-description">
                      {language === 'es' 
                        ? 'Link para unirse a la reunión en Google Meet'
                        : 'Link to join the meeting in Google Meet'}
                    </p>
                    <a 
                      href={meeting.google_meet_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="link-button"
                    >
                      {language === 'es' ? 'Unirse a Google Meet' : 'Join Google Meet'} →
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(meeting.google_meet_link);
                        alert(language === 'es' ? 'Link copiado al portapapeles' : 'Link copied to clipboard');
                      }}
                      className="link-copy-btn"
                      title={language === 'es' ? 'Copiar link' : 'Copy link'}
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}
              
              {attendanceLink && (
                <div className="link-card">
                  <div className="link-icon">✅</div>
                  <div className="link-content">
                    <h4>{language === 'es' ? 'Link de Asistencia' : 'Attendance Link'}</h4>
                    <p className="link-description">
                      {language === 'es' 
                        ? 'Comparte este link para que los participantes registren su asistencia'
                        : 'Share this link so participants can register their attendance'}
                    </p>
                    <a 
                      href={attendanceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-button"
                    >
                      {language === 'es' ? 'Ver Link de Asistencia' : 'View Attendance Link'} →
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(attendanceLink);
                        alert(language === 'es' ? 'Link copiado al portapapeles' : 'Link copied to clipboard');
                      }}
                      className="link-copy-btn"
                      title={language === 'es' ? 'Copiar link' : 'Copy link'}
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}
              
              {votingLink && (
                <div className="link-card">
                  <div className="link-icon">🗳️</div>
                  <div className="link-content">
                    <h4>{language === 'es' ? 'Link de Votaciones' : 'Voting Link'}</h4>
                    <p className="link-description">
                      {language === 'es' 
                        ? 'Comparte este link para que los participantes puedan votar'
                        : 'Share this link so participants can vote'}
                    </p>
                    <a 
                      href={votingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-button"
                    >
                      {language === 'es' ? 'Ver Link de Votaciones' : 'View Voting Link'} →
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(votingLink);
                        alert(language === 'es' ? 'Link copiado al portapapeles' : 'Link copied to clipboard');
                      }}
                      className="link-copy-btn"
                      title={language === 'es' ? 'Copiar link' : 'Copy link'}
                    >
                      📋
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {quorum && (
          <div
            id="meeting-quorum-card"
            className={`quorum-card ${quorum.met ? 'quorum-met' : 'quorum-not-met'}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0 }}>{t('quorum')}</h3>
                {quorum.organLabel && (
                  <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {quorum.organLabel}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {meeting.status === 'active' && (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {language === 'es' ? 'Actualización automática cada 5 segundos' : 'Auto-updating every 5 seconds'}
                  </span>
                )}
                {canAuthorizedLive && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-quorum-projection"
                    onClick={() => setShowQuorumProjection(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    🖥️ {language === 'es' ? 'Proyectar en pantalla completa' : 'Project full screen'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleLoadQuorumDetail}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  🔍 {language === 'es' ? 'Ver detalle' : 'View detail'}
                </button>
              </div>
            </div>
            <div className="quorum-stats">
              <div className="stat">
                <span className="stat-value">{quorum.present}</span>
                <span className="stat-label">
                  {quorum.quorumRule === 'jd_fixed_min_7_of_12_slots'
                    ? (language === 'es' ? 'Votos computables' : 'Countable votes')
                    : (language === 'es' ? 'Presentes' : 'Present')}
                </span>
              </div>
              <div className="stat">
                <span className="stat-value">{quorum.required ?? '-'}</span>
                <span className="stat-label">{language === 'es' ? 'Mínimo requerido' : 'Minimum required'}</span>
              </div>
              <div className="stat">
                <span className="stat-value">{quorum.total}</span>
                <span className="stat-label">
                  {quorum.quorumRule === 'jd_fixed_min_7_of_12_slots'
                    ? (language === 'es' ? 'Cargos con voto (JD)' : 'JD voting seats')
                    : (language === 'es' ? 'Elegibles' : 'Eligible')}
                </span>
              </div>
              <div className="stat">
                <span className="stat-value">{(quorum.percentage ?? (quorum.total > 0 ? Math.round((quorum.present / quorum.total) * 100) : 0))}%</span>
                <span className="stat-label">
                  {quorum.quorumRule === 'jd_fixed_min_7_of_12_slots'
                    ? (language === 'es' ? 'Sobre 12 cargos' : 'Of 12 seats')
                    : (language === 'es' ? 'Porcentaje' : 'Percentage')}
                </span>
              </div>
            </div>
            <div className={`quorum-status ${quorum.met ? 'met' : 'not-met'}`}>
              {quorum.met 
                ? (language === 'es' ? '✓ Quórum alcanzado' : '✓ Quorum reached')
                : (language === 'es' ? '✗ Quórum no alcanzado' : '✗ Quorum not reached')
              }
            </div>

            {showQuorumDetail && quorumDetail && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <strong style={{ fontSize: '14px' }}>
                    🔍 {language === 'es' ? 'Detalle de quórum' : 'Quorum breakdown'}
                    <span style={{ marginLeft: '10px', color: 'var(--text-secondary)', fontWeight: 400, fontSize: '12px' }}>
                      {language === 'es'
                        ? `${quorumDetail.computable_votes} computables de ${quorumDetail.total_present} presentes`
                        : `${quorumDetail.computable_votes} countable of ${quorumDetail.total_present} present`}
                    </span>
                  </strong>
                  <button type="button" onClick={() => setShowQuorumDetail(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-secondary)' }}>✕</button>
                </div>
                {quorumDetail.jv_institutional_vote > 0 && (
                  <div style={{ background: '#e0f2fe', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', fontSize: '13px' }}>
                    ⚖️ <strong>Junta de Vigilancia</strong>: {quorumDetail.jv_members.join(', ')} → <strong>+1 voto institucional</strong>
                  </div>
                )}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left' }}>
                        <th style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-color)' }}>
                          {language === 'es' ? 'Nombre' : 'Name'}
                        </th>
                        <th style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-color)' }}>
                          {language === 'es' ? 'Cargo' : 'Role'}
                        </th>
                        <th style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
                          {language === 'es' ? 'Cuenta' : 'Counts'}
                        </th>
                        <th style={{ padding: '7px 10px', borderBottom: '1px solid var(--border-color)' }}>
                          {language === 'es' ? 'Motivo' : 'Reason'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {quorumDetail.breakdown.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: row.counts ? '#f0fdf4' : 'transparent' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 500 }}>{row.name || '—'}</td>
                          <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{row.role || '—'}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                            {row.counts ? '✅' : '—'}
                          </td>
                          <td style={{ padding: '6px 10px', fontSize: '12px', color: row.counts ? '#166534' : 'var(--text-secondary)' }}>
                            {row.reason_label}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {showQuorumProjection && quorum && (
          <div className="quorum-projection-overlay" onClick={(e) => e.target === e.currentTarget && setShowQuorumProjection(false)}>
            <div className="quorum-projection-content">
              <button
                type="button"
                className="quorum-projection-close"
                onClick={() => setShowQuorumProjection(false)}
                aria-label={language === 'es' ? 'Salir de proyección' : 'Exit projection'}
              >
                ✕ {language === 'es' ? 'Salir de proyección' : 'Exit projection'}
              </button>
              <header className="quorum-projection-header">
                BOARD QUORUM ·{' '}
                {(quorum.organLabel
                  ? quorum.organLabel
                  : meeting?.type === 'junta_directiva'
                    ? (language === 'es' ? 'Junta Directiva' : 'BOARD OF DIRECTORS')
                    : meeting?.type === 'asamblea'
                      ? (language === 'es' ? 'Asamblea General' : 'GENERAL ASSEMBLY')
                      : (meeting?.type || (language === 'es' ? 'Reunión' : 'Meeting'))
                ).toUpperCase()}{' '}
                · {(client?.name || '').toUpperCase() || (language === 'es' ? 'ORGANIZACIÓN' : 'ORGANIZATION')}
              </header>
              <div className={`quorum-projection-result ${quorum.met ? 'met' : 'not-met'}`}>
                <div className="quorum-projection-badge">
                  {quorum.met ? (language === 'es' ? 'SÍ' : 'YES') : (language === 'es' ? 'NO' : 'NO')}
                </div>
                <h1 className="quorum-projection-title">
                  {quorum.met 
                    ? (language === 'es' ? 'QUÓRUM ALCANZADO' : 'QUORUM REACHED')
                    : (language === 'es' ? 'QUÓRUM NO ALCANZADO' : 'QUORUM NOT REACHED')
                  }
                </h1>
                {!quorum.met && quorum.required != null && (
                  <p className="quorum-projection-subtitle">
                    {language === 'es' 
                      ? `Faltan ${Math.max(0, quorum.required - quorum.present)} miembros más`
                      : `${Math.max(0, quorum.required - quorum.present)} more members needed`
                    }
                  </p>
                )}
              </div>
              <div className="quorum-projection-details">
                <div className="quorum-projection-row">
                  <span className="quorum-projection-label">{language === 'es' ? 'Quórum deliberatorio:' : 'Deliberative quorum:'}</span>
                  <span className="quorum-projection-value">
                    {quorum.present} {language === 'es' ? 'votan quórum' : 'vote quorum'} / {quorum.required ?? '-'} {language === 'es' ? 'mínimos requeridos' : 'minimum required'}
                  </span>
                </div>
                <div className="quorum-projection-row">
                  <span className="quorum-projection-label">{language === 'es' ? 'Regla de quórum:' : 'Quorum rule:'}</span>
                  <span className="quorum-projection-value">
                    {quorum.quorumRule === 'jd_fixed_min_7_of_12_slots'
                      ? (language === 'es'
                        ? `Mínimo fijo ${quorum.required ?? 7} sobre ${quorum.total ?? 12} cargos con voto (no aplica % sobre personas en BD).`
                        : `Fixed minimum ${quorum.required ?? 7} of ${quorum.total ?? 12} voting seats.`)
                      : `${quorum.required ?? '-'} ${language === 'es' ? 'votos' : 'votes'} (${quorum.total > 0 ? Math.round(((quorum.required ?? 0) / quorum.total) * 100) : 0}% ${language === 'es' ? 'de' : 'of'} ${quorum.total} ${language === 'es' ? 'elegibles' : 'eligible'})`}
                  </span>
                </div>
                <div className="quorum-projection-row">
                  <span className="quorum-projection-label">{language === 'es' ? 'Total presentes en la reunión:' : 'Total present at meeting:'}</span>
                  <span className="quorum-projection-value">{quorum.present} / {quorum.total}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance')}
          >
            {t('attendance')} ({attendance.length})
          </button>
          <button 
            className={`tab ${activeTab === 'votings' ? 'active' : ''}`}
            onClick={() => setActiveTab('votings')}
          >
            {t('votings')} ({votings.length})
          </button>
        </div>

        <div className="tab-content">
              {activeTab === 'attendance' && (
            <div className="attendance-section">
              <div className="section-header">
                <h2>{language === 'es' ? 'Lista de Asistencia' : 'Attendance List'}</h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {canAuthorizedLive && (
                    <button 
                      className="btn btn-secondary"
                      onClick={generateAttendancePDF}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      📄 {language === 'es' ? 'Generar PDF Asistencia' : 'Generate Attendance PDF'}
                    </button>
                  )}
                  {/* Botón designar representante JV — movido a sección Votaciones */}
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate(`/meetings/${id}/attendance/register`)}
                  >
                    {t('registerAttendance')}
                  </button>
                </div>
              </div>
              {attendance.length === 0 ? (
                <p className="empty">{language === 'es' ? 'No hay registros de asistencia' : 'No attendance records'}</p>
              ) : (
                <div className="attendance-list">
                  {attendance.map((item) => (
                    <div key={item.id} className="attendance-item">
                      <div className="member-info">
                        <strong>{displayNameWithAccents(item.member_name) || item.member_name}</strong>
                        <span className="role">{displayNameWithAccents(item.role) || item.role || '-'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        {item.pending_approval ? (
                          <span className="attendance-status status-pending">
                            {language === 'es' ? '⌛ Pendiente de validación' : '⌛ Pending validation'}
                          </span>
                        ) : (
                          <span className={`attendance-status status-${item.status}`}>
                            {item.status === 'present'
                              ? (language === 'es' ? '✓ Presente' : '✓ Present')
                              : item.status === 'rejected'
                              ? (language === 'es' ? '✗ Rechazado' : '✗ Rejected')
                              : item.status}
                          </span>
                        )}

                        {item.pending_approval && isAdminForApproval && (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApproveAttendance(item.id)}
                            >
                              {language === 'es' ? 'Aprobar' : 'Approve'}
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRejectAttendance(item.id)}
                            >
                              {language === 'es' ? 'Rechazar' : 'Reject'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'votings' && (
            <div className="votings-section">
              <div className="section-header">
                <h2>{t('votings')}</h2>

                {/* ── Barra de flujo: Instalar sesión → Nueva Votación ── */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>

                  {/* Paso 1: Instalar Sesión */}
                  {meeting?.session_installed ? (
                    /* Estado: sesión ya instalada */
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        background: 'rgba(34,197,94,0.12)',
                        color: '#16a34a',
                        border: '2px solid rgba(34,197,94,0.4)',
                        fontWeight: 700,
                        fontSize: '15px'
                      }}
                    >
                      ✅ {language === 'es' ? 'Sesión Instalada' : 'Session Installed'}
                    </span>
                  ) : canAuthorizedLive ? (
                    /* Botón prominente para instalar */
                    <button
                      onClick={handleInstallSession}
                      disabled={!(quorum?.met)}
                      title={
                        quorum?.met
                          ? (language === 'es' ? 'Instalar la sesión para habilitar votaciones' : 'Install session to enable votings')
                          : (language === 'es' ? 'Requiere quórum alcanzado antes de instalar sesión' : 'Quorum must be reached before installing session')
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        fontSize: '15px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: quorum?.met ? 'pointer' : 'not-allowed',
                        background: quorum?.met ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'rgba(100,100,100,0.2)',
                        color: quorum?.met ? '#fff' : 'var(--text-secondary)',
                        opacity: quorum?.met ? 1 : 0.65,
                        boxShadow: quorum?.met ? '0 2px 10px rgba(22,163,74,0.35)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      🔓 {language === 'es' ? 'Instalar Sesión' : 'Install Session'}
                      {!quorum?.met && (
                        <span style={{ fontSize: '12px', fontWeight: 400, opacity: 0.85 }}>
                          ({language === 'es' ? 'sin quórum' : 'no quorum'})
                        </span>
                      )}
                    </button>
                  ) : (
                    /* Observador: solo muestra estado */
                    <span
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        background: 'rgba(245,158,11,0.12)',
                        color: 'var(--warning)',
                        border: '1px solid rgba(245,158,11,0.35)',
                        fontSize: '14px'
                      }}
                    >
                      ⚠️ {language === 'es' ? 'Sesión no instalada' : 'Session not installed'}
                    </span>
                  )}

                  {/* Separador visual */}
                  {(meeting?.session_installed || !canAuthorizedLive) && canAdminPrep && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>→</span>
                  )}

                  {/* Paso 2: Nueva Votación — solo habilitado si sesión está instalada */}
                  {canAdminPrep && (
                    <button
                      className={meeting?.session_installed ? 'btn btn-primary' : 'btn btn-secondary'}
                      onClick={() => {
                        if (!meeting?.session_installed) return;
                        navigate(`/meetings/${meetingId || id}/votings/new`);
                      }}
                      disabled={!meeting?.session_installed}
                      title={
                        meeting?.session_installed
                          ? (language === 'es' ? 'Crear nueva votación' : 'Create new voting')
                          : (language === 'es' ? 'Debes instalar la sesión primero' : 'You must install the session first')
                      }
                      style={!meeting?.session_installed ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                    >
                      {t('newVoting')}
                    </button>
                  )}

                  {/* Botón Designar Rep. JV — solo para votaciones, no afecta quórum */}
                  {canAuthorizedLive && attendance.some(a =>
                    (String(a.role || '').toUpperCase().includes('VIGILANCIA') ||
                     String(a.role || '').toUpperCase().includes('JV')) && a.status === 'present'
                  ) && (
                    <>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>|</span>
                      <button
                        className="btn"
                        onClick={() => setShowJvModal(true)}
                        style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.4)', fontWeight: 600, fontSize: '13px' }}
                        title={language === 'es' ? 'Define quién emite el voto institucional de JV en cada votación' : 'Define who casts the JV institutional vote'}
                      >
                        ⚖️ {jvRepresentative
                          ? (language === 'es' ? `Voto JV: ${jvRepresentative.member_name || ''}` : `JV Vote: ${jvRepresentative.member_name || ''}`)
                          : (language === 'es' ? 'Designar voto JV' : 'Designate JV vote')}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {votings.length === 0 ? (
                <p className="empty">{language === 'es' ? 'No hay votaciones registradas' : 'No votings registered'}</p>
              ) : (
                <div className="votings-list">
                  {votings.map((voting) => {
                    const voteLink = `${window.location.origin}/public/meeting/${meetingIdParam}/vote`;
                    const statusLabel = voting.status === 'pending'
                      ? (language === 'es' ? 'Pendiente' : 'Pending')
                      : voting.status === 'active'
                      ? (language === 'es' ? 'Activa' : 'Active')
                      : voting.status === 'completed' || voting.status === 'closed'
                      ? (language === 'es' ? 'Cerrada' : 'Closed')
                      : voting.status;

                    return (
                      <div key={voting.id} className="voting-card">
                        <div className="voting-header">
                          <h3>{voting.title}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`voting-status status-${voting.status}`}>{statusLabel}</span>
                            {/* VOT-LINK-RECOVERY: copiar enlace disponible siempre en cada tarjeta */}
                            {(voting.status === 'pending' || voting.status === 'active') && (
                              <button
                                title={language === 'es' ? 'Copiar enlace de votación' : 'Copy voting link'}
                                onClick={() => {
                                  navigator.clipboard.writeText(voteLink);
                                  setErrorMessage(null);
                                }}
                                style={{
                                  background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                                  padding: '4px 8px', cursor: 'pointer', fontSize: '14px', color: 'var(--text-secondary)'
                                }}
                              >
                                📋
                              </button>
                            )}
                          </div>
                        </div>
                        {voting.description && <p>{voting.description}</p>}
                        <div className="voting-actions">
                          {voting.status === 'pending' && canAuthorizedLive && (
                            <button className="btn btn-primary" onClick={() => handleActivateVoting(voting.id)}>
                              {t('activate')}
                            </button>
                          )}
                          {voting.status === 'active' && (
                            <>
                              <button
                                className="btn btn-secondary"
                                onClick={() => navigate(`/meetings/${id}/voting/${voting.id}`)}
                              >
                                {language === 'es' ? 'Ver Votación' : 'View Voting'}
                              </button>
                              {/* VOT-CERRAR: botón rojo para cerrar votación activa */}
                              {canAuthorizedLive && (
                                <button
                                  className="btn"
                                  onClick={() => handleCloseVoting(voting.id)}
                                  style={{
                                    background: 'rgba(220,38,38,0.1)', color: '#dc2626',
                                    border: '1px solid rgba(220,38,38,0.4)', fontWeight: 700
                                  }}
                                >
                                  {language === 'es' ? '🔒 Cerrar Votación' : '🔒 Close Voting'}
                                </button>
                              )}
                            </>
                          )}
                          <button
                            className="btn btn-secondary"
                            onClick={() => navigate(`/meetings/${id}/voting/${voting.id}/results`)}
                          >
                            {t('viewResults')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Modal designar representante JV */}
    {showJvModal && (
      <JvRepresentativeModal
        attendance={attendance}
        language={language}
        selectedId={jvRepresentativeId}
        setSelectedId={setJvRepresentativeId}
        onClose={() => setShowJvModal(false)}
        onConfirm={handleSetJvRepresentative}
      />
    )}
    </>
  );
};

// Modal separado para designar representante JV
function JvRepresentativeModal({ attendance, onConfirm, onClose, language, selectedId, setSelectedId }) {
  const jvMembers = attendance.filter(a =>
    (String(a.role || '').toUpperCase().includes('VIGILANCIA') ||
     String(a.role || '').toUpperCase().includes('JV')) && a.status === 'present' && a.member_id
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: 'var(--surface, #1e293b)', border: '1px solid rgba(167,139,250,0.4)',
        borderRadius: '14px', padding: '28px', maxWidth: '440px', width: '90%'
      }}>
        <h3 style={{ color: '#a78bfa', margin: '0 0 8px' }}>⚖️ {language === 'es' ? 'Designar Representante JV' : 'Designate JV Representative'}</h3>
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 18px', lineHeight: 1.6 }}>
          {language === 'es'
            ? 'El Presidente de la Junta de Vigilancia no está presente. Selecciona el miembro que emitirá el voto institucional en esta sesión:'
            : 'The JV President is not present. Select the member who will cast the institutional vote:'}
        </p>
        {jvMembers.length === 0 ? (
          <p style={{ color: '#ef4444', fontSize: '13px' }}>
            {language === 'es' ? 'No hay miembros JV presentes.' : 'No JV members are present.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {jvMembers.map(m => (
              <label key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                background: selectedId === String(m.member_id) ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
                border: selectedId === String(m.member_id) ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', cursor: 'pointer'
              }}>
                <input
                  type="radio"
                  name="jvRep"
                  value={String(m.member_id)}
                  checked={selectedId === String(m.member_id)}
                  onChange={e => setSelectedId(e.target.value)}
                />
                <span style={{ fontWeight: 600 }}>{m.member_name}</span>
                <span style={{ color: '#94a3b8', fontSize: '12px' }}>{m.role}</span>
              </label>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={!selectedId}
            style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
          >
            {language === 'es' ? 'Designar representante' : 'Designate representative'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MeetingDetail;

