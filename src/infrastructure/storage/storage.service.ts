import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../logger/logger.service';
import { S3 } from 'aws-sdk';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class StorageService {
  private readonly s3: S3;
  private readonly isS3Enabled: boolean;
  private readonly localStoragePath: string;
  private readonly bucketName: string;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.isS3Enabled = this.config.get('STORAGE_TYPE') === 's3';
    this.localStoragePath = this.config.get('LOCAL_STORAGE_PATH', './storage');
    this.bucketName = this.config.get('AWS_S3_BUCKET');

    if (this.isS3Enabled) {
      this.s3 = new S3({
        accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
        region: this.config.get('AWS_REGION'),
      });
    } else {
      // Cria diretório local se não existir
      mkdirSync(this.localStoragePath, { recursive: true });
    }
  }

  async save(
    path: string,
    content: Buffer,
    contentType: string
  ): Promise<string> {
    try {
      if (this.isS3Enabled) {
        return this.saveToS3(path, content, contentType);
      } else {
        return this.saveToLocal(path, content);
      }
    } catch (error) {
      this.logger.error(
        'Erro ao salvar arquivo',
        error.stack,
        'StorageService',
        { path }
      );
      throw error;
    }
  }

  async get(path: string): Promise<Buffer> {
    try {
      if (this.isS3Enabled) {
        return this.getFromS3(path);
      } else {
        return this.getFromLocal(path);
      }
    } catch (error) {
      this.logger.error(
        'Erro ao ler arquivo',
        error.stack,
        'StorageService',
        { path }
      );
      throw error;
    }
  }

  async delete(path: string): Promise<void> {
    try {
      if (this.isS3Enabled) {
        await this.s3.deleteObject({
          Bucket: this.bucketName,
          Key: path,
        }).promise();
      } else {
        // Implementar deleção local se necessário
      }
    } catch (error) {
      this.logger.error(
        'Erro ao deletar arquivo',
        error.stack,
        'StorageService',
        { path }
      );
      throw error;
    }
  }

  private async saveToS3(
    path: string,
    content: Buffer,
    contentType: string
  ): Promise<string> {
    await this.s3.putObject({
      Bucket: this.bucketName,
      Key: path,
      Body: content,
      ContentType: contentType,
    }).promise();

    return this.getS3Url(path);
  }

  private async saveToLocal(
    path: string,
    content: Buffer
  ): Promise<string> {
    const fullPath = join(this.localStoragePath, path);
    mkdirSync(join(fullPath, '..'), { recursive: true });

    return new Promise((resolve, reject) => {
      const stream = createWriteStream(fullPath);
      stream.on('finish', () => resolve(this.getLocalUrl(path)));
      stream.on('error', reject);
      stream.end(content);
    });
  }

  private async getFromS3(path: string): Promise<Buffer> {
    const response = await this.s3.getObject({
      Bucket: this.bucketName,
      Key: path,
    }).promise();

    return response.Body as Buffer;
  }

  private async getFromLocal(path: string): Promise<Buffer> {
    const fullPath = join(this.localStoragePath, path);
    return require('fs').promises.readFile(fullPath);
  }

  private getS3Url(path: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${path}`;
  }

  private getLocalUrl(path: string): string {
    return `/storage/${path}`;
  }
}
