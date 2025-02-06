"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEntity = void 0;
/**
 * Classe base para todas as entidades.
 */
class BaseEntity {
    constructor() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
}
exports.BaseEntity = BaseEntity;
