import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { 
  ATTR_SERVICE_NAME, 
  ATTR_SERVICE_VERSION 
} from '@opentelemetry/semantic-conventions';
import { browser } from '$app/environment';

/** @type {import('@opentelemetry/api-logs').Logger | null} */
let logger = null;

export function initializeLogging() {
  try {
    const resource = defaultResource().merge(
      resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'svelte-otel-tutorial',
        [ATTR_SERVICE_VERSION]: '1.0.0',
      })
    );

    const exporter = new OTLPLogExporter({
      url: 'http://localhost:4318/v1/logs',
      headers: {},
    });

    const processor = new BatchLogRecordProcessor(exporter);

    const loggerProvider = new LoggerProvider({
      resource,
      processors: [processor],
    });


    logger = loggerProvider.getLogger('web-logger', '1.0.0');

    if(browser){

      // Global JavaScript errors
      window.addEventListener('error', (event) => {
        if (logger) {
          logger.emit({
            body: event.message,
            severityNumber: 17, // ERROR
            severityText: 'ERROR',
            attributes: { 
              'error.filename': event.filename,
              'error.lineno': event.lineno,
              'error.colno': event.colno,
              'error.type': 'javascript_error',
              'error.stack': event.error?.stack
            }
          });
        }
      });

      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        if (logger) {
          logger.emit({
            body: event.reason?.message || String(event.reason) || 'Unhandled promise rejection',
            severityNumber: 17, // ERROR
            severityText: 'ERROR',
            attributes: { 
              'error.type': 'unhandled_rejection',
              'error.reason': String(event.reason),
              'error.stack': event.reason?.stack
            }
          });
        }
      });

      // Resource loading errors (images, scripts, etc.)
      window.addEventListener('error', (event) => {
        if (logger && event.target && event.target !== window && event.target instanceof Element) {
          // Try to get src/href if available (for images, scripts, links)
          let source = '';
          if ('src' in event.target && typeof event.target.src === 'string') {
            source = event.target.src;
          } else if ('href' in event.target && typeof event.target.href === 'string') {
            source = event.target.href;
          }
          logger.emit({
            body: `Failed to load resource: ${source}`,
            severityNumber: 17, // ERROR  
            severityText: 'ERROR',
            attributes: {
              'error.type': 'resource_error',
              'error.element': event.target.tagName,
              'error.source': source
            }
          });
        }
      }, true); // Use capture phase for resource errors
    }
    console.log('OpenTelemetry logging initialized');
  } catch (error) {
    console.error('Error initializing OpenTelemetry logging:', error);
  }
}

/**
 * @returns {import('@opentelemetry/api-logs').Logger | null}
 */
export function getLogger() {
  return logger;
}