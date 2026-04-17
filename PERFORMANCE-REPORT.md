# Alta Moda — Performance & Stress Test Report

> Generated: 2026-04-17 22:25:25
> Server: http://localhost:3000
> Duration per test: 5s | Concurrent connections: 10 | Pipelining: 1

---

## Summary

| # | Scenario | Grade | Avg Latency | P99 Latency | Throughput | Errors | Timeouts |
|---|----------|-------|-------------|-------------|------------|--------|----------|
| 1 | Product Listing (paginated) | **A+** | 87ms | 603ms | 114 req/s | 0 | 0 |
| 2 | Product Listing with Filters | **A+** | 52ms | 287ms | 190 req/s | 0 | 0 |
| 3 | Product Listing (large page) | **A** | 121ms | 624ms | 71 req/s | 0 | 0 |
| 4 | Category Tree | **A+** | 31ms | 104ms | 315 req/s | 0 | 0 |
| 5 | Brand Listing | **A+** | 31ms | 129ms | 305 req/s | 0 | 0 |
| 6 | Product Search Autocomplete | **A+** | 72ms | 2004ms | 138 req/s | 0 | 0 |
| 7 | Full-text Product Search | **A+** | 48ms | 102ms | 206 req/s | 0 | 0 |
| 8 | Newsletter Subscribe (burst) | **F** | 135ms | 1996ms | 73 req/s | 366 | 0 |
| 9 | User Registration (B2C burst) | **F** | 253ms | 1984ms | 22 req/s | 110 | 0 |
| 10 | Homepage Simulation (products + categories + brands) | **A+** | 49ms | 159ms | 202 req/s | 0 | 0 |
| 11 | Rapid Pagination (page surfing) | **A+** | 78ms | 150ms | 111 req/s | 0 | 0 |

### Overall Grade: **F** (CRITICAL)

---

## Detailed Results

### Read-Heavy Endpoints (Public Browsing)

#### Product Listing (paginated) — Grade: **A+**

> GET /api/products — Simulates many users browsing the catalog simultaneously

| Metric | Value |
|--------|-------|
| Total Requests | 568 |
| Avg Throughput | 113.6 req/s |
| Avg Latency | 86.8 ms |
| Min Latency | 40 ms |
| Max Latency | 625 ms |
| P50 Latency | 68 ms |
| P90 Latency | 139 ms |
| P99 Latency | 603 ms |
| Errors (non-2xx) | 0 |
| Timeouts | 0 |
| Data Transferred | 5.21 MB |
| Avg Response Size | 9616 bytes/req |

**Bottleneck Analysis:**
- No significant bottlenecks detected

#### Product Listing with Filters — Grade: **A+**

> GET /api/products with category, brand, price range, and sort filters

| Metric | Value |
|--------|-------|
| Total Requests | 949 |
| Avg Throughput | 189.8 req/s |
| Avg Latency | 52.0 ms |
| Min Latency | 26 ms |
| Max Latency | 344 ms |
| P50 Latency | 46 ms |
| P90 Latency | 58 ms |
| P99 Latency | 287 ms |
| Errors (non-2xx) | 0 |
| Timeouts | 0 |
| Data Transferred | 7.42 MB |
| Avg Response Size | 8197 bytes/req |

**Bottleneck Analysis:**
- No significant bottlenecks detected

#### Product Listing (large page) — Grade: **A**

> GET /api/products with limit=100 — tests large result set serialization

| Metric | Value |
|--------|-------|
| Total Requests | 355 |
| Avg Throughput | 71.0 req/s |
| Avg Latency | 121.3 ms |
| Min Latency | 73 ms |
| Max Latency | 740 ms |
| P50 Latency | 110 ms |
| P90 Latency | 138 ms |
| P99 Latency | 624 ms |
| Errors (non-2xx) | 0 |
| Timeouts | 0 |
| Data Transferred | 24.39 MB |
| Avg Response Size | 72028 bytes/req |

**Bottleneck Analysis:**
- No significant bottlenecks detected

#### Category Tree — Grade: **A+**

> GET /api/categories — Builds recursive tree structure from flat data

| Metric | Value |
|--------|-------|
| Total Requests | 1574 |
| Avg Throughput | 314.8 req/s |
| Avg Latency | 31.2 ms |
| Min Latency | 16 ms |
| Max Latency | 846 ms |
| P50 Latency | 25 ms |
| P90 Latency | 32 ms |
| P99 Latency | 104 ms |
| Errors (non-2xx) | 0 |
| Timeouts | 0 |
| Data Transferred | 22.07 MB |
| Avg Response Size | 14707 bytes/req |

**Bottleneck Analysis:**
- No significant bottlenecks detected

#### Brand Listing — Grade: **A+**

> GET /api/brands — All brands with product lines (includes relation)

| Metric | Value |
|--------|-------|
| Total Requests | 1525 |
| Avg Throughput | 305.0 req/s |
| Avg Latency | 31.0 ms |
| Min Latency | 10 ms |
| Max Latency | 353 ms |
| P50 Latency | 28 ms |
| P90 Latency | 35 ms |
| P99 Latency | 129 ms |
| Errors (non-2xx) | 0 |
| Timeouts | 0 |
| Data Transferred | 25.97 MB |
| Avg Response Size | 17854 bytes/req |

**Bottleneck Analysis:**
- No significant bottlenecks detected

### Search Endpoints

#### Product Search Autocomplete — Grade: **A+**

> GET /api/products/search?q=redken — Autocomplete under concurrent typing

| Metric | Value |
|--------|-------|
| Total Requests | 690 |
| Avg Throughput | 138.0 req/s |
| Avg Latency | 71.7 ms |
| Min Latency | 17 ms |
| Max Latency | 2034 ms |
| P50 Latency | 35 ms |
| P90 Latency | 48 ms |
| P99 Latency | 2004 ms |
| Errors (non-2xx) | 0 |
| Timeouts | 0 |
| Data Transferred | 1.76 MB |
| Avg Response Size | 2671 bytes/req |

**Bottleneck Analysis:**
- P99 latency spike (2004ms vs avg 72ms) — possible connection pool exhaustion or GC pauses

#### Full-text Product Search — Grade: **A+**

> GET /api/products?search=shampoo — Full product search with ILIKE queries

| Metric | Value |
|--------|-------|
| Total Requests | 1030 |
| Avg Throughput | 206.0 req/s |
| Avg Latency | 47.7 ms |
| Min Latency | 18 ms |
| Max Latency | 158 ms |
| P50 Latency | 46 ms |
| P90 Latency | 57 ms |
| P99 Latency | 102 ms |
| Errors (non-2xx) | 0 |
| Timeouts | 0 |
| Data Transferred | 1.06 MB |
| Avg Response Size | 1082 bytes/req |

**Bottleneck Analysis:**
- No significant bottlenecks detected

### Write-Heavy Endpoints

#### Newsletter Subscribe (burst) — Grade: **F**

> POST /api/newsletter — Simulates a marketing campaign driving signups

| Metric | Value |
|--------|-------|
| Total Requests | 367 |
| Avg Throughput | 73.4 req/s |
| Avg Latency | 134.8 ms |
| Min Latency | 59 ms |
| Max Latency | 2706 ms |
| P50 Latency | 73 ms |
| P90 Latency | 119 ms |
| P99 Latency | 1996 ms |
| Errors (non-2xx) | 366 |
| Timeouts | 0 |
| Data Transferred | 0.38 MB |
| Avg Response Size | 1096 bytes/req |

**Bottleneck Analysis:**
- P99 latency spike (1996ms vs avg 135ms) — possible connection pool exhaustion or GC pauses
- Error rate 99.7% — check server logs for 5xx errors or connection limits
- Write P99 1996ms — possible row-level lock contention or slow disk I/O

### Authentication Endpoints

#### User Registration (B2C burst) — Grade: **F**

> POST /api/users — Simulates concurrent user registrations with bcrypt hashing

| Metric | Value |
|--------|-------|
| Total Requests | 111 |
| Avg Throughput | 22.2 req/s |
| Avg Latency | 253.1 ms |
| Min Latency | 61 ms |
| Max Latency | 2057 ms |
| P50 Latency | 75 ms |
| P90 Latency | 404 ms |
| P99 Latency | 1984 ms |
| Errors (non-2xx) | 110 |
| Timeouts | 0 |
| Data Transferred | 0.12 MB |
| Avg Response Size | 1127 bytes/req |

**Bottleneck Analysis:**
- P99 latency spike (1984ms vs avg 253ms) — possible connection pool exhaustion or GC pauses
- Error rate 99.1% — check server logs for 5xx errors or connection limits

### Mixed / Realistic Traffic Patterns

#### Homepage Simulation (products + categories + brands) — Grade: **A+**

> Parallel GET requests to products, categories, and brands (homepage load)

| Metric | Value |
|--------|-------|
| Total Requests | 1008 |
| Avg Throughput | 201.6 req/s |
| Avg Latency | 48.8 ms |
| Min Latency | 13 ms |
| Max Latency | 375 ms |
| P50 Latency | 47 ms |
| P90 Latency | 65 ms |
| P99 Latency | 159 ms |
| Errors (non-2xx) | 0 |
| Timeouts | 0 |
| Data Transferred | 9.54 MB |
| Avg Response Size | 9923 bytes/req |

**Bottleneck Analysis:**
- No significant bottlenecks detected

#### Rapid Pagination (page surfing) — Grade: **A+**

> Simulates users rapidly clicking through product pages

| Metric | Value |
|--------|-------|
| Total Requests | 554 |
| Avg Throughput | 110.8 req/s |
| Avg Latency | 78.0 ms |
| Min Latency | 38 ms |
| Max Latency | 727 ms |
| P50 Latency | 75 ms |
| P90 Latency | 91 ms |
| P99 Latency | 150 ms |
| Errors (non-2xx) | 0 |
| Timeouts | 0 |
| Data Transferred | 5.06 MB |
| Avg Response Size | 9583 bytes/req |

**Bottleneck Analysis:**
- No significant bottlenecks detected

---

## Recommendations & Optimization Opportunities

### 2. Response Caching
- Add in-memory cache (e.g., LRU cache) for category tree and brand listing (changes infrequently)
- Use Next.js `revalidate` for ISR on product listing pages
- Add `Cache-Control` headers for product search autocomplete (short TTL: 30s)
- Consider Redis for shared cache in multi-instance deployments

### 4. Connection Pool Tuning
- Increase Prisma connection pool size in DATABASE_URL: `?connection_limit=20`
- Monitor active connections: `SELECT count(*) FROM pg_stat_activity`
- Use PgBouncer for connection pooling in production

### 5. Error Handling & Resilience
- Add rate limiting (e.g., 100 req/min per IP for write endpoints)
- Implement circuit breakers for database connections
- Add request timeout middleware (e.g., 10s max per request)
- Monitor and alert on error rate > 1%

---

## Test Environment

| Parameter | Value |
|-----------|-------|
| Server URL | http://localhost:3000 |
| Test Duration | 5s per scenario |
| Concurrent Connections | 10 |
| Request Pipelining | 1 |
| Node.js | v22.22.0 |
| Platform | darwin arm64 |
| Date | 2026-04-17 22:25:25 |

---

*Report generated by Alta Moda Stress Test Suite*
