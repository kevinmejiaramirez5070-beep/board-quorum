const EmailService = require('../services/emailService');

exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, organization, message } = req.body;

    // Validar campos requeridos
    if (!name || !email || !organization || !message) {
      return res.status(400).json({ 
        message: 'Todos los campos son requeridos' 
      });
    }

    // Enviar email al administrador
    try {
      await EmailService.sendContactEmail({
        name,
        email,
        organization,
        message
      });
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      return res.status(500).json({ 
        message: 'Error al enviar el mensaje. Por favor, intenta más tarde.' 
      });
    }

    // Enviar respuesta automática al usuario
    try {
      await EmailService.sendAutoReply({
        name,
        email
      });
    } catch (autoReplyError) {
      console.error('Error enviando respuesta automática:', autoReplyError);
      // No fallar si la respuesta automática falla, el mensaje principal ya se envió
    }

    res.status(200).json({ 
      message: 'Mensaje enviado correctamente' 
    });
  } catch (error) {
    console.error('Error en sendContactMessage:', error);
    res.status(500).json({ 
      message: 'Error al procesar el mensaje' 
    });
  }
};

