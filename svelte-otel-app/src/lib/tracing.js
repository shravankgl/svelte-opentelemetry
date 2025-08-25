import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { ConsoleSpanExporter, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";
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
      url: 'http://<signoz-endpoint>:4318/v1/traces', // OTLP HTTP endpoint
      headers: {
         'signoz-access-token': '<signoz-access-token>', // Required when sending directly to signoz
       },
    });

    const simpleSpanProcessor = new SimpleSpanProcessor(exporter);
    const consoleSpanProcessor = new SimpleSpanProcessor(new ConsoleSpanExporter());

    const provider = new WebTracerProvider({
        resource: resource,
        spanProcessors: [simpleSpanProcessor, consoleSpanProcessor],
    });

    provider.register();

    registerInstrumentations({
    instrumentations: [
        new FetchInstrumentation(),
    ],
    });

    console.log('OpenTelemetry tracing initialized successfully');
  } catch (error) {
    console.error('Error initializing OpenTelemetry:', error);
  }
}
