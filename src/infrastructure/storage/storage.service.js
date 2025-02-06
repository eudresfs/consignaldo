"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("../logger/logger.service");
const aws_sdk_1 = require("aws-sdk");
const fs_1 = require("fs");
const path_1 = require("path");
let StorageService = class StorageService {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.isS3Enabled = this.config.get('STORAGE_TYPE') === 's3';
        this.localStoragePath = this.config.get('LOCAL_STORAGE_PATH', './storage');
        this.bucketName = this.config.get('AWS_S3_BUCKET');
        if (this.isS3Enabled) {
            this.s3 = new aws_sdk_1.S3({
                accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
                secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
                region: this.config.get('AWS_REGION'),
            });
        }
        else {
            // Cria diretório local se não existir
            (0, fs_1.mkdirSync)(this.localStoragePath, { recursive: true });
        }
    }
    async save(path, content, contentType) {
        try {
            if (this.isS3Enabled) {
                return this.saveToS3(path, content, contentType);
            }
            else {
                return this.saveToLocal(path, content);
            }
        }
        catch (error) {
            this.logger.error('Erro ao salvar arquivo', error.stack, 'StorageService', { path });
            throw error;
        }
    }
    async get(path) {
        try {
            if (this.isS3Enabled) {
                return this.getFromS3(path);
            }
            else {
                return this.getFromLocal(path);
            }
        }
        catch (error) {
            this.logger.error('Erro ao ler arquivo', error.stack, 'StorageService', { path });
            throw error;
        }
    }
    async delete(path) {
        try {
            if (this.isS3Enabled) {
                await this.s3.deleteObject({
                    Bucket: this.bucketName,
                    Key: path,
                }).promise();
            }
            else {
                // Implementar deleção local se necessário
            }
        }
        catch (error) {
            this.logger.error('Erro ao deletar arquivo', error.stack, 'StorageService', { path });
            throw error;
        }
    }
    async saveToS3(path, content, contentType) {
        await this.s3.putObject({
            Bucket: this.bucketName,
            Key: path,
            Body: content,
            ContentType: contentType,
        }).promise();
        return this.getS3Url(path);
    }
    async saveToLocal(path, content) {
        const fullPath = (0, path_1.join)(this.localStoragePath, path);
        (0, fs_1.mkdirSync)((0, path_1.join)(fullPath, '..'), { recursive: true });
        return new Promise((resolve, reject) => {
            const stream = (0, fs_1.createWriteStream)(fullPath);
            stream.on('finish', () => resolve(this.getLocalUrl(path)));
            stream.on('error', reject);
            stream.end(content);
        });
    }
    async getFromS3(path) {
        const response = await this.s3.getObject({
            Bucket: this.bucketName,
            Key: path,
        }).promise();
        return response.Body;
    }
    async getFromLocal(path) {
        const fullPath = (0, path_1.join)(this.localStoragePath, path);
        return require('fs').promises.readFile(fullPath);
    }
    getS3Url(path) {
        return `https://${this.bucketName}.s3.amazonaws.com/${path}`;
    }
    getLocalUrl(path) {
        return `/storage/${path}`;
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        logger_service_1.LoggerService])
], StorageService);
