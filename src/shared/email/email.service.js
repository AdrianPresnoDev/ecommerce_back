// src/shared/email/email.service.js
import nodemailer from 'nodemailer';

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
