"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = require("winston");
exports.logger = (0, winston_1.createLogger)({
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
    transports: [
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple())
        }),
        new winston_1.transports.File({
            filename: 'error.log',
            level: 'error',
            format: winston_1.format.json()
        }),
        new winston_1.transports.File({
            filename: 'combined.log',
            format: winston_1.format.json()
        })
    ]
});
