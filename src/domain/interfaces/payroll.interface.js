"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationAction = exports.ReconciliationStatus = exports.PayrollStatus = void 0;
var PayrollStatus;
(function (PayrollStatus) {
    PayrollStatus["PENDING"] = "PENDING";
    PayrollStatus["PROCESSING"] = "PROCESSING";
    PayrollStatus["COMPLETED"] = "COMPLETED";
    PayrollStatus["ERROR"] = "ERROR";
    PayrollStatus["CANCELLED"] = "CANCELLED";
})(PayrollStatus || (exports.PayrollStatus = PayrollStatus = {}));
var ReconciliationStatus;
(function (ReconciliationStatus) {
    ReconciliationStatus["MATCHED"] = "MATCHED";
    ReconciliationStatus["DIVERGENT"] = "DIVERGENT";
    ReconciliationStatus["MISSING"] = "MISSING";
    ReconciliationStatus["EXTRA"] = "EXTRA";
})(ReconciliationStatus || (exports.ReconciliationStatus = ReconciliationStatus = {}));
var ReconciliationAction;
(function (ReconciliationAction) {
    ReconciliationAction["NONE"] = "NONE";
    ReconciliationAction["UPDATE"] = "UPDATE";
    ReconciliationAction["SUSPEND"] = "SUSPEND";
    ReconciliationAction["NOTIFY"] = "NOTIFY";
})(ReconciliationAction || (exports.ReconciliationAction = ReconciliationAction = {}));
