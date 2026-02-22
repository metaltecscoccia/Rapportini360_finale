import { Resend } from 'resend';

// Lazy initialization - Resend viene creato solo quando serve
let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'admin@example.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Rapportini360 <noreply@mail.metaltecscoccia.it>';
const REPLY_TO = 'metaltecscoccia@gmail.com';

interface SignupRequestData {
  organizationName: string;
  adminFullName: string;
  adminUsername: string;
  billingEmail: string;
  vatNumber: string;
  phone: string;
  workField: string;
}

interface ApprovalEmailData {
  organizationName: string;
  adminFullName: string;
  adminUsername: string;
  billingEmail: string;
  temporaryPassword: string;
}

// Notifica al SuperAdmin di una nuova richiesta di registrazione
export async function sendNewSignupRequestEmail(data: SignupRequestData): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('[EMAIL] Resend API key not configured, skipping email');
      console.log('[EMAIL] Would send signup request notification:', data);
      return true;
    }

    const resend = getResend();
    if (!resend) return false;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO,
      to: SUPERADMIN_EMAIL,
      subject: `Nuova richiesta di registrazione: ${data.organizationName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Nuova Richiesta di Registrazione</h2>
          <p>E' stata ricevuta una nuova richiesta di registrazione su Rapportini360.</p>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #334155;">Dati Azienda</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Nome Azienda:</strong></td>
                <td style="padding: 8px 0;">${data.organizationName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Partita IVA:</strong></td>
                <td style="padding: 8px 0;">${data.vatNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Telefono:</strong></td>
                <td style="padding: 8px 0;">${data.phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Settore:</strong></td>
                <td style="padding: 8px 0;">${data.workField || 'Non specificato'}</td>
              </tr>
            </table>

            <h3 style="margin-top: 20px; color: #334155;">Dati Amministratore</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Nome:</strong></td>
                <td style="padding: 8px 0;">${data.adminFullName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Username:</strong></td>
                <td style="padding: 8px 0;">${data.adminUsername}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Email:</strong></td>
                <td style="padding: 8px 0;">${data.billingEmail}</td>
              </tr>
            </table>
          </div>

          <p style="color: #64748b;">
            Per approvare o rifiutare questa richiesta, accedi alla
            <a href="${process.env.APP_URL || 'https://rapportini360.it'}" style="color: #2563eb;">Dashboard SuperAdmin</a>.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">
            Questa email e' stata inviata automaticamente da Rapportini360.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[EMAIL] Error sending signup request email:', error);
      return false;
    }

    console.log(`[EMAIL] Signup request notification sent to ${SUPERADMIN_EMAIL}`);
    return true;
  } catch (err) {
    console.error('[EMAIL] Failed to send signup request email:', err);
    return false;
  }
}

// Email al cliente quando la sua richiesta viene approvata
export async function sendApprovalEmail(data: ApprovalEmailData): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('[EMAIL] Resend API key not configured, skipping email');
      console.log('[EMAIL] Would send approval email:', data);
      return true;
    }

    const resend = getResend();
    if (!resend) return false;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO,
      to: data.billingEmail,
      subject: `Benvenuto su Rapportini360 - Account attivato!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Benvenuto su Rapportini360!</h2>
          <p>Ciao <strong>${data.adminFullName}</strong>,</p>
          <p>Siamo lieti di informarti che la tua richiesta di registrazione per <strong>${data.organizationName}</strong> e' stata approvata.</p>

          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <h3 style="margin-top: 0; color: #166534;">Le tue credenziali di accesso</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Username:</strong></td>
                <td style="padding: 8px 0; font-family: monospace;">${data.adminUsername}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;"><strong>Password temporanea:</strong></td>
                <td style="padding: 8px 0; font-family: monospace; font-weight: bold;">${data.temporaryPassword}</td>
              </tr>
            </table>
          </div>

          <p style="color: #dc2626; font-weight: bold;">
            ⚠️ Al primo accesso ti verra' chiesto di cambiare la password.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://rapportini360.it'}"
               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accedi a Rapportini360
            </a>
          </div>

          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #1e40af;">🎉 Il tuo trial gratuito</h4>
            <p style="margin-bottom: 0;">Hai <strong>30 giorni</strong> per provare tutte le funzionalita' di Rapportini360. Nessun addebito fino alla scadenza del trial.</p>
          </div>

          <p>Se hai domande, non esitare a contattarci rispondendo a questa email.</p>

          <p>Buon lavoro!<br/>Il Team Rapportini360</p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">
            Questa email e' stata inviata a ${data.billingEmail} perche' hai richiesto la registrazione su Rapportini360.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[EMAIL] Error sending approval email:', error);
      return false;
    }

    console.log(`[EMAIL] Approval email sent to ${data.billingEmail}`);
    return true;
  } catch (err) {
    console.error('[EMAIL] Failed to send approval email:', err);
    return false;
  }
}

// Email al cliente quando la sua richiesta viene rifiutata
export async function sendRejectionEmail(email: string, organizationName: string, reason?: string): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('[EMAIL] Resend API key not configured, skipping email');
      return true;
    }

    const resend = getResend();
    if (!resend) return false;

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      replyTo: REPLY_TO,
      to: email,
      subject: `Rapportini360 - Richiesta di registrazione`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Rapportini360</h2>
          <p>Gentile utente,</p>
          <p>Ci dispiace informarti che la tua richiesta di registrazione per <strong>${organizationName}</strong> non e' stata approvata.</p>

          ${reason ? `
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0;"><strong>Motivo:</strong> ${reason}</p>
          </div>
          ` : ''}

          <p>Se ritieni che ci sia stato un errore o desideri maggiori informazioni, contattaci rispondendo a questa email.</p>

          <p>Cordiali saluti,<br/>Il Team Rapportini360</p>
        </div>
      `,
    });

    if (error) {
      console.error('[EMAIL] Error sending rejection email:', error);
      return false;
    }

    console.log(`[EMAIL] Rejection email sent to ${email}`);
    return true;
  } catch (err) {
    console.error('[EMAIL] Failed to send rejection email:', err);
    return false;
  }
}

// Invia email di richiesta informazioni dal form contatti
export async function sendContactFormEmail(data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.log('[EMAIL] Resend non configurato, email contatto non inviata');
    return false;
  }

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 2000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        replyTo: REPLY_TO,
        to: SUPERADMIN_EMAIL,
        subject: `Richiesta informazioni da ${data.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">Nuova Richiesta di Informazioni</h2>
              <p style="margin: 5px 0 0; opacity: 0.9;">Dal form contatti di Rapportini360</p>
            </div>
            <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 120px;">Nome:</td>
                  <td style="padding: 8px 0;">${data.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${data.email}">${data.email}</a></td>
                </tr>
                ${data.phone ? `<tr>
                  <td style="padding: 8px 0; font-weight: bold;">Telefono:</td>
                  <td style="padding: 8px 0;"><a href="tel:${data.phone}">${data.phone}</a></td>
                </tr>` : ''}
              </table>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
              <p style="font-weight: bold; margin-bottom: 8px;">Messaggio:</p>
              <div style="background: #f9fafb; padding: 12px; border-radius: 6px; white-space: pre-wrap;">${data.message}</div>
            </div>
          </div>
        `,
      });

      console.log(`[EMAIL] Contact form email sent from ${data.name} (${data.email}) (Attempt ${attempt})`);
      return true;
    } catch (err) {
      console.error(`[EMAIL] Failed to send contact form email (Attempt ${attempt}/${MAX_RETRIES}):`, err);
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }

  return false;
}

// Genera una password temporanea semplice (2 lettere + 4 cifre, es. "Ak4823")
export function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  for (let i = 0; i < 4; i++) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }

  // Mescola la password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
