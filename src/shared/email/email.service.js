// src/shared/email/email.service.js
import nodemailer from 'nodemailer';
import { sequelize } from '../../interfaces/db/mysql-client.js';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function send({ to, subject, html }) {
  if (process.env.DISABLE_EMAILS === 'true') {
    console.log(`[email] DESACTIVADO — Para: ${to} | Asunto: ${subject}`);
    return;
  }
  const transporter = createTransport();
  await transporter.sendMail({
    from: `"Galería de Arte" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  console.log(`[email] Enviado a ${to}: ${subject}`);
}

// ─── Plantillas ───────────────────────────────────────────────────────────────

/**
 * Notifica a la vendedora que hay una nueva oferta.
 */
export async function sendOfferReceivedEmail({ painting, offer }) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail) return;

  const adminUrl = `${process.env.APP_BASE_URL}/admin`;

  await send({
    to: adminEmail,
    subject: `Nueva oferta para "${painting.title}"`,
    html: `
      <h2>Nueva oferta recibida</h2>
      <p><strong>Cuadro:</strong> ${painting.title} (precio: ${painting.price}€)</p>
      <p><strong>Comprador:</strong> ${offer.buyerName} (${offer.buyerEmail})</p>
      ${offer.buyerPhone ? `<p><strong>Teléfono:</strong> ${offer.buyerPhone}</p>` : ''}
      <p><strong>Precio ofrecido:</strong> <strong>${offer.offeredPrice}€</strong></p>
      ${offer.message ? `<p><strong>Mensaje:</strong> ${offer.message}</p>` : ''}
      <p>
        <a href="${adminUrl}" style="background:#333;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">
          Ver en el panel admin
        </a>
      </p>
    `,
  });
}

/**
 * Notifica al comprador la respuesta a su oferta.
 */
export async function sendOfferResponseEmail({ offer, painting }) {
  const statusMessages = {
    accepted: {
      subject: `¡Tu oferta para "${painting.title}" ha sido aceptada!`,
      body: `
        <h2>¡Enhorabuena! Tu oferta ha sido aceptada</h2>
        <p>Tu oferta de <strong>${offer.offeredPrice}€</strong> para <strong>${painting.title}</strong> ha sido aceptada.</p>
        ${offer.checkoutUrl
          ? `<p><a href="${offer.checkoutUrl}" style="background:#333;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Completar el pago</a></p>`
          : '<p>En breve recibirás el enlace de pago.</p>'
        }
      `,
    },
    rejected: {
      subject: `Sobre tu oferta para "${painting.title}"`,
      body: `
        <h2>Tu oferta no ha sido aceptada</h2>
        <p>Lamentablemente tu oferta de <strong>${offer.offeredPrice}€</strong> para <strong>${painting.title}</strong> no ha sido aceptada.</p>
        ${offer.sellerNote ? `<p><em>${offer.sellerNote}</em></p>` : ''}
        <p>Puedes seguir explorando la galería y hacer nuevas ofertas.</p>
      `,
    },
    countered: {
      subject: `Contraoferta para "${painting.title}"`,
      body: `
        <h2>La vendedora ha realizado una contraoferta</h2>
        <p>Para el cuadro <strong>${painting.title}</strong>, la artista propone <strong>${offer.counterPrice}€</strong> (tu oferta era ${offer.offeredPrice}€).</p>
        ${offer.sellerNote ? `<p><em>${offer.sellerNote}</em></p>` : ''}
        <p>Si te parece bien, puedes contactar directamente respondiendo a este email.</p>
      `,
    },
  };

  const template = statusMessages[offer.status];
  if (!template) return;

  await send({
    to: offer.buyerEmail,
    subject: template.subject,
    html: template.body,
  });
}

// ─── Notificaciones a suscriptores ────────────────────────────────────────────

async function getAllSubscriberEmails() {
  const { Subscriber } = sequelize.models;
  if (!Subscriber) return [];
  const rows = await Subscriber.findAll({ attributes: ['email'] });
  return rows.map(r => r.email);
}

/**
 * Avisa a todos los suscriptores de que se ha añadido una nueva obra.
 */
export async function notifySubscribersNewPainting(painting) {
  const emails = await getAllSubscriberEmails();
  if (!emails.length) return;

  const galleryUrl = `${process.env.APP_BASE_URL || ''}/paintings/${painting.id}`;
  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;">
      <h1 style="font-size:28px;margin-bottom:8px;">Nueva obra disponible</h1>
      <h2 style="font-size:22px;color:#444;font-weight:normal;margin-top:0;">${painting.title}</h2>
      ${painting.category ? `<p style="color:#888;margin:4px 0;">${painting.category}</p>` : ''}
      ${painting.technique ? `<p style="color:#888;margin:4px 0;">${painting.technique}${painting.dimensions ? ` · ${painting.dimensions}` : ''}</p>` : ''}
      <p style="font-size:24px;font-weight:bold;margin:16px 0;">€${Number(painting.price).toLocaleString('es-ES')}</p>
      ${painting.description ? `<p style="color:#555;line-height:1.6;">${painting.description}</p>` : ''}
      <a href="${galleryUrl}" style="display:inline-block;margin-top:20px;background:#000;color:#fff;padding:14px 32px;text-decoration:none;border-radius:999px;font-family:sans-serif;font-weight:600;">
        Ver obra
      </a>
      <hr style="margin:40px 0;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#aaa;font-family:sans-serif;">
        Recibes este email porque te suscribiste a las novedades de Inma Álvarez.
      </p>
    </div>
  `;

  for (const email of emails) {
    await send({ to: email, subject: `Nueva obra: "${painting.title}" | Inma Álvarez`, html }).catch(() => {});
  }
  console.log(`[email] Notificación "nueva obra" enviada a ${emails.length} suscriptores`);
}

/**
 * Avisa a todos los suscriptores de que una obra ha sido vendida.
 */
export async function notifySubscribersPaintingSold(painting) {
  const emails = await getAllSubscriberEmails();
  if (!emails.length) return;

  const galleryUrl = `${process.env.APP_BASE_URL || ''}/`;
  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;">
      <h1 style="font-size:28px;margin-bottom:8px;">Obra vendida</h1>
      <h2 style="font-size:22px;color:#444;font-weight:normal;margin-top:0;">"${painting.title}"</h2>
      <p style="color:#555;line-height:1.6;">
        Esta obra acaba de encontrar su nuevo hogar. Si te gustaba, sigue explorando la galería —
        Inma está preparando nuevas piezas constantemente.
      </p>
      <a href="${galleryUrl}" style="display:inline-block;margin-top:20px;background:#000;color:#fff;padding:14px 32px;text-decoration:none;border-radius:999px;font-family:sans-serif;font-weight:600;">
        Explorar galería
      </a>
      <hr style="margin:40px 0;border:none;border-top:1px solid #eee;" />
      <p style="font-size:12px;color:#aaa;font-family:sans-serif;">
        Recibes este email porque te suscribiste a las novedades de Inma Álvarez.
      </p>
    </div>
  `;

  for (const email of emails) {
    await send({ to: email, subject: `Obra vendida: "${painting.title}" | Inma Álvarez`, html }).catch(() => {});
  }
  console.log(`[email] Notificación "obra vendida" enviada a ${emails.length} suscriptores`);
}

/**
 * Mensaje de contacto general desde el formulario de la web.
 */
export async function sendContactEmail({ name, email, phone, message }) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail) return;

  await send({
    to: adminEmail,
    subject: `Nuevo mensaje de contacto de ${name}`,
    html: `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ''}
      <hr />
      <p><strong>Mensaje:</strong></p>
      <p>${message.replace(/\n/g, '<br />')}</p>
    `,
  });
}

/**
 * Solicitud de obra personalizada.
 */
export async function sendCustomOrderEmail({ name, email, phone, artworkType, dimensions, colorPreferences, budget, description, timeline }) {
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!adminEmail) return;

  await send({
    to: adminEmail,
    subject: `Nueva solicitud de obra personalizada de ${name}`,
    html: `
      <h2>Solicitud de Obra Personalizada</h2>
      <p><strong>Nombre:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ''}
      <hr />
      <h3>Detalles de la obra</h3>
      ${artworkType ? `<p><strong>Tipo de obra:</strong> ${artworkType}</p>` : ''}
      ${dimensions ? `<p><strong>Dimensiones:</strong> ${dimensions}</p>` : ''}
      ${colorPreferences ? `<p><strong>Preferencias de color:</strong> ${colorPreferences}</p>` : ''}
      ${budget ? `<p><strong>Presupuesto:</strong> ${budget}€</p>` : ''}
      ${timeline ? `<p><strong>Fecha límite:</strong> ${timeline}</p>` : ''}
      <p><strong>Descripción / Visión:</strong></p>
      <p>${description.replace(/\n/g, '<br />')}</p>
    `,
  });
}

/**
 * Confirmación de compra completada al comprador.
 */
export async function sendOrderConfirmationEmail({ order, painting }) {
  await send({
    to: order.buyerEmail,
    subject: `¡Compra confirmada! "${painting.title}"`,
    html: `
      <h2>¡Gracias por tu compra!</h2>
      <p>Hola <strong>${order.buyerName}</strong>, tu compra ha sido confirmada.</p>
      <p><strong>Cuadro:</strong> ${painting.title}</p>
      <p><strong>Importe pagado:</strong> ${order.amount}€</p>
      <p>Nos pondremos en contacto contigo para coordinar el envío.</p>
    `,
  });
}
