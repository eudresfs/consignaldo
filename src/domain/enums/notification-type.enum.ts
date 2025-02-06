/**
 * Tipos de notificações suportadas pelo sistema
 */
export enum NotificationType {
  EMAIL = 'EMAIL',           // Notificação por e-mail
  SMS = 'SMS',              // Notificação por SMS
  PUSH = 'PUSH',            // Notificação push (web/mobile)
  WHATSAPP = 'WHATSAPP',    // Notificação via WhatsApp
  WEBHOOK = 'WEBHOOK',      // Webhook para integrações
}
