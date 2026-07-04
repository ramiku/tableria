import nodemailer from 'nodemailer';
import type { Env } from '../config.js';

export function createMailer(env: Env) {
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false, // MailHog y la mayoría de relays de dev no usan TLS directo
  });

  return {
    async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
      await transport.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject: 'Recupera tu contraseña de Tableria',
        text: `Alguien solicitó restablecer la contraseña de esta cuenta.\n\nSi has sido tú, abre este enlace (caduca en 1 hora):\n${resetUrl}\n\nSi no has sido tú, puedes ignorar este correo.`,
        html: `<p>Alguien solicitó restablecer la contraseña de esta cuenta.</p><p>Si has sido tú, abre este enlace (caduca en 1 hora):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Si no has sido tú, puedes ignorar este correo.</p>`,
      });
    },
  };
}

export type Mailer = ReturnType<typeof createMailer>;
