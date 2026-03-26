// server.js - Backend con Express y Twilio para enviar SMS reales
import express from 'express';
import cors from 'cors';
import twilio from 'twilio';
import dotenv from 'dotenv';

// Cargar variables de entorno desde .env (recomendado para seguridad)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Twilio (obtén tus credenciales desde https://www.twilio.com/console)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER; // número comprado en Twilio

let twilioClient = null;
if (accountSid && authToken && twilioPhone) {
  twilioClient = twilio(accountSid, authToken);
  console.log('✅ Twilio configurado correctamente');
} else {
  console.warn('⚠️ Twilio no está configurado. Las solicitudes /send devolverán error.');
}

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Kiubo! API funcionando 🚀' });
});

// Endpoint para enviar SMS con Twilio
app.post('/send', async (req, res) => {
  const { phone, message = 'Kiubo! 👋' } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Número de teléfono requerido' });
  }

  if (!twilioClient) {
    return res.status(503).json({ 
      error: 'Servicio de SMS no disponible. Configura Twilio en el servidor.' 
    });
  }

  try {
    const smsResponse = await twilioClient.messages.create({
      body: message,
      from: twilioPhone,
      to: phone
    });

    console.log(`SMS enviado a ${phone} | SID: ${smsResponse.sid}`);
    res.json({ 
      success: true, 
      message: `Kiubo! enviado a ${phone}`,
      sid: smsResponse.sid
    });
  } catch (error) {
    console.error('Error al enviar SMS:', error);
    res.status(500).json({ 
      error: 'Error al enviar el mensaje', 
      details: error.message 
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🔥 Servidor Kiubo! corriendo en http://localhost:${PORT}`);
});