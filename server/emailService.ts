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
const FROM_EMAIL = process.env.FROM_EMAIL || 'Rapportini360 <noreply@rapportini360.it>';

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

// Genera una password temporanea sicura
export function generateTemporaryPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const all = uppercase + lowercase + numbers;

  let password = '';
  // Assicura almeno un carattere di ogni tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];

  // Riempi il resto
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Mescola la password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
