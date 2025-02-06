"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracingService = void 0;
const common_1 = require("@nestjs/common");
const sdk_trace_node_1 = require("@opentelemetry/sdk-trace-node");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
const exporter_jaeger_1 = require("@opentelemetry/exporter-jaeger");
const api_1 = require("@opentelemetry/api");
const instrumentation_express_1 = require("@opentelemetry/instrumentation-express");
const instrumentation_http_1 = require("@opentelemetry/instrumentation-http");
const instrumentation_1 = require("@prisma/instrumentation");
const instrumentation_2 = require("@opentelemetry/instrumentation");
let TracingService = class TracingService {
    onModuleInit() {
        const provider = new sdk_trace_node_1.NodeTracerProvider({
            resource: new resources_1.Resource({
                [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: 'consignaldo',
                environment: process.env.NODE_ENV || 'development',
            }),
        });
        const exporter = new exporter_jaeger_1.JaegerExporter({
            endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
        });
        provider.addSpanProcessor(new sdk_trace_base_1.BatchSpanProcessor(exporter));
        provider.register();
        (0, instrumentation_2.registerInstrumentations)({
            instrumentations: [
                new instrumentation_http_1.HttpInstrumentation(),
                new instrumentation_express_1.ExpressInstrumentation(),
                new instrumentation_1.PrismaInstrumentation(),
            ],
        });
        this.tracer = api_1.trace.getTracer('consignaldo-tracer');
    }
    createSpan(name, fn) {
        return this.tracer.startActiveSpan(name, async (span) => {
            try {
                const result = await fn(span);
                span.setStatus({ code: api_1.SpanStatusCode.OK });
                return result;
            }
            catch (error) {
                span.setStatus({
                    code: api_1.SpanStatusCode.ERROR,
                    message: error.message,
                });
                span.recordException(error);
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    addAttribute(key, value) {
        const span = api_1.trace.getSpan(api_1.context.active());
        if (span) {
            span.setAttribute(key, value);
        }
    }
    addEvent(name, attributes) {
        const span = api_1.trace.getSpan(api_1.context.active());
        if (span) {
            span.addEvent(name, attributes);
        }
    }
};
exports.TracingService = TracingService;
exports.TracingService = TracingService = __decorate([
    (0, common_1.Injectable)()
], TracingService);
