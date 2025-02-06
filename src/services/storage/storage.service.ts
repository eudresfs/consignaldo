import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { createHash } from 'crypto';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { TipoArmazenamento } from '../../domain/documentos/documento.types';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3;
  private readonly localStoragePath: string;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION')
    });

    this.localStoragePath = this.configService.get('LOCAL_STORAGE_PATH');
    this.bucketName = this.configService.get('AWS_S3_BUCKET');
  }

  async salvarArquivo(
    arquivo: Buffer,
    nomeArquivo: string,
    mimeType: string,
    tipoArmazenamento: TipoArmazenamento
  ): Promise<{
    url: string;
    urlTemp?: string;
    hash: string;
    tamanho: number;
  }> {
    const hash = this.gerarHash(arquivo);
    const tamanho = arquivo.length;

    try {
      switch (tipoArmazenamento) {
        case TipoArmazenamento.S3:
          return await this.salvarNoS3(arquivo, nomeArquivo, mimeType, hash);
        case TipoArmazenamento.LOCAL:
          return await this.salvarLocalmente(arquivo, nomeArquivo, hash);
        default:
          throw new Error(`Tipo de armazenamento não suportado: ${tipoArmazenamento}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao salvar arquivo: ${error.message}`, error.stack);
      throw error;
    }
  }

  async excluirArquivo(url: string, tipoArmazenamento: TipoArmazenamento): Promise<void> {
    try {
      switch (tipoArmazenamento) {
        case TipoArmazenamento.S3:
          await this.excluirDoS3(url);
          break;
        case TipoArmazenamento.LOCAL:
          await this.excluirLocalmente(url);
          break;
        default:
          throw new Error(`Tipo de armazenamento não suportado: ${tipoArmazenamento}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao excluir arquivo: ${error.message}`, error.stack);
      throw error;
    }
  }

  async gerarUrlTemporaria(url: string, tipoArmazenamento: TipoArmazenamento, expiracaoSegundos: number = 3600): Promise<string> {
    try {
      switch (tipoArmazenamento) {
        case TipoArmazenamento.S3:
          return await this.gerarUrlTemporariaS3(url, expiracaoSegundos);
        case TipoArmazenamento.LOCAL:
          return url; // Para armazenamento local, retorna a mesma URL
        default:
          throw new Error(`Tipo de armazenamento não suportado: ${tipoArmazenamento}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao gerar URL temporária: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async salvarNoS3(arquivo: Buffer, nomeArquivo: string, mimeType: string, hash: string) {
    const key = `documentos/${hash}/${nomeArquivo}`;
    
    await this.s3.putObject({
      Bucket: this.bucketName,
      Key: key,
      Body: arquivo,
      ContentType: mimeType,
      Metadata: {
        hash
      }
    }).promise();

    const url = `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    const urlTemp = await this.gerarUrlTemporariaS3(url, 3600);

    return {
      url,
      urlTemp,
      hash,
      tamanho: arquivo.length
    };
  }

  private async salvarLocalmente(arquivo: Buffer, nomeArquivo: string, hash: string) {
    const diretorio = join(this.localStoragePath, 'documentos', hash);
    const caminhoCompleto = join(diretorio, nomeArquivo);
    
    await mkdir(diretorio, { recursive: true });

    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(caminhoCompleto);
      
      writeStream.on('finish', () => {
        const url = `/storage/documentos/${hash}/${nomeArquivo}`;
        resolve({
          url,
          hash,
          tamanho: arquivo.length
        });
      });

      writeStream.on('error', (error) => {
        reject(error);
      });

      writeStream.write(arquivo);
      writeStream.end();
    });
  }

  private async excluirDoS3(url: string) {
    const key = url.split('.com/')[1];
    
    await this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: key
    }).promise();
  }

  private async excluirLocalmente(url: string) {
    const caminhoRelativo = url.split('/storage/')[1];
    const caminhoCompleto = join(this.localStoragePath, caminhoRelativo);
    
    await unlink(caminhoCompleto);
  }

  private async gerarUrlTemporariaS3(url: string, expiracaoSegundos: number): Promise<string> {
    const key = url.split('.com/')[1];
    
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucketName,
      Key: key,
      Expires: expiracaoSegundos
    });
  }

  private gerarHash(arquivo: Buffer): string {
    return createHash('sha256').update(arquivo).digest('hex');
  }
}
