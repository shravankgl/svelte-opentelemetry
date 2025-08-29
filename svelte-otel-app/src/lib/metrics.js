import { MeterProvider} from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals';
import { browser } from '$app/environment';
import { 
  ATTR_SERVICE_NAME, 
  ATTR_SERVICE_VERSION 
} from '@opentelemetry/semantic-conventions';

let meterProvider = null;
/** @type {import('@opentelemetry/api').Meter | null} */
let webVitalsMeter = null;

export function initializeMetrics() {
// if (!browser) {
//     console.log('Skipping metrics initialization on server');
//     return;
//   }
  console.log('Initializing OpenTelemetry Metrics...');

  try {
    // Create resource for metrics (same as traces)
    const resource = defaultResource().merge(
      resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'svelte-otel-tutorial',
        [ATTR_SERVICE_VERSION]: '1.0.0',
      })
    );

    // Configure OTLP metrics exporter
    const metricExporter = new OTLPMetricExporter({
      url: 'http://localhost:4318/v1/metrics', // OTLP HTTP endpoint for metrics
      headers: {},
    });

    // Create periodic metric reader
    const metricReader = new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 10000, // Export every 10 seconds
    });

    // Initialize meter provider
    meterProvider = new MeterProvider({
      resource,
      readers: [metricReader],
    });

    // Create meter for web vitals
    webVitalsMeter = meterProvider.getMeter('web-vitals', '1.0.0');

    // Initialize web vitals collection
    setupWebVitals();
    
    // Initialize custom metrics
    setupCustomMetrics();

    console.log('OpenTelemetry Metrics initialized successfully');
  } catch (error) {
    console.error('Error initializing OpenTelemetry Metrics:', error);
  }
}

function setupWebVitals() {
  if (!webVitalsMeter || !browser) {
    console.warn('Web vitals meter not initialized');
    return;
  }

  // Create histograms for Core Web Vitals
  const lcpHistogram = webVitalsMeter.createHistogram('web_vitals_lcp', {
    description: 'Largest Contentful Paint in milliseconds',
    unit: 'ms',
  });

  const clsGauge = webVitalsMeter.createGauge('web_vitals_cls', {
    description: 'Cumulative Layout Shift score',
    unit: '1',
  });

  const fcpHistogram = webVitalsMeter.createHistogram('web_vitals_fcp', {
    description: 'First Contentful Paint in milliseconds',
    unit: 'ms',
  });

  const ttfbHistogram = webVitalsMeter.createHistogram('web_vitals_ttfb', {
    description: 'Time to First Byte in milliseconds',
    unit: 'ms',
  });

  const inpHistogram = webVitalsMeter.createHistogram('web_vitals_inp', {
    description: 'Interaction to Next Paint in milliseconds',
    unit: 'ms',
  });

  // Collect Core Web Vitals
  onLCP((metric) => {
    lcpHistogram.record(metric.value, {
      'metric.name': 'lcp',
      'page.url': window.location.href,
      'page.route': window.location.pathname,
      'metric.rating': getRating(metric.value, [2500, 4000])
    });
    console.log('LCP:', metric.value);
  });

  onCLS((metric) => {
    clsGauge.record(metric.value, {
      'metric.name': 'cls',
      'page.url': window.location.href, 
      'page.route': window.location.pathname,
      'metric.rating': getRating(metric.value, [0.1, 0.25])
    });
    console.log('CLS:', metric.value);
  });

  onFCP((metric) => {
    fcpHistogram.record(metric.value, {
      'metric.name': 'fcp',
      'page.url': window.location.href,
      'page.route': window.location.pathname,
      'metric.rating': getRating(metric.value, [1800, 3000])
    });
    console.log('FCP:', metric.value);
  });

  onTTFB((metric) => {
    ttfbHistogram.record(metric.value, {
      'metric.name': 'ttfb',
      'page.url': window.location.href,
      'page.route': window.location.pathname,
      'metric.rating': getRating(metric.value, [800, 1800])
    });
    console.log('TTFB:', metric.value);
  });

  onINP((metric) => {
    inpHistogram.record(metric.value, {
      'metric.name': 'inp',
      'page.url': window.location.href,
      'page.route': window.location.pathname,
      'metric.rating': getRating(metric.value, [200, 500])
    });
    console.log('INP:', metric.value);
  });
}

function setupCustomMetrics() {
    if (!webVitalsMeter) {
        console.warn('Web vitals meter not initialized');
        return;
    }
  // Create custom business metrics
  const pageViewCounter = webVitalsMeter.createCounter('page_views_total', {
    description: 'Total number of page views',
    unit: '1',
  });

  const userInteractionCounter = webVitalsMeter.createCounter('user_interactions_total', {
    description: 'Total number of user interactions',
    unit: '1',
  });

  const errorCounter = webVitalsMeter.createCounter('frontend_errors_total', {
    description: 'Total number of frontend errors',
    unit: '1',
  });

  if(browser){
  // Track page views
  pageViewCounter.add(1, {
    'page.route': window.location.pathname,
    'page.title': document.title,
    'user.agent': navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
  });

  // Track user interactions
  document.addEventListener('click', (event) => {
    let tag = 'unknown';
    if (event.target instanceof HTMLElement) {
      tag = event.target.tagName.toLowerCase();
    }
    userInteractionCounter.add(1, {
      'interaction.type': 'click',
      'element.tag': tag,
      'page.route': window.location.pathname
    });
  });

  // Track errors
  window.addEventListener('error', (event) => {
    errorCounter.add(1, {
      'error.type': 'javascript',
      'error.message': event.message,
      'page.route': window.location.pathname,
      'error.filename': event.filename
    });
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorCounter.add(1, {
      'error.type': 'promise_rejection',
      'error.message': event.reason?.message || 'Unknown promise rejection',
      'page.route': window.location.pathname
    });
  });
}
}

// Helper function to determine metric rating (good/needs improvement/poor)
/**
 * @param {number} value
 * @param {number[]} thresholds
 * @returns {'good' | 'needs-improvement' | 'poor'}
 */
function getRating(value, thresholds) {
  if (value <= thresholds[0]) return 'good';
  if (value <= thresholds[1]) return 'needs-improvement';
  return 'poor';
}

// Export meter for additional custom metrics
/**
 * Get the current webVitalsMeter instance
 * @returns {import('@opentelemetry/api').Meter | null}
 */
export function getMeter() {
  return webVitalsMeter;
}

// Function to create custom metrics from components
/**
 * Create a custom metric from components
 * @param {string} name
 * @param {'counter'|'histogram'|'gauge'} type
 * @param {string} description
 * @param {string} [unit='1']
 */
export function createCustomMetric(name, type, description, unit = '1') {
  if (!webVitalsMeter) {
    console.warn('Metrics not initialized. Call initializeMetrics() first.');
    return null;
  }
  switch (type) {
    case 'counter':
      return webVitalsMeter.createCounter(name, { description, unit });
    case 'histogram':
      return webVitalsMeter.createHistogram(name, { description, unit });
    case 'gauge':
      return webVitalsMeter.createGauge(name, { description, unit });
    default:
      console.error('Unknown metric type:', type);
      return null;
  }
}