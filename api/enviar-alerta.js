// api/enviar-alerta.js
export default async function handler(req, res) {
  // Permitir que tu web se comunique con este servidor
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { tokens, titulo, mensaje } = req.body;

    if (!tokens || tokens.length === 0) {
      return res.status(400).json({ error: 'Faltan los tokens de los dispositivos' });
    }

    // Recuperamos las llaves maestras que guardaste en Vercel
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    // Usamos la API oficial de Google para conseguir un Token de acceso temporal
    const accessToken = await getGoogleAccessToken(serviceAccount);

    // Enviamos la notificación a cada dispositivo de la lista
    const copiaTokens = [...tokens];
    const promesas = copiaTokens.map(token => {
      return fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            token: token,
            notification: { title: titulo, body: mensaje },
            webpush: {
              notification: {
                icon: '/icon.png', // Puedes subir un ícono a tu GitHub si quieres
                badge: '/icon.png'
              }
            }
          }
        })
      });
    });

    await Promise.all(promesas);
    return res.status(200).json({ success: true, mensaje: 'Notificaciones enviadas con éxito' });

  } catch (error) {
    console.error('Error en el servidor:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Función auxiliar para autenticarse con Google sin librerías pesadas
async function getGoogleAccessToken(serviceAccount) {
  const crypto = require('crypto');
  
  const header = { alg: 'RS256', typ: 'JWT' };
  const sHeader = Buffer.from(JSON.stringify(header)).toString('base64url');

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  const sClaim = Buffer.from(JSON.stringify(claim)).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${sHeader}.${sClaim}`);
  const signature = sign.sign(serviceAccount.private_key, 'base64url');

  const jwt = `${sHeader}.${sClaim}.${signature}`;

  const respuesta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  const datos = await respuesta.json();
  if (datos.error) throw new Error(datos.error_description || datos.error);
  return datos.access_token;
}
