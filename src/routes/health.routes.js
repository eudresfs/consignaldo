"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.healthRoutes = router;
/**
 * Endpoint de Health Check.
 * Retorna um status e o timestamp atual.
 */
router.get('/', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});
