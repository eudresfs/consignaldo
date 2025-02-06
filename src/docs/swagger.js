"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API Consignaldo",
            version: "1.0.0",
            description: "Documentação da API Consignaldo"
        },
        servers: [
            { url: "http://localhost:3000" }
        ]
    },
    apis: ["./src/routes/*.ts", "./src/controllers/*.ts"]
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
