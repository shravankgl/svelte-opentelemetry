#!/usr/bin/env node

const { chromium } = require('playwright');
const { program } = require('commander');

class WebVitalsSimulator {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:5173';
    this.duration = (config.durationMinutes || 120) * 60 * 1000;
    this.pages = config.pages || ['/', '/about', '/sverdle', '/sverdle/how-to-play'];
    this.concurrent = config.concurrent || 1;
    this.headless = config.headless ?? true;
    this.minWait = config.minWait || 1000;
    this.maxWait = config.maxWait || 2000;
    
    // Realistic user agents for better simulation
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
  }

  async startSimulation() {
    console.log(`🚀 Starting Web Vitals Simulation`);
    console.log(`📍 Target: ${this.baseUrl}`);
    console.log(`⏱️  Duration: ${this.duration / 60000} minutes`);
    console.log(`🔗 Pages: ${this.pages.join(', ')}`);
    console.log(`👥 Concurrent sessions: ${this.concurrent}`);
    console.log(`👻 Headless: ${this.headless}`);
    console.log('─'.repeat(50));

    // Health check first
    if (!(await this.healthCheck())) {
      console.error('❌ Health check failed. Please ensure your application is running.');
      process.exit(1);
    }

    const sessions = [];
    for (let i = 0; i < this.concurrent; i++) {
      sessions.push(this.runSession(i));
      // Stagger session starts by 1 second
      if (i < this.concurrent - 1) {
        await this.sleep(1000);
      }
    }

    try {
      await Promise.all(sessions);
      console.log('🎉 All sessions completed successfully!');
    } catch (error) {
      console.error('❌ Simulation failed:', error.message);
    }
  }

  async healthCheck() {
    console.log('🏥 Performing health check...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      for (const pagePath of this.pages) {
        const url = `${this.baseUrl}${pagePath}`;
        const response = await page.goto(url, { timeout: 5000 });
        
        if (response.status() === 200) {
          console.log(`✅ ${url} - OK`);
        } else {
          console.log(`❌ ${url} - Status: ${response.status()}`);
          await browser.close();
          return false;
        }
      }
      
      await browser.close();
      console.log('✅ Health check passed!\n');
      return true;
    } catch (error) {
      console.error(`❌ Health check failed: ${error.message}`);
      await browser.close();
      return false;
    }
  }

  async runSession(sessionId) {
    const browser = await chromium.launch({
      headless: this.headless,
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        `--user-agent=${this.userAgents[sessionId % this.userAgents.length]}`
      ]
    });

    const context = await browser.newContext({
      // Simulate different viewport sizes
      viewport: this.getRandomViewport()
    });

    const page = await context.newPage();
    const startTime = Date.now();
    let visitCount = 0;

    console.log(`🔄 Session ${sessionId} started`);

    try {
      while ((Date.now() - startTime) < this.duration) {
        const randomPage = this.pages[Math.floor(Math.random() * this.pages.length)];
        const url = `${this.baseUrl}${randomPage}`;

        try {
          console.log(`📱 Session ${sessionId}: Visiting ${url}`);
          
          // Navigate to page
          await page.goto(url, { 
            waitUntil: 'networkidle',
            timeout: 10000 
          });

          // Simulate realistic user behavior
          await this.simulateUserBehavior(page);
          
          visitCount++;

          // Random wait between visits
          const waitTime = Math.random() * (this.maxWait - this.minWait) + this.minWait;
          await this.sleep(waitTime);

        } catch (error) {
          console.error(`❌ Session ${sessionId}: Error visiting ${url} - ${error.message}`);
          await this.sleep(2000);
        }
      }

      console.log(`✅ Session ${sessionId} completed - ${visitCount} pages visited`);
      
    } catch (error) {
      console.error(`❌ Session ${sessionId} fatal error:`, error.message);
    } finally {
      await browser.close();
    }
  }

  async simulateUserBehavior(page) {
    try {
      // Wait for page to be ready
      await page.waitForLoadState('domcontentloaded');

      // Simulate reading time
      await this.sleep(Math.random() * 2000 + 1000);

      // Random scroll patterns
      const scrollActions = [
        // Scroll down slowly
        async () => {
          await page.evaluate(async () => {
            const scrollHeight = document.body.scrollHeight;
            const viewportHeight = window.innerHeight;
            const scrollStep = viewportHeight / 3;
            
            for (let i = 0; i < scrollHeight; i += scrollStep) {
              window.scrollTo(0, i);
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          });
        },
        
        // Quick scroll to bottom
        async () => {
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
        },
        
        // Scroll to random position
        async () => {
          await page.evaluate(() => {
            const randomY = Math.random() * document.body.scrollHeight;
            window.scrollTo(0, randomY);
          });
        }
      ];

      // Execute random scroll action
      const randomAction = scrollActions[Math.floor(Math.random() * scrollActions.length)];
      await randomAction();

      // Simulate more reading time after scrolling
      await this.sleep(Math.random() * 1500 + 500);

      // Try to interact with page elements
      await this.simulateClicks(page);

    } catch (error) {
      // Silently handle behavior simulation errors
    }
  }

  async simulateClicks(page) {
    try {
      // Look for interactive elements
      const selectors = ['button', 'a', 'input[type="button"]', '[role="button"]'];
      
      for (const selector of selectors) {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          const randomElement = elements[Math.floor(Math.random() * elements.length)];
          
          // Check if element is visible and clickable
          const isVisible = await randomElement.isVisible();
          const isEnabled = await randomElement.isEnabled();
          
          if (isVisible && isEnabled) {
            await randomElement.click();
            await this.sleep(500);
            break; // Only click one element per visit
          }
        }
      }
    } catch (error) {
      // Ignore click errors
    }
  }

  getRandomViewport() {
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1366, height: 768 },  // Laptop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 667 },   // Mobile
    ];
    
    return viewports[Math.floor(Math.random() * viewports.length)];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI Setup
program
  .version('1.0.0')
  .description('Web Vitals Simulator for SigNoz monitoring')
  .option('-u, --url <url>', 'Base URL', 'http://localhost:5173')
  .option('-d, --duration <minutes>', 'Duration in minutes', '5')
  .option('-c, --concurrent <sessions>', 'Number of concurrent sessions', '1')
  .option('--headless', 'Run browsers in headless mode', true)
  .option('--headed', 'Run browsers with UI (opposite of headless)')
  .option('--min-wait <ms>', 'Minimum wait between pages (ms)', '2000')
  .option('--max-wait <ms>', 'Maximum wait between pages (ms)', '8000')
  .parse();

const options = program.opts();

// Handle headed flag
const headless = options.headed ? false : options.headless;

const config = {
  baseUrl: options.url,
  durationMinutes: parseInt(options.duration),
  concurrent: parseInt(options.concurrent),
  headless,
  minWait: parseInt(options.minWait),
  maxWait: parseInt(options.maxWait)
};

// Create and start simulator
const simulator = new WebVitalsSimulator(config);
simulator.startSimulation().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Simulation interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Simulation terminated');
  process.exit(0);
});