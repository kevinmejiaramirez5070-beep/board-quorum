import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { meetingService } from '../../services/meetingService';
import api from '../../services/api';
import './CreateMeeting.css';

const CreateMeeting = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { t, language } = useLanguage();
  const { client } = useAuth();
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(!!productId);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    type: 'junta_directiva',
    product_id: productId ? parseInt(productId) : null,
    status: 'scheduled'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProduct();
      setFormData(prev => ({
        ...prev,
        product_id: parseInt(productId, 10) || null
      }));
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoadingProduct(true);
      const response = await api.get(`/products/${productId}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error loading product:', error);
      alert(language === 'es' ? 'Error al cargar el producto' : 'Error loading product');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        product_id: productId ? parseInt(productId, 10) : (formData.product_id ?? null)
      };
      const response = await meetingService.create(payload);
      console.log('Meeting creation response:', response);
      console.log('Response data:', response.data);
      
      // Extraer el ID correctamente
      let meetingId = null;
      if (response.data) {
        if (typeof response.data === 'object' && response.data.id) {
          meetingId = response.data.id;
        } else if (typeof response.data === 'number') {
          meetingId = response.data;
        } else if (response.data.id !== undefined) {
          meetingId = response.data.id;
        }
      }
      
      if (!meetingId) {
        console.error('No se pudo extraer el ID de la reunión:', response);
        throw new Error('No se recibió el ID de la reunión creada');
      }
      
      console.log('Navegando a reunión con ID:', meetingId);
      // Si venimos de un producto, volver a la lista de reuniones del producto
      if (productId) {
        navigate(`/products/${productId}/meetings`);
      } else {
        navigate(`/meetings/${meetingId}`);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      alert(t('errorCreatingMeeting'));
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return <div className="loading">{t('loading')}</div>;
  }

  return (
    <div className="create-meeting">
      <div className="container">
        <div className="form-header">
          <div>
            <h1>{t('newMeetingTitle')}</h1>
            {product && (
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>
                {language === 'es' 
                  ? `La reunión se crea automáticamente asociada a ${product.name}`
                  : `The meeting is automatically created associated with ${product.name}`
                }
              </p>
            )}
          </div>
          <button 
            onClick={() => productId ? navigate(`/products/${productId}/meetings`) : navigate('/meetings')} 
            className="btn btn-secondary"
          >
            {t('cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="meeting-form">
          <div className="form-group">
            <label className="label">{language === 'es' ? 'Título de la Reunión' : 'Meeting Title'} *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              required
              placeholder={language === 'es' ? 'Ej: Junta Directiva - Enero 2025' : 'Ex: Board Meeting - January 2025'}
            />
          </div>

          <div className="form-group">
            <label className="label">{language === 'es' ? 'Tipo de reunión' : 'Meeting type'} *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="junta_directiva">{t('boardMeeting')}</option>
              <option value="asamblea">{t('assembly')}</option>
              <option value="comite">{t('committee')}</option>
              <option value="consejo">{t('council')}</option>
            </select>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              {language === 'es'
                ? 'Junta Directiva: quórum fijo 7 sobre 12 cargos con voto (regla ASOCOLCI). Asamblea: quórum según total de delegados elegibles.'
                : 'Board meeting: fixed quorum of 7 of 12 voting seats (ASOCOLCI). Assembly: quorum from eligible delegates.'}
            </p>
          </div>

          <div className="form-group">
            <label className="label">{t('date')} *</label>
            <input
              type="datetime-local"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">{t('location')}</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="input"
              placeholder={language === 'es' ? 'Ej: Sala de juntas, Virtual, etc.' : 'Ex: Meeting room, Virtual, etc.'}
            />
          </div>

          <div className="form-group">
            <label className="label">{t('description')}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input textarea"
              rows="5"
              placeholder={language === 'es' ? 'Descripción de la reunión, agenda, temas a tratar...' : 'Meeting description, agenda, topics to discuss...'}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('creating') : t('createMeeting')}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/meetings')}
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMeeting;

