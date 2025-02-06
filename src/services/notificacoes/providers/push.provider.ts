import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { BaseNotificacaoProvider } from './base.provider';
import { Notificacao, TipoNotificacao } from '../../../domain/notificacoes/notificacoes.types';

@Injectable()
export class PushProvider extends BaseNotificacaoProvider {
  tipo = TipoNotificacao.PUSH;
  private firebaseApp: admin.app.App;

  constructor(private readonly configService: ConfigService) {
    super();
    this.inicializarFirebase();
  }

  /**
   * Inicializa o Firebase Admin SDK
   */
  private inicializarFirebase(): void {
    if (admin.apps.length === 0) {
      const credenciais = this.configService.get<string>('FIREBASE_CREDENTIALS');
      if (!credenciais) {
        throw new Error('Credenciais do Firebase não configuradas');
      }

      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(credenciais))
      });
    }
    this.firebaseApp = admin.apps[0];
  }

  /**
   * Envia uma notificação push
   * @param notificacao Notificação a ser enviada
   */
  async enviar(notificacao: Notificacao): Promise<void> {
    try {
      const conteudo = notificacao.templateId
        ? this.processarTemplate(notificacao.conteudo, notificacao.dados || {})
        : notificacao.conteudo;

      const mensagem: admin.messaging.Message = {
        notification: {
          title: notificacao.titulo,
          body: conteudo
        },
        data: {
          ...notificacao.dados,
          notificacaoId: notificacao.id,
          tipo: notificacao.tipo
        },
        token: notificacao.destinatario // Token FCM do dispositivo
      };

      // Adiciona opções específicas do Android se fornecidas
      if (notificacao.dados?.android) {
        mensagem.android = {
          priority: 'high',
          notification: {
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            channelId: notificacao.dados.android.channelId || 'default',
            ...notificacao.dados.android
          }
        };
      }

      // Adiciona opções específicas do iOS se fornecidas
      if (notificacao.dados?.apns) {
        mensagem.apns = {
          payload: {
            aps: {
              alert: {
                title: notificacao.titulo,
                body: conteudo
              },
              sound: 'default',
              badge: 1,
              ...notificacao.dados.apns
            }
          }
        };
      }

      await admin.messaging().send(mensagem);
      this.registrarSucesso(notificacao);
    } catch (erro) {
      this.registrarErro(notificacao, erro);
      throw erro;
    }
  }

  /**
   * Valida a configuração do provedor de push
   */
  async validarConfiguracao(): Promise<boolean> {
    try {
      // Tenta enviar uma mensagem de teste para um token inválido
      // O Firebase retornará um erro específico se as credenciais estiverem corretas
      const testToken = 'invalid-token';
      try {
        await admin.messaging().send({
          token: testToken,
          notification: {
            title: 'Teste',
            body: 'Teste de configuração'
          }
        });
      } catch (erro) {
        // Se o erro for de token inválido, a configuração está correta
        if (erro.code === 'messaging/invalid-registration-token') {
          return true;
        }
        throw erro;
      }
      return true;
    } catch (erro) {
      this.logger.error('Erro ao validar configuração do Firebase', erro.stack);
      return false;
    }
  }

  /**
   * Envia notificação para múltiplos dispositivos
   * @param tokens Lista de tokens FCM
   * @param notificacao Notificação a ser enviada
   */
  async enviarMultiplos(tokens: string[], notificacao: Notificacao): Promise<admin.messaging.BatchResponse> {
    const conteudo = notificacao.templateId
      ? this.processarTemplate(notificacao.conteudo, notificacao.dados || {})
      : notificacao.conteudo;

    const mensagem: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: notificacao.titulo,
        body: conteudo
      },
      data: {
        ...notificacao.dados,
        notificacaoId: notificacao.id,
        tipo: notificacao.tipo
      }
    };

    return admin.messaging().sendMulticast(mensagem);
  }

  /**
   * Envia notificação para um tópico
   * @param topico Nome do tópico
   * @param notificacao Notificação a ser enviada
   */
  async enviarParaTopico(topico: string, notificacao: Notificacao): Promise<string> {
    const conteudo = notificacao.templateId
      ? this.processarTemplate(notificacao.conteudo, notificacao.dados || {})
      : notificacao.conteudo;

    const mensagem: admin.messaging.Message = {
      topic: topico,
      notification: {
        title: notificacao.titulo,
        body: conteudo
      },
      data: {
        ...notificacao.dados,
        notificacaoId: notificacao.id,
        tipo: notificacao.tipo
      }
    };

    return admin.messaging().send(mensagem);
  }
}
