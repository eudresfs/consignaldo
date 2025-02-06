"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcessoVideo = void 0;
const base_entity_1 = require("./base.entity");
/**
 * Classe que encapsula os dados de um AcessoVideo
 */
class AcessoVideo extends base_entity_1.BaseEntity {
    constructor(id, usuarioId, videoId, data, ip = '', ativo = true) {
        super();
        this.id = id;
        this.usuarioId = usuarioId;
        this.videoId = videoId;
        this.data = data;
        this.ip = ip;
        this.ativo = ativo;
    }
}
exports.AcessoVideo = AcessoVideo;
