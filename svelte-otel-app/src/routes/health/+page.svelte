<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    
    let healthData: any = null;
    let loading = true;
    let error: string | null = null;

    async function checkHealth() {
        if (!browser) return;
        
        loading = true;
        error = null;
        
        try {
            const response = await fetch('/api/v1/health');
            if (response.ok) {
                healthData = await response.json();
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (err) {
            console.error('Health check failed:', err);
            error = err instanceof Error ? err.message : 'Unknown error';
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        checkHealth();
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(checkHealth, 30000);
        
        return () => clearInterval(interval);
    });
</script>

<svelte:head>
    <title>Health Check - Svelte OTEL App</title>
</svelte:head>

<div class="health-check">
    <h1>Application Health Status</h1>
    
    <button on:click={checkHealth} disabled={loading} class="refresh-btn">
        {loading ? 'Checking...' : 'Refresh'}
    </button>
    
    {#if loading && !healthData}
        <div class="status-card loading">
            <p>Checking health status...</p>
        </div>
    {:else if error}
        <div class="status-card error">
            <h2>Status: <span class="unhealthy">Error</span></h2>
            <p class="error-message">{error}</p>
        </div>
    {:else if healthData}
        <div class="status-card healthy">
            <h2>Status: <span class="healthy-text">{healthData.status}</span></h2>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Service:</strong> {healthData.service}
                </div>
                <div class="info-item">
                    <strong>Version:</strong> {healthData.version}
                </div>
                <div class="info-item">
                    <strong>Environment:</strong> {healthData.environment}
                </div>
                <div class="info-item">
                    <strong>Timestamp:</strong> {new Date(healthData.timestamp).toLocaleString()}
                </div>
                <div class="info-item">
                    <strong>Uptime:</strong> {Math.floor(healthData.uptime)}s
                </div>
            </div>
            
            <div class="checks">
                <h3>System Checks:</h3>
                <ul>
                    {#each Object.entries(healthData.checks) as [key, value]}
                        <li><strong>{key}:</strong> {value}</li>
                    {/each}
                </ul>
            </div>
        </div>
    {/if}
    
    <div class="api-info">
        <p><strong>API Endpoint:</strong> <code>/api/health</code></p>
        <p>Direct JSON: <a href="/api/health" target="_blank">/api/health</a></p>
    </div>
</div>

<style>
    .health-check {
        max-width: 800px;
        margin: 2rem auto;
        padding: 2rem;
        font-family: system-ui, -apple-system, sans-serif;
    }

    .refresh-btn {
        background: #0066cc;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        margin-bottom: 1.5rem;
        font-size: 1rem;
        transition: background-color 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
        background: #0052a3;
    }

    .refresh-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
    }

    .status-card {
        border-radius: 8px;
        padding: 2rem;
        margin: 1rem 0;
        border: 2px solid;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .status-card.healthy {
        background: #f0f9ff;
        border-color: #28a745;
    }

    .status-card.loading {
        background: #fff9e6;
        border-color: #ffc107;
    }

    .status-card.error {
        background: #fff5f5;
        border-color: #dc3545;
    }

    .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin: 1.5rem 0;
    }

    .info-item {
        padding: 1rem;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 6px;
        border: 1px solid rgba(0,0,0,0.1);
    }

    .checks {
        margin-top: 1.5rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 6px;
        border: 1px solid rgba(0,0,0,0.1);
    }

    .checks ul {
        margin: 0.5rem 0 0 1rem;
    }

    .checks li {
        margin: 0.25rem 0;
    }

    .healthy-text {
        color: #28a745;
        font-weight: bold;
    }

    .unhealthy {
        color: #dc3545;
        font-weight: bold;
    }

    .error-message {
        color: #dc3545;
        font-weight: bold;
        margin-top: 0.5rem;
    }

    .api-info {
        margin-top: 2rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 6px;
        border: 1px solid #e9ecef;
    }

    .api-info code {
        background: #e9ecef;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
    }

    .api-info a {
        color: #0066cc;
        text-decoration: none;
    }

    .api-info a:hover {
        text-decoration: underline;
    }
</style>