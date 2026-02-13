import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './ProductsList.css';

const ProductsList = () => {
  const { t, language } = useLanguage();
  const { client } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setError('');
      const response = await api.get('/products');
      const productsData = response.data || [];
      
      // Cargar estadísticas para cada producto
      const productsWithStats = await Promise.all(
        productsData.map(async (product) => {
          try {
            const statsResponse = await api.get(`/products/${product.id}/stats`);
            return { ...product, stats: statsResponse.data };
          } catch (statsError) {
            console.error(`Error loading stats for product ${product.id}:`, statsError);
            return { ...product, stats: { memberCount: 0, meetingCount: 0, activeMeeting: null } };
          }
        })
      );
      
      setProducts(productsWithStats);
    } catch (error) {
      console.error('Error loading products:', error);
      setError(error.response?.data?.message || (language === 'es' ? 'Error al cargar productos' : 'Error loading products'));
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}/meetings`);
  };

  if (loading) {
    return <div className="loading">{t('loading')}</div>;
  }

  return (
    <div className="products-list">
      <div className="container">
        <div className="page-header">
          <div className="header-content">
            <h1>{client?.name || 'Organización'}</h1>
            <p className="page-subtitle">
              {language === 'es' 
                ? 'Selecciona un órgano de gobierno para gestionar sus reuniones'
                : 'Select a governing body to manage its meetings'
              }
            </p>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏛️</div>
            <h2>{language === 'es' ? 'No hay productos configurados' : 'No products configured'}</h2>
            <p>
              {language === 'es' 
                ? 'Contacta al administrador para configurar los órganos de gobierno de tu organización.'
                : 'Contact the administrator to configure your organization\'s governing bodies.'
              }
            </p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div 
                key={product.id} 
                className="product-card"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="product-card-header">
                  <h3>{product.name}</h3>
                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}
                </div>
                <div className="product-card-body">
                  <div className="product-stats">
                    <div className="stat-item">
                      <span className="stat-icon">👥</span>
                      <span className="stat-value">{product.stats?.memberCount || 0}</span>
                      <span className="stat-label">{language === 'es' ? 'Miembros' : 'Members'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">📅</span>
                      <span className="stat-value">{product.stats?.meetingCount || 0}</span>
                      <span className="stat-label">{language === 'es' ? 'Reuniones' : 'Meetings'}</span>
                    </div>
                  </div>
                  {product.stats?.activeMeeting && (
                    <div className="active-meeting-badge">
                      <span className="badge-dot"></span>
                      <span>{language === 'es' ? 'REUNIÓN ACTIVA' : 'ACTIVE MEETING'}</span>
                    </div>
                  )}
                </div>
                <div className="product-card-footer">
                  <button className="btn btn-primary">
                    {language === 'es' ? 'Ver Reuniones' : 'View Meetings'} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsList;
