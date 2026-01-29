const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s/g, '') : '';

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.warn('⚠️ SMTP configuration not found. Email service will not work.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
  }

  async sendContactEmail(contactData) {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const { name, email, organization, message } = contactData;
    const contactEmail = process.env.CONTACT_EMAIL || process.env.SMTP_USER;

    const mailOptions = {
      from: `"BOARD QUORUM" <${process.env.SMTP_USER}>`,
      to: contactEmail,
      subject: `Nuevo mensaje de contacto - ${organization}`,
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Organización:</strong> ${organization}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      text: `
        Nuevo mensaje de contacto
        
        Nombre: ${name}
        Email: ${email}
        Organización: ${organization}
        
        Mensaje:
        ${message}
      `
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendAutoReply(contactData) {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const { name, email } = contactData;

    const mailOptions = {
      from: `"BOARD QUORUM" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Gracias por contactarnos - BOARD QUORUM',
      html: `
        <p>Hola ${name},</p>
        
        <p>Gracias por tu interés en BOARD QUORUM.</p>
        
        <p>Hemos recibido tu mensaje correctamente. Muy pronto alguien de nuestro equipo se pondrá en contacto contigo para entender mejor tu situación y mostrarte cómo nuestra plataforma puede ayudarte a optimizar la gestión de tus juntas, asambleas o comités.</p>
        
        <p>Mientras tanto, si necesitas contactarnos directamente, puedes escribirnos a:<br>
        📬 bq@pivotconsulting.com.co</p>
        
        <p>Gracias por confiar en BOARD QUORUM.<br>
        Un sistema hecho para tomar decisiones claras, con respaldo y sin perder tiempo.</p>
      `,
      text: `
        Hola ${name},

        Gracias por tu interés en BOARD QUORUM.

        Hemos recibido tu mensaje correctamente. Muy pronto alguien de nuestro equipo se pondrá en contacto contigo para entender mejor tu situación y mostrarte cómo nuestra plataforma puede ayudarte a optimizar la gestión de tus juntas, asambleas o comités.

        Mientras tanto, si necesitas contactarnos directamente, puedes escribirnos a:
        📬 bq@pivotconsulting.com.co

        Gracias por confiar en BOARD QUORUM.
        Un sistema hecho para tomar decisiones claras, con respaldo y sin perder tiempo.
      `
    };

    await this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();

