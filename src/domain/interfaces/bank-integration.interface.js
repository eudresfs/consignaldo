"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookEvent = exports.DocumentType = exports.ContractStatus = exports.ProposalStatus = void 0;
var ProposalStatus;
(function (ProposalStatus) {
    ProposalStatus["PENDING"] = "PENDING";
    ProposalStatus["APPROVED"] = "APPROVED";
    ProposalStatus["REJECTED"] = "REJECTED";
    ProposalStatus["CANCELLED"] = "CANCELLED";
})(ProposalStatus || (exports.ProposalStatus = ProposalStatus = {}));
var ContractStatus;
(function (ContractStatus) {
    ContractStatus["ACTIVE"] = "ACTIVE";
    ContractStatus["CANCELLED"] = "CANCELLED";
    ContractStatus["FINISHED"] = "FINISHED";
    ContractStatus["PORTABILITY"] = "PORTABILITY";
})(ContractStatus || (exports.ContractStatus = ContractStatus = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["CONTRACT"] = "CONTRACT";
    DocumentType["IDENTITY"] = "IDENTITY";
    DocumentType["INCOME_PROOF"] = "INCOME_PROOF";
    DocumentType["ADDRESS_PROOF"] = "ADDRESS_PROOF";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var WebhookEvent;
(function (WebhookEvent) {
    WebhookEvent["PROPOSAL_CREATED"] = "PROPOSAL_CREATED";
    WebhookEvent["PROPOSAL_UPDATED"] = "PROPOSAL_UPDATED";
    WebhookEvent["CONTRACT_CREATED"] = "CONTRACT_CREATED";
    WebhookEvent["CONTRACT_UPDATED"] = "CONTRACT_UPDATED";
})(WebhookEvent || (exports.WebhookEvent = WebhookEvent = {}));
