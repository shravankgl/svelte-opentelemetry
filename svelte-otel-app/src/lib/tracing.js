import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { 
  ATTR_SERVICE_NAME, 
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

// Initialize the OpenTelemetry tracer provider
export function initializeTracing() {

  console.log('Initializing OpenTelemetry...');

  try {
    // Create a resource with service information
    const resource = defaultResource().merge(
        resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'svelte-otel-tutorial',
      [ATTR_SERVICE_VERSION]: '1.0.0',
    })
    );

    // Direct OTLP exporter to SigNoz
    const exporter = new OTLPTraceExporter({
      url: 'http://localhost:4318/v1/traces', // OTLP HTTP endpoint
      headers: {}
    });

    const batchSpanProcessor = new BatchSpanProcessor(exporter);

    const provider = new WebTracerProvider({
        resource: resource,
        spanProcessors: [batchSpanProcessor],
    });

    provider.register();

    registerInstrumentations({
    instrumentations: [
        getWebAutoInstrumentations({
          // Configure specific instrumentations
          '@opentelemetry/instrumentation-fetch': {
            // Instrument fetch API calls
            propagateTraceHeaderCorsUrls: [
              /.+/g, // Allow all URLs for demo purposes
            ],
          },
          '@opentelemetry/instrumentation-xml-http-request': {
            // Instrument XMLHttpRequest calls
            propagateTraceHeaderCorsUrls: [
              /.+/g, // Allow all URLs for demo purposes
            ],
          },
          '@opentelemetry/instrumentation-user-interaction': {
            // Instrument user interactions (clicks, etc.)
            eventNames: ['click', 'submit', 'keydown'],
          },
          '@opentelemetry/instrumentation-document-load': {
            enabled: true,
          },
        }),
    ],
    });

    console.log('OpenTelemetry tracing initialized successfully');
  } catch (error) {
    console.error('Error initializing OpenTelemetry:', error);
  }
}
