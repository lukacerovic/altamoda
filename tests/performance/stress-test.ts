/**
 * Alta Moda — HTTP Stress Test Suite
 *
 * Simulates concurrent users hitting API endpoints to identify bottlenecks.
 * Uses autocannon for HTTP load testing against the running Next.js server.
 *
 * Usage:
 *   1. Start the dev server: npm run dev
 *   2. Run stress tests:     npm run test:stress
 *
 * Results are written to PERFORMANCE-REPORT.md
 */

import autocannon, { Result } from 'autocannon'
import fs from 'fs'
import path from 'path'

// ─── Configuration ──────────────────────────────────────────────────
const BASE_URL = process.env.STRESS_TEST_URL || 'http://localhost:3000'
const DURATION = parseInt(process.env.STRESS_DURATION || '10') // seconds per test
const CONNECTIONS = parseInt(process.env.STRESS_CONNECTIONS || '50') // concurrent connections
const PIPELINING = parseInt(process.env.STRESS_PIPELINING || '1') // requests per connection

interface TestScenario {
  name: string
  category: 'read-heavy' | 'write-heavy' | 'mixed' | 'search' | 'auth'
  description: string
  config: autocannon.Options
}

interface TestResult {
  scenario: TestScenario
  result: Result
  bottlenecks: string[]
  grade: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical'
}

// ─── Test Scenarios ─────────────────────────────────────────────────
const scenarios: TestScenario[] = [
  // ── READ-HEAVY (Public endpoints, no auth) ────────────────────
  {
    name: 'Product Listing (paginated)',
    category: 'read-heavy',
    description: 'GET /api/products — Simulates many users browsing the catalog simultaneously',
    config: {
      url: `${BASE_URL}/api/products?page=1&limit=12`,
      method: 'GET',
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING,
    },
  },
  {
    name: 'Product Listing with Filters',
    category: 'read-heavy',
    description: 'GET /api/products with category, brand, price range, and sort filters',
    config: {
      url: `${BASE_URL}/api/products?sort=price_asc&priceMin=500&priceMax=5000&isNew=true&page=1&limit=12`,
      method: 'GET',
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING,
    },
  },
  {
    name: 'Product Listing (large page)',
    category: 'read-heavy',
    description: 'GET /api/products with limit=100 — tests large result set serialization',
    config: {
      url: `${BASE_URL}/api/products?page=1&limit=100`,
      method: 'GET',
      duration: DURATION,
      connections: Math.min(CONNECTIONS, 30),
      pipelining: PIPELINING,
    },
  },
  {
    name: 'Category Tree',
    category: 'read-heavy',
    description: 'GET /api/categories — Builds recursive tree structure from flat data',
    config: {
      url: `${BASE_URL}/api/categories`,
      method: 'GET',
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING,
    },
  },
  {
    name: 'Brand Listing',
    category: 'read-heavy',
    description: 'GET /api/brands — All brands with product lines (includes relation)',
    config: {
      url: `${BASE_URL}/api/brands`,
      method: 'GET',
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING,
    },
  },

  // ── SEARCH ────────────────────────────────────────────────────
  {
    name: 'Product Search Autocomplete',
    category: 'search',
    description: 'GET /api/products/search?q=redken — Autocomplete under concurrent typing',
    config: {
      url: `${BASE_URL}/api/products/search?q=redken`,
      method: 'GET',
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING,
    },
  },
  {
    name: 'Full-text Product Search',
    category: 'search',
    description: 'GET /api/products?search=shampoo — Full product search with ILIKE queries',
    config: {
      url: `${BASE_URL}/api/products?search=shampoo&page=1&limit=12`,
      method: 'GET',
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING,
    },
  },

  // ── WRITE-HEAVY (Newsletter, no auth needed) ─────────────────
  {
    name: 'Newsletter Subscribe (burst)',
    category: 'write-heavy',
    description: 'POST /api/newsletter — Simulates a marketing campaign driving signups',
    config: {
      url: `${BASE_URL}/api/newsletter`,
      method: 'POST',
      duration: DURATION,
      connections: Math.min(CONNECTIONS, 20),
      pipelining: PIPELINING,
      headers: { 'content-type': 'application/json' },
      // Each request uses a unique email to avoid 409 conflicts
      requests: Array.from({ length: 100 }, (_, i) => ({
        method: 'POST' as const,
        path: '/api/newsletter',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: `stresstest-${Date.now()}-${i}@test.com`,
          segment: i % 2 === 0 ? 'b2c' : 'b2b',
        }),
      })),
    },
  },

  // ── AUTH / REGISTRATION ───────────────────────────────────────
  {
    name: 'User Registration (B2C burst)',
    category: 'auth',
    description: 'POST /api/users — Simulates concurrent user registrations with bcrypt hashing',
    config: {
      url: `${BASE_URL}/api/users`,
      method: 'POST',
      duration: DURATION,
      connections: Math.min(CONNECTIONS, 10), // bcrypt is CPU-bound
      pipelining: PIPELINING,
      headers: { 'content-type': 'application/json' },
      requests: Array.from({ length: 100 }, (_, i) => ({
        method: 'POST' as const,
        path: '/api/users',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: `Stress Test User ${i}`,
          email: `stress-${Date.now()}-${i}@test.com`,
          password: 'testpassword123',
        }),
      })),
    },
  },

  // ── MIXED (Simulates realistic traffic) ───────────────────────
  {
    name: 'Homepage Simulation (products + categories + brands)',
    category: 'mixed',
    description: 'Parallel GET requests to products, categories, and brands (homepage load)',
    config: {
      url: `${BASE_URL}/api/products?page=1&limit=12&isFeatured=true`,
      method: 'GET',
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING,
      requests: [
        { method: 'GET' as const, path: '/api/products?page=1&limit=12&isFeatured=true' },
        { method: 'GET' as const, path: '/api/products?page=1&limit=8&isNew=true' },
        { method: 'GET' as const, path: '/api/products?page=1&limit=8&isBestseller=true' },
        { method: 'GET' as const, path: '/api/categories' },
        { method: 'GET' as const, path: '/api/brands' },
      ],
    },
  },
  {
    name: 'Rapid Pagination (page surfing)',
    category: 'mixed',
    description: 'Simulates users rapidly clicking through product pages',
    config: {
      url: `${BASE_URL}/api/products`,
      method: 'GET',
      duration: DURATION,
      connections: CONNECTIONS,
      pipelining: PIPELINING,
      requests: Array.from({ length: 10 }, (_, i) => ({
        method: 'GET' as const,
        path: `/api/products?page=${i + 1}&limit=12&sort=newest`,
      })),
    },
  },
]

// ─── Analysis Functions ─────────────────────────────────────────────

function gradeResult(result: Result): 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical' {
  const avgLatency = result.latency.average
  const errRate = (result.non2xx || 0) / (result.requests.total || 1)
  const throughput = result.requests.average

  if (errRate > 0.1) return 'critical'
  if (avgLatency > 2000 || errRate > 0.05) return 'poor'
  if (avgLatency > 500 || throughput < 10) return 'acceptable'
  if (avgLatency > 100) return 'good'
  return 'excellent'
}

function identifyBottlenecks(scenario: TestScenario, result: Result): string[] {
  const bottlenecks: string[] = []
  const avgLatency = result.latency.average
  const p99Latency = result.latency.p99
  const errRate = (result.non2xx || 0) / (result.requests.total || 1)

  // High average latency
  if (avgLatency > 500) {
    bottlenecks.push(`High average latency (${avgLatency.toFixed(0)}ms) — likely slow DB queries or missing indexes`)
  }

  // P99 latency spike (tail latency)
  if (p99Latency > avgLatency * 5 && p99Latency > 1000) {
    bottlenecks.push(`P99 latency spike (${p99Latency.toFixed(0)}ms vs avg ${avgLatency.toFixed(0)}ms) — possible connection pool exhaustion or GC pauses`)
  }

  // Error rate
  if (errRate > 0.01) {
    bottlenecks.push(`Error rate ${(errRate * 100).toFixed(1)}% — check server logs for 5xx errors or connection limits`)
  }

  // Timeouts
  if (result.timeouts > 0) {
    bottlenecks.push(`${result.timeouts} request timeouts — server cannot handle load; consider connection pooling or caching`)
  }

  // Low throughput for read endpoints
  if (scenario.category === 'read-heavy' && result.requests.average < 20) {
    bottlenecks.push(`Low throughput (${result.requests.average.toFixed(0)} req/s) for read endpoint — add response caching or DB query optimization`)
  }

  // CPU-bound bottleneck (auth/bcrypt)
  if (scenario.category === 'auth' && avgLatency > 300) {
    bottlenecks.push(`Auth endpoint is CPU-bound (bcrypt hashing at ${avgLatency.toFixed(0)}ms) — expected, but consider reducing bcrypt rounds for dev or using async hashing`)
  }

  // Search performance
  if (scenario.category === 'search' && avgLatency > 200) {
    bottlenecks.push(`Search latency ${avgLatency.toFixed(0)}ms — consider adding PostgreSQL GIN/trigram indexes for ILIKE queries`)
  }

  // Write contention
  if (scenario.category === 'write-heavy' && p99Latency > 500) {
    bottlenecks.push(`Write P99 ${p99Latency.toFixed(0)}ms — possible row-level lock contention or slow disk I/O`)
  }

  if (bottlenecks.length === 0) {
    bottlenecks.push('No significant bottlenecks detected')
  }

  return bottlenecks
}

// ─── Report Generator ───────────────────────────────────────────────

function generateReport(results: TestResult[]): string {
  const now = new Date().toISOString().replace('T', ' ').split('.')[0]
  const gradeEmoji = {
    excellent: 'A+',
    good: 'A',
    acceptable: 'B',
    poor: 'C',
    critical: 'F',
  }

  let report = `# Alta Moda — Performance & Stress Test Report

> Generated: ${now}
> Server: ${BASE_URL}
> Duration per test: ${DURATION}s | Concurrent connections: ${CONNECTIONS} | Pipelining: ${PIPELINING}

---

## Summary

| # | Scenario | Grade | Avg Latency | P99 Latency | Throughput | Errors | Timeouts |
|---|----------|-------|-------------|-------------|------------|--------|----------|
`

  results.forEach((r, i) => {
    const res = r.result
    const errCount = res.non2xx || 0
    report += `| ${i + 1} | ${r.scenario.name} | **${gradeEmoji[r.grade]}** | ${res.latency.average.toFixed(0)}ms | ${res.latency.p99.toFixed(0)}ms | ${res.requests.average.toFixed(0)} req/s | ${errCount} | ${res.timeouts} |\n`
  })

  // Overall grade
  const grades = results.map(r => r.grade)
  const worstGrade = (['critical', 'poor', 'acceptable', 'good', 'excellent'] as const)
    .find(g => grades.includes(g)) || 'excellent'

  report += `\n### Overall Grade: **${gradeEmoji[worstGrade]}** (${worstGrade.toUpperCase()})\n\n`

  // Detailed results by category
  const categories = ['read-heavy', 'search', 'write-heavy', 'auth', 'mixed'] as const
  const categoryTitles: Record<string, string> = {
    'read-heavy': 'Read-Heavy Endpoints (Public Browsing)',
    'search': 'Search Endpoints',
    'write-heavy': 'Write-Heavy Endpoints',
    'auth': 'Authentication Endpoints',
    'mixed': 'Mixed / Realistic Traffic Patterns',
  }

  report += `---\n\n## Detailed Results\n\n`

  for (const cat of categories) {
    const catResults = results.filter(r => r.scenario.category === cat)
    if (catResults.length === 0) continue

    report += `### ${categoryTitles[cat]}\n\n`

    for (const r of catResults) {
      const res = r.result
      const errCount = res.non2xx || 0

      report += `#### ${r.scenario.name} — Grade: **${gradeEmoji[r.grade]}**\n\n`
      report += `> ${r.scenario.description}\n\n`
      report += `| Metric | Value |\n|--------|-------|\n`
      report += `| Total Requests | ${res.requests.total} |\n`
      report += `| Avg Throughput | ${res.requests.average.toFixed(1)} req/s |\n`
      report += `| Avg Latency | ${res.latency.average.toFixed(1)} ms |\n`
      report += `| Min Latency | ${res.latency.min} ms |\n`
      report += `| Max Latency | ${res.latency.max} ms |\n`
      report += `| P50 Latency | ${res.latency.p50.toFixed(0)} ms |\n`
      report += `| P90 Latency | ${res.latency.p90.toFixed(0)} ms |\n`
      report += `| P99 Latency | ${res.latency.p99.toFixed(0)} ms |\n`
      report += `| Errors (non-2xx) | ${errCount} |\n`
      report += `| Timeouts | ${res.timeouts} |\n`
      report += `| Data Transferred | ${(res.throughput.total / 1024 / 1024).toFixed(2)} MB |\n`
      report += `| Avg Response Size | ${res.throughput.average > 0 ? (res.throughput.average / (res.requests.average || 1)).toFixed(0) : 'N/A'} bytes/req |\n\n`

      report += `**Bottleneck Analysis:**\n`
      for (const b of r.bottlenecks) {
        report += `- ${b}\n`
      }
      report += `\n`
    }
  }

  // Recommendations section
  report += `---\n\n## Recommendations & Optimization Opportunities\n\n`

  const allBottlenecks = results.flatMap(r =>
    r.bottlenecks.filter(b => !b.includes('No significant'))
  )

  if (allBottlenecks.length === 0) {
    report += `All endpoints performed within acceptable parameters. No immediate action required.\n\n`
  } else {
    // Group recommendations
    const dbBottlenecks = allBottlenecks.filter(b => b.includes('DB') || b.includes('index') || b.includes('query'))
    const cacheBottlenecks = allBottlenecks.filter(b => b.includes('cach'))
    const cpuBottlenecks = allBottlenecks.filter(b => b.includes('CPU') || b.includes('bcrypt'))
    const connectionBottlenecks = allBottlenecks.filter(b => b.includes('connection') || b.includes('pool'))
    const errorBottlenecks = allBottlenecks.filter(b => b.includes('Error rate') || b.includes('timeout'))

    if (dbBottlenecks.length > 0) {
      report += `### 1. Database Query Optimization\n`
      report += `- Add PostgreSQL indexes on frequently filtered columns (isProfessional, isActive, categoryId, brandId)\n`
      report += `- Add GIN/trigram index for ILIKE search: \`CREATE INDEX idx_product_name_trgm ON "Product" USING gin (\"nameLat\" gin_trgm_ops)\`\n`
      report += `- Consider materialized views for complex aggregations (ratings, review counts)\n`
      report += `- Use \`SELECT\` only needed columns instead of full row fetches\n\n`
    }

    if (cacheBottlenecks.length > 0 || results.some(r => r.scenario.category === 'read-heavy' && r.grade !== 'excellent')) {
      report += `### 2. Response Caching\n`
      report += `- Add in-memory cache (e.g., LRU cache) for category tree and brand listing (changes infrequently)\n`
      report += `- Use Next.js \`revalidate\` for ISR on product listing pages\n`
      report += `- Add \`Cache-Control\` headers for product search autocomplete (short TTL: 30s)\n`
      report += `- Consider Redis for shared cache in multi-instance deployments\n\n`
    }

    if (cpuBottlenecks.length > 0) {
      report += `### 3. CPU-Bound Operations\n`
      report += `- bcrypt hashing is intentionally slow (security). Current rounds: 12\n`
      report += `- For high-traffic registration bursts, consider a queue-based approach\n`
      report += `- Rate-limit registration endpoints to prevent abuse\n\n`
    }

    if (connectionBottlenecks.length > 0) {
      report += `### 4. Connection Pool Tuning\n`
      report += `- Increase Prisma connection pool size in DATABASE_URL: \`?connection_limit=20\`\n`
      report += `- Monitor active connections: \`SELECT count(*) FROM pg_stat_activity\`\n`
      report += `- Use PgBouncer for connection pooling in production\n\n`
    }

    if (errorBottlenecks.length > 0) {
      report += `### 5. Error Handling & Resilience\n`
      report += `- Add rate limiting (e.g., 100 req/min per IP for write endpoints)\n`
      report += `- Implement circuit breakers for database connections\n`
      report += `- Add request timeout middleware (e.g., 10s max per request)\n`
      report += `- Monitor and alert on error rate > 1%\n\n`
    }
  }

  // Environment info
  report += `---\n\n## Test Environment\n\n`
  report += `| Parameter | Value |\n|-----------|-------|\n`
  report += `| Server URL | ${BASE_URL} |\n`
  report += `| Test Duration | ${DURATION}s per scenario |\n`
  report += `| Concurrent Connections | ${CONNECTIONS} |\n`
  report += `| Request Pipelining | ${PIPELINING} |\n`
  report += `| Node.js | ${process.version} |\n`
  report += `| Platform | ${process.platform} ${process.arch} |\n`
  report += `| Date | ${now} |\n\n`

  report += `---\n\n*Report generated by Alta Moda Stress Test Suite*\n`

  return report
}

// ─── Runner ─────────────────────────────────────────────────────────

async function runScenario(scenario: TestScenario): Promise<TestResult> {
  console.log(`\n  Running: ${scenario.name} (${scenario.category})...`)

  const result = await autocannon(scenario.config)
  const grade = gradeResult(result)
  const bottlenecks = identifyBottlenecks(scenario, result)

  const icon = { excellent: '+', good: '+', acceptable: '~', poor: '!', critical: 'X' }
  console.log(`  ${icon[grade]} ${scenario.name}: ${result.latency.average.toFixed(0)}ms avg, ${result.requests.average.toFixed(0)} req/s [${grade.toUpperCase()}]`)

  return { scenario, result, bottlenecks, grade }
}

async function checkServer(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/products?limit=1`)
    return response.ok
  } catch {
    return false
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('  Alta Moda — Stress Test Suite')
  console.log('='.repeat(60))
  console.log(`  Target: ${BASE_URL}`)
  console.log(`  Duration: ${DURATION}s per scenario | Connections: ${CONNECTIONS}`)
  console.log('')

  // Check server is running
  console.log('  Checking server availability...')
  const serverUp = await checkServer()
  if (!serverUp) {
    console.error('\n  ERROR: Server is not responding at ' + BASE_URL)
    console.error('  Please start the dev server first: npm run dev\n')
    process.exit(1)
  }
  console.log('  Server is up!\n')

  // Run all scenarios sequentially (to avoid interfering with each other)
  const results: TestResult[] = []
  for (const scenario of scenarios) {
    const result = await runScenario(scenario)
    results.push(result)
  }

  // Generate report
  console.log('\n' + '='.repeat(60))
  console.log('  Generating performance report...')

  const report = generateReport(results)
  const reportPath = path.join(process.cwd(), 'PERFORMANCE-REPORT.md')
  fs.writeFileSync(reportPath, report, 'utf-8')

  console.log(`  Report saved to: PERFORMANCE-REPORT.md`)

  // Print summary
  console.log('\n  SUMMARY:')
  const gradeCount = { excellent: 0, good: 0, acceptable: 0, poor: 0, critical: 0 }
  for (const r of results) {
    gradeCount[r.grade]++
  }
  console.log(`    Excellent: ${gradeCount.excellent} | Good: ${gradeCount.good} | Acceptable: ${gradeCount.acceptable} | Poor: ${gradeCount.poor} | Critical: ${gradeCount.critical}`)
  console.log('='.repeat(60))

  // Exit with error code if any critical
  if (gradeCount.critical > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Stress test failed:', err)
  process.exit(1)
})
