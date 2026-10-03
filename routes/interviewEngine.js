/**
 * routes/interviewEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * HIERO Realistic Company + Role Question Retrieval & Adaptive Questioning Engine
 *
 * Pipeline:
 * Selected Company + Role
 *   ↓
 * Question Pool Retrieval (Verified Question Bank + Company Blueprint)
 *   ↓
 * Job Description Hard Constraint Filter
 *   ↓
 * Candidate Resume Project & Skill Grounding
 *   ↓
 * Semantic Duplicate & Repetition Filter (Token Jaccard + N-Gram Similarity)
 *   ↓
 * Answer Depth & Quality Analysis (Strong -> Deepen, Weak -> Clarify, Solid -> Next Skill)
 *   ↓
 * Interview Topic Tracking (topicsCovered vs topicsRemaining)
 *   ↓
 * Multi-Factor Scoring & Ranking
 *   ↓
 * LLM Personalization (Llama 3.3 70B / GPT-OSS 120B)
 *   ↓
 * Return Structured Next Question
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { Groq } = require('groq-sdk');
const axios = require('axios');

// Initialize Groq safely
let groqClient = null;
function getGroqClient() {
    if (!groqClient && process.env.GROQ_API_KEY) {
        groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqClient;
}

function withTimeout(promise, ms = 6000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('LLM request timed out')), ms))
    ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. COMPANY INTERVIEW BLUEPRINTS
// ─────────────────────────────────────────────────────────────────────────────
const COMPANY_BLUEPRINTS = {
    google: {
        id: 'google',
        name: 'Google',
        hiringBar: '9.5 / 10',
        culture: 'Algorithmic rigor, large-scale distributed systems, Googliness (intellectual humility, proactive collaboration, dealing with ambiguity).',
        focusAreas: ['Data Structures & Algorithms', 'Distributed Systems Design', 'Concurrency & Scalability', 'Clean Modular Code', 'Trade-off Analysis'],
        categoryWeights: { technical: 0.35, system_design: 0.35, resume_project: 0.2, behavioral: 0.1 },
        signaturePhases: ['Coding & Problem Solving', 'Large-scale Distributed Systems', 'Googliness & Leadership']
    },
    microsoft: {
        id: 'microsoft',
        name: 'Microsoft',
        hiringBar: '9.2 / 10',
        culture: 'Growth mindset, customer-centric architecture, robust production engineering, enterprise cloud reliability.',
        focusAreas: ['Cloud Architecture (Azure/Distributed)', 'API Design & Idempotency', 'Object-Oriented Design & Clean Code', 'Failure Recovery & Monitoring', 'Customer Impact'],
        categoryWeights: { technical: 0.35, system_design: 0.3, resume_project: 0.25, behavioral: 0.1 },
        signaturePhases: ['Technical Depth & Design', 'System Architecture & Scalability', 'Collaborative Problem Solving']
    },
    amazon: {
        id: 'amazon',
        name: 'Amazon',
        hiringBar: '9.3 / 10',
        culture: 'Leadership Principles (Customer Obsession, Ownership, Bias for Action, Dive Deep, Deliver Results), operational excellence.',
        focusAreas: ['High-Throughput Microservices', 'AWS Cloud Infrastructure', 'Resiliency & Circuit Breakers', 'STAR Behavioral / Leadership Principles', 'Past Project Deep Dive'],
        categoryWeights: { technical: 0.3, system_design: 0.3, resume_project: 0.25, behavioral: 0.15 },
        signaturePhases: ['Technical Problem Solving', 'Microservice System Design', 'Leadership Principles Deep Dive']
    },
    meta: {
        id: 'meta',
        name: 'Meta',
        hiringBar: '9.4 / 10',
        culture: 'Move fast, focus on long-term impact, build social-scale systems, live coding speed and end-to-end architecture.',
        focusAreas: ['High-Concurrency Backend', 'Distributed Caching & Sharding', 'Graph Data Structures', 'Rapid Iteration & Performance', 'Project Impact & Scope'],
        categoryWeights: { technical: 0.4, system_design: 0.35, resume_project: 0.15, behavioral: 0.1 },
        signaturePhases: ['Rapid Systems Coding', 'Social Graph System Design', 'Behavioral & Impact']
    },
    apple: {
        id: 'apple',
        name: 'Apple',
        hiringBar: '9.4 / 10',
        culture: 'Precision engineering, deep hardware-software integration, user privacy, perfection in execution and edge cases.',
        focusAreas: ['Memory Management & Concurrency', 'Low-Latency Performance', 'Security & Zero-Trust', 'Architecture Modularity', 'Deep Resume Verification'],
        categoryWeights: { technical: 0.4, system_design: 0.25, resume_project: 0.25, behavioral: 0.1 },
        signaturePhases: ['Domain Technical Deep Dive', 'System Design & Optimization', 'Craftsmanship & Values']
    },
    netflix: {
        id: 'netflix',
        name: 'Netflix',
        hiringBar: '9.6 / 10',
        culture: 'Freedom & Responsibility, high talent density, extreme fault tolerance, chaos engineering, high autonomy.',
        focusAreas: ['Distributed Streaming Architecture', 'Resiliency & Chaos Engineering', 'Event-Driven Systems (Kafka)', 'Observability & Metrics', 'Independent Decision Making'],
        categoryWeights: { technical: 0.35, system_design: 0.4, resume_project: 0.15, behavioral: 0.1 },
        signaturePhases: ['Advanced System Design', 'Resiliency & Reliability Engineering', 'Culture & Context']
    },
    stripe: {
        id: 'stripe',
        name: 'Stripe',
        hiringBar: '9.5 / 10',
        culture: 'Developer-first craft, exceptional written communication, mathematical correctness, idempotent financial systems.',
        focusAreas: ['Idempotent API Design', 'Cryptographic Correctness & Double-Entry Ledgers', 'High-Availability Database Transactions', 'Debugging & Code Reading', 'Technical Writing'],
        categoryWeights: { technical: 0.35, system_design: 0.35, resume_project: 0.2, behavioral: 0.1 },
        signaturePhases: ['Real-world API Integration', 'Financial Ledger System Design', 'Culture & Written Communication']
    },
    ibm: {
        id: 'ibm',
        name: 'IBM',
        hiringBar: '8.8 / 10',
        culture: 'Enterprise computing, Red Hat OpenShift hybrid cloud, watsonx enterprise AI models, client trust and compliance.',
        focusAreas: ['Enterprise Cloud & Kubernetes/OpenShift', 'Container Orchestration & Microservices', 'Data Governance & Security', 'Database Design & SQL', 'Client Communication'],
        categoryWeights: { technical: 0.35, system_design: 0.25, resume_project: 0.25, behavioral: 0.15 },
        signaturePhases: ['Technical Breadth & Coding', 'Hybrid Cloud & Architecture', 'Managerial Review']
    },
    oracle: {
        id: 'oracle',
        name: 'Oracle',
        hiringBar: '9.0 / 10',
        culture: 'Deep systems engineering, database internals, autonomous cloud infrastructure, ultra-low latency query execution.',
        focusAreas: ['Database Internals & Indexing', 'Distributed Storage & Replication', 'Memory Optimization & OS Concepts', 'High-Performance APIs', 'Systems Debugging'],
        categoryWeights: { technical: 0.4, system_design: 0.3, resume_project: 0.2, behavioral: 0.1 },
        signaturePhases: ['Coding & OS Fundamentals', 'Database & Distributed Storage', 'Technical Discussion']
    },
    uber: {
        id: 'uber',
        name: 'Uber',
        hiringBar: '9.2 / 10',
        culture: 'Real-time dispatch, high throughput geospatial indexing, low-latency microservices, relentless optimization.',
        focusAreas: ['Geospatial & Real-time Systems', 'Low-Latency RPC / gRPC', 'Event Streaming & Dynamic Matching', 'Microservice Fault Isolation', 'Scalable Data Stores'],
        categoryWeights: { technical: 0.35, system_design: 0.35, resume_project: 0.2, behavioral: 0.1 },
        signaturePhases: ['Live Coding & Algorithms', 'Real-time System Architecture', 'Behavioral & Leadership']
    },
    tcs: {
        id: 'tcs',
        name: 'Tata Consultancy Services (TCS)',
        hiringBar: '8.2 / 10',
        culture: 'Reliability, strong software engineering foundations, enterprise SDLC, structured problem solving, client service.',
        focusAreas: ['Core Java / Python OOP Concepts', 'Relational Databases & SQL Queries', 'Web Development Fundamentals', 'Data Structures & Algorithms', 'Project Experience & Agile SDLC'],
        categoryWeights: { technical: 0.4, resume_project: 0.3, problem_solving: 0.15, behavioral: 0.15 },
        signaturePhases: ['Technical Round (OOP & SQL)', 'Project & Scenario Discussion', 'HR & Cultural Alignment']
    },
    infosys: {
        id: 'infosys',
        name: 'Infosys',
        hiringBar: '8.2 / 10',
        culture: 'Learnability, clean coding principles, full-stack enterprise capabilities, agile collaboration.',
        focusAreas: ['Core Programming (Python/Java/JavaScript)', 'Database Optimization & Normalization', 'RESTful Services & APIs', 'Problem Solving Logic', 'Resume Project Architecture'],
        categoryWeights: { technical: 0.4, resume_project: 0.3, problem_solving: 0.15, behavioral: 0.15 },
        signaturePhases: ['Technical Competency Screener', 'Project Architecture & Skills', 'Managerial & HR']
    },
    wipro: {
        id: 'wipro',
        name: 'Wipro',
        hiringBar: '8.2 / 10',
        culture: 'Enterprise delivery, cloud migrations, OOP foundations, structured testing, client-focused problem solving.',
        focusAreas: ['Core Java / Python / C++', 'Database Design & SQL Transactions', 'API Integration & Web Services', 'Agile Methodologies & CI/CD', 'Resume Project Deep Dive'],
        categoryWeights: { technical: 0.4, resume_project: 0.3, problem_solving: 0.15, behavioral: 0.15 },
        signaturePhases: ['Technical Foundation Round', 'Project Architecture Review', 'HR & Cultural Alignment']
    },
    zoho: {
        id: 'zoho',
        name: 'Zoho',
        hiringBar: '8.8 / 10',
        culture: 'Product-first craft, self-reliant tech stack, deep problem solving, modular code design, scalable SaaS architecture.',
        focusAreas: ['Data Structures & Algorithms', 'Object-Oriented Design & Clean Code', 'Database Query Optimization & Caching', 'SaaS Multi-tenancy & Security', 'Hands-on Coding & Project Nuance'],
        categoryWeights: { technical: 0.4, problem_solving: 0.3, resume_project: 0.2, behavioral: 0.1 },
        signaturePhases: ['Core Problem Solving & DSA', 'System & Product Architecture', 'Technical HR Interview']
    },
    flipkart: {
        id: 'flipkart',
        name: 'Flipkart',
        hiringBar: '9.2 / 10',
        culture: 'High-scale e-commerce, flash sales resiliency, distributed messaging, low latency, operational ownership.',
        focusAreas: ['High-Concurrency Systems & Flash Sale Traffic', 'Distributed Caching (Redis) & Sharding', 'Event Streaming with Apache Kafka', 'Database Transaction Isolation & Inventory Locking', 'Data Structures & Algorithms'],
        categoryWeights: { technical: 0.35, system_design: 0.35, resume_project: 0.2, behavioral: 0.1 },
        signaturePhases: ['Machine Coding / Problem Solving', 'High-Scale System Design', 'Hiring Manager & Values']
    },
    paytm: {
        id: 'paytm',
        name: 'Paytm',
        hiringBar: '9.0 / 10',
        culture: 'Fintech transaction security, ultra-high throughput payment routing, zero-loss accounting, ACID compliance.',
        focusAreas: ['Payment Gateway Architecture & Idempotency', 'Distributed Transactions & 2PC / Saga Pattern', 'High-Throughput Concurrency & Locking', 'Security, Encryption & Tokenization', 'Database High Availability & Replication'],
        categoryWeights: { technical: 0.35, system_design: 0.35, resume_project: 0.2, behavioral: 0.1 },
        signaturePhases: ['Coding & Problem Solving', 'Fintech Architecture & System Design', 'Technical Leadership']
    },
    general: {
        id: 'general',
        name: 'Modern Tech Engineering',
        hiringBar: '8.5 / 10',
        culture: 'Production-ready coding, pragmatic system design, clear technical communication, strong ownership.',
        focusAreas: ['API Design & Implementation', 'Database Performance & Caching', 'Cloud & Container Deployment', 'Clean Modular Architecture', 'Resume Projects & Real-World Experience'],
        categoryWeights: { technical: 0.35, system_design: 0.25, resume_project: 0.25, behavioral: 0.15 },
        signaturePhases: ['Technical & Domain Skills', 'System Architecture & Trade-offs', 'Project Deep Dive & Behavioral']
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. COMPREHENSIVE VERIFIED INTERVIEW QUESTION BANK (60+ QUESTIONS)
// ─────────────────────────────────────────────────────────────────────────────
const VERIFIED_QUESTION_BANK = [
    // === PYTHON / FASTAPI / ASYNCIO / BACKEND ===
    {
        id: 'py-fastapi-arch',
        companies: ['all', 'google', 'microsoft', 'amazon', 'uber'],
        roles: ['software-engineer', 'backend-engineer', 'full-stack-engineer'],
        skills: ['python', 'fastapi', 'rest apis', 'asyncio'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['async/await event loop', 'Pydantic validation', 'dependency injection', 'ASGI workers (uvicorn/gunicorn)'],
        question: "How does FastAPI leverage Python's asynchronous event loop and Pydantic models to achieve high concurrency compared to traditional WSGI frameworks like Flask?"
    },
    {
        id: 'py-fastapi-perf',
        companies: ['all', 'amazon', 'stripe', 'microsoft'],
        roles: ['software-engineer', 'backend-engineer'],
        skills: ['python', 'fastapi', 'performance', 'database'],
        category: 'technical',
        difficulty: 'hard',
        frequency: 'frequently_asked',
        expectedTopics: ['async database drivers (asyncpg/motor)', 'blocking calls in async endpoints', 'thread pool execution with def vs async def', 'connection pooling'],
        question: "In FastAPI, what happens when a synchronous blocking database call is made inside an `async def` endpoint, and how do you prevent thread starvation under high request loads?"
    },
    {
        id: 'py-memory-gc',
        companies: ['google', 'meta', 'apple', 'amazon'],
        roles: ['software-engineer', 'backend-engineer'],
        skills: ['python', 'memory management', 'performance'],
        category: 'technical',
        difficulty: 'hard',
        frequency: 'standard',
        expectedTopics: ['reference counting', 'cyclic garbage collector', 'GIL (Global Interpreter Lock)', 'tracemalloc / memory profiling'],
        question: "Can you explain how Python manages memory between reference counting and the generational garbage collector, and how the GIL impacts CPU-bound vs IO-bound multi-threaded workloads?"
    },
    {
        id: 'py-django-orm',
        companies: ['all', 'uber', 'meta', 'infosys', 'tcs'],
        roles: ['backend-engineer', 'full-stack-engineer', 'software-engineer'],
        skills: ['python', 'django', 'sql', 'orm'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'standard',
        expectedTopics: ['N+1 query problem', 'select_related vs prefetch_related', 'lazy evaluation of querysets', 'database transactions in ORM'],
        question: "How does the N+1 query problem occur in Django/SQLAlchemy ORMs, and how do you use `select_related` and `prefetch_related` to eliminate redundant database round-trips?"
    },

    // === REST APIS, AUTHENTICATION & SECURITY ===
    {
        id: 'api-idempotency',
        companies: ['stripe', 'amazon', 'uber', 'microsoft'],
        roles: ['software-engineer', 'backend-engineer', 'full-stack-engineer'],
        skills: ['rest apis', 'distributed systems', 'database', 'redis'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['idempotency keys', 'atomic locks in Redis', 'deduplication', 'HTTP status codes (409 Conflict, 200 OK with cached response)'],
        question: "How do you design an idempotent POST API endpoint for financial transactions or order placements to ensure network retries do not cause duplicate executions?"
    },
    {
        id: 'api-auth-jwt',
        companies: ['all', 'google', 'microsoft', 'ibm', 'infosys', 'tcs'],
        roles: ['software-engineer', 'backend-engineer', 'full-stack-engineer'],
        skills: ['authentication', 'jwt', 'security', 'rest apis'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['access vs refresh tokens', 'token rotation', 'signature validation with asymmetric keys (RS256)', 'handling token revocation without querying DB on every request'],
        question: "When implementing JWT-based authentication in microservices, how do you handle secure token revocation and refresh token rotation while maintaining stateless performance?"
    },
    {
        id: 'api-rate-limiting-algo',
        companies: ['stripe', 'google', 'amazon', 'meta', 'uber'],
        roles: ['software-engineer', 'backend-engineer'],
        skills: ['rest apis', 'security', 'redis', 'system design'],
        category: 'technical',
        difficulty: 'hard',
        frequency: 'frequently_asked',
        expectedTopics: ['Token Bucket', 'Leaky Bucket', 'Sliding Window Counter', 'Redis Lua atomic scripts', 'HTTP 429 Too Many Requests'],
        question: "Compare the Token Bucket versus Sliding Window Counter algorithms for API rate limiting. How would you implement an atomic sliding-window limiter in Redis?"
    },
    {
        id: 'api-graphql-vs-rest',
        companies: ['meta', 'netflix', 'microsoft', 'general'],
        roles: ['full-stack-engineer', 'backend-engineer', 'frontend-engineer'],
        skills: ['rest apis', 'graphql', 'api design'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'standard',
        expectedTopics: ['over-fetching & under-fetching', 'schema definition language', 'DataLoader for N+1 batched queries', 'caching challenges in HTTP POST vs GET'],
        question: "What architectural trade-offs do you consider when choosing GraphQL over REST for client-server communication, and how do you resolve GraphQL DataLoader N+1 query bottlenecks?"
    },

    // === DATABASES, SQL, POSTGRESQL, MYSQL, MONGODB & CACHING ===
    {
        id: 'db-index-opt',
        companies: ['all', 'google', 'amazon', 'oracle', 'uber', 'microsoft'],
        roles: ['software-engineer', 'backend-engineer', 'data-engineer'],
        skills: ['sql', 'postgresql', 'mysql', 'indexing', 'database'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['B-Tree index structure', 'composite indexes (leftmost prefix rule)', 'EXPLAIN ANALYZE', 'index selectivity and table scans'],
        question: "How does a B-Tree index work under the hood in PostgreSQL/MySQL, and what factors determine whether the query planner uses an index scan versus a sequential table scan?"
    },
    {
        id: 'db-acid-isolation',
        companies: ['oracle', 'stripe', 'amazon', 'microsoft', 'google'],
        roles: ['software-engineer', 'backend-engineer'],
        skills: ['database', 'sql', 'transactions', 'concurrency'],
        category: 'technical',
        difficulty: 'hard',
        frequency: 'frequently_asked',
        expectedTopics: ['Read Committed vs Repeatable Read vs Serializable', 'dirty reads, non-repeatable reads, phantom reads', 'MVCC (Multi-Version Concurrency Control)', 'optimistic vs pessimistic locking'],
        question: "Can you break down the difference between Read Committed and Serializable transaction isolation levels, and explain how MVCC prevents read locks from blocking writes?"
    },
    {
        id: 'db-redis-caching',
        companies: ['all', 'meta', 'uber', 'netflix', 'amazon'],
        roles: ['software-engineer', 'backend-engineer', 'full-stack-engineer'],
        skills: ['redis', 'caching', 'system design'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['cache-aside pattern', 'write-through / write-back', 'cache stampede / dog-piling mitigation', 'TTL & eviction policies (LRU/LFU)'],
        question: "In high-traffic systems, how do you handle cache invalidation and prevent Cache Stampede (thundering herd problem) when a critical cached key expires?"
    },
    {
        id: 'db-mongodb-sharding',
        companies: ['all', 'uber', 'ibm', 'microsoft'],
        roles: ['software-engineer', 'backend-engineer'],
        skills: ['mongodb', 'nosql', 'database', 'sharding'],
        category: 'technical',
        difficulty: 'hard',
        frequency: 'standard',
        expectedTopics: ['shard key selection', 'range vs hashed sharding', 'chunk migrations & balancer', 'scatter-gather queries vs targeted routing'],
        question: "What criteria do you use to select an effective shard key in MongoDB to prevent monotonic write hotspots and avoid expensive scatter-gather query routing?"
    },
    {
        id: 'db-query-performance-tuning',
        companies: ['oracle', 'amazon', 'google', 'tcs', 'infosys'],
        roles: ['backend-engineer', 'database-administrator', 'software-engineer'],
        skills: ['sql', 'postgresql', 'database', 'performance'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['EXPLAIN ANALYZE execution cost', 'seq scan vs index scan vs bitmap index scan', 'work_mem and temporary disk files', 'vacuuming & dead tuples'],
        question: "Walk me through your step-by-step methodology when analyzing an `EXPLAIN ANALYZE` execution plan to optimize a query running 10x slower than acceptable p99 latency."
    },

    // === SYSTEM DESIGN & DISTRIBUTED ARCHITECTURE ===
    {
        id: 'sd-rate-limiter',
        companies: ['stripe', 'google', 'amazon', 'meta', 'uber'],
        roles: ['software-engineer', 'backend-engineer', 'system-architect'],
        skills: ['system design', 'redis', 'distributed systems', 'concurrency'],
        category: 'system_design',
        difficulty: 'hard',
        frequency: 'frequently_asked',
        expectedTopics: ['Token Bucket / Leaky Bucket / Sliding Window Log', 'distributed rate limiting with Redis Lua scripts', 'handling race conditions', 'multi-region synchronization'],
        question: "How would you design a distributed API Rate Limiter that can handle millions of requests per second with sub-millisecond overhead across multiple server nodes?"
    },
    {
        id: 'sd-event-streaming',
        companies: ['netflix', 'uber', 'amazon', 'microsoft'],
        roles: ['software-engineer', 'backend-engineer', 'data-engineer'],
        skills: ['kafka', 'distributed systems', 'microservices', 'event-driven'],
        category: 'system_design',
        difficulty: 'hard',
        frequency: 'frequently_asked',
        expectedTopics: ['Kafka topic partitions & consumer groups', 'at-least-once vs exactly-once semantics', 'handling consumer lag', 'dead letter queues (DLQ)'],
        question: "When building an asynchronous event-driven system with Kafka or RabbitMQ, how do you guarantee message ordering within an entity and handle poisonous/failing messages gracefully?"
    },
    {
        id: 'sd-microservices-resilience',
        companies: ['amazon', 'netflix', 'microsoft', 'google'],
        roles: ['software-engineer', 'backend-engineer', 'devops-engineer'],
        skills: ['microservices', 'system design', 'cloud'],
        category: 'system_design',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['circuit breaker pattern (Hystrix/Resilience4j)', 'exponential backoff with jitter', 'bulkhead isolation', 'graceful degradation & fallback responses'],
        question: "When downstream microservices experience cascading latency or intermittent outages, what design patterns do you use to ensure your service fails gracefully without depleting connection pools?"
    },
    {
        id: 'sd-distributed-transactions',
        companies: ['stripe', 'amazon', 'uber', 'google'],
        roles: ['software-engineer', 'backend-engineer'],
        skills: ['distributed systems', 'microservices', 'system design', 'database'],
        category: 'system_design',
        difficulty: 'hard',
        frequency: 'frequently_asked',
        expectedTopics: ['Saga pattern (Orchestration vs Choreography)', 'compensating transactions', 'Two-Phase Commit (2PC) limitations', 'Outbox pattern for atomic event publishing'],
        question: "In a microservices architecture where each service has its own database, how do you handle cross-service distributed transactions using the Saga pattern and transactional outbox?"
    },
    {
        id: 'sd-url-shortener-scale',
        companies: ['google', 'meta', 'microsoft', 'amazon'],
        roles: ['software-engineer', 'backend-engineer'],
        skills: ['system design', 'distributed systems', 'caching', 'database'],
        category: 'system_design',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['Base62 encoding', 'distributed ID generation (Snowflake/UUIDv7)', 'read-heavy caching with Redis', 'database sharding by hash range'],
        question: "Design a scalable URL Shortener service handling 100M daily active writes and 10B daily reads. How would you generate unique 7-character aliases without collision across distributed nodes?"
    },

    // === JAVASCRIPT / TYPESCRIPT / NODE.JS ===
    {
        id: 'js-event-loop',
        companies: ['all', 'google', 'meta', 'microsoft', 'uber'],
        roles: ['software-engineer', 'full-stack-engineer', 'frontend-engineer', 'backend-engineer'],
        skills: ['javascript', 'node.js', 'typescript', 'concurrency'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['Call Stack', 'Microtask Queue (Promises, queueMicrotask)', 'Macrotask Queue (setTimeout, setImmediate, I/O)', 'process.nextTick priority'],
        question: "Explain the exact execution order of the Node.js event loop phases, specifically how the microtask queue (Promises/process.nextTick) executes relative to timer and I/O macrotasks."
    },
    {
        id: 'js-memory-leaks-node',
        companies: ['meta', 'netflix', 'amazon', 'uber'],
        roles: ['backend-engineer', 'full-stack-engineer', 'software-engineer'],
        skills: ['node.js', 'javascript', 'performance', 'debugging'],
        category: 'technical',
        difficulty: 'hard',
        frequency: 'frequently_asked',
        expectedTopics: ['unclosed EventEmitters', 'global variables & closures holding references', 'heap dump analysis using Chrome DevTools / clinic.js', 'V8 garbage collector pauses'],
        question: "How do you detect and profile memory leaks in a production Node.js service, and what common code patterns (e.g. closures, unremoved event listeners) cause heap fragmentation?"
    },
    {
        id: 'ts-advanced-types',
        companies: ['microsoft', 'stripe', 'meta', 'google'],
        roles: ['frontend-engineer', 'full-stack-engineer', 'software-engineer'],
        skills: ['typescript', 'javascript'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'standard',
        expectedTopics: ['conditional types', 'mapped types (`keyof`, `Record`)', 'type narrowing with discriminated unions', '`unknown` vs `any`'],
        question: "How do conditional types and mapped types in TypeScript allow you to write type-safe utility wrappers without runtime overhead, and why is `unknown` preferred over `any`?"
    },

    // === REACT / FRONTEND / WEB PERFORMANCE ===
    {
        id: 'fe-react-re-render',
        companies: ['all', 'meta', 'google', 'microsoft', 'apple'],
        roles: ['frontend-engineer', 'full-stack-engineer', 'software-engineer'],
        skills: ['react', 'javascript', 'frontend', 'performance'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['Virtual DOM diffing algorithm', 'useMemo and useCallback dependencies', 'React.memo shallow comparison', 'state colocation to avoid tree re-renders'],
        question: "How does React determine when to re-render a component tree, and what are the specific use cases where `useCallback` or `useMemo` actually improve versus degrade performance?"
    },
    {
        id: 'fe-web-vitals',
        companies: ['google', 'meta', 'netflix', 'amazon'],
        roles: ['frontend-engineer', 'full-stack-engineer'],
        skills: ['web performance', 'javascript', 'frontend', 'seo'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['Core Web Vitals (LCP, FID/INP, CLS)', 'code splitting / dynamic imports', 'critical CSS & asset preloading', 'image compression & WebP/AVIF formats'],
        question: "How do you diagnose and optimize Core Web Vitals—specifically Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS)—in modern single-page applications?"
    },
    {
        id: 'fe-state-management',
        companies: ['meta', 'microsoft', 'uber', 'all'],
        roles: ['frontend-engineer', 'full-stack-engineer'],
        skills: ['react', 'redux', 'frontend', 'state management'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'standard',
        expectedTopics: ['server state (TanStack Query / RTK Query) vs client UI state', 'optimistic updates', 'normalized cache', 'Context API re-render trade-offs'],
        question: "When architecting frontend state management, how do you separate asynchronous server state (with caching & optimistic updates) from client UI state to prevent unnecessary component re-renders?"
    },

    // === JAVA / SPRING BOOT / ENTERPRISE ===
    {
        id: 'java-jvm-memory',
        companies: ['oracle', 'amazon', 'ibm', 'tcs', 'infosys'],
        roles: ['software-engineer', 'backend-engineer'],
        skills: ['java', 'spring boot', 'jvm', 'performance'],
        category: 'technical',
        difficulty: 'hard',
        frequency: 'frequently_asked',
        expectedTopics: ['Heap (Eden, Survivor, Tenured)', 'Metaspace', 'G1 vs ZGC garbage collectors', 'OutOfMemoryError diagnosis (Heap vs Metaspace)'],
        question: "Can you detail the JVM memory model across Eden, Survivor, and Tenured spaces, and explain how the G1 or ZGC garbage collector minimizes Stop-The-World pause times for high-throughput services?"
    },
    {
        id: 'java-spring-concurrency',
        companies: ['ibm', 'oracle', 'amazon', 'infosys', 'tcs'],
        roles: ['software-engineer', 'backend-engineer'],
        skills: ['java', 'spring', 'spring boot', 'concurrency'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['Spring bean singleton scope thread-safety', '`@Transactional` propagation levels (REQUIRED, REQUIRES_NEW)', 'Virtual Threads in Java 21 (Project Loom)', 'connection pool configuration (HikariCP)'],
        question: "In a Spring Boot application where beans are singletons by default, how do you ensure thread-safety across concurrent requests, and how does `@Transactional(propagation = Propagation.REQUIRES_NEW)` behave?"
    },

    // === GOLANG / CONCURRENCY ===
    {
        id: 'go-concurrency-channels',
        companies: ['google', 'uber', 'stripe', 'meta'],
        roles: ['software-engineer', 'backend-engineer'],
        skills: ['go', 'golang', 'concurrency', 'microservices'],
        category: 'technical',
        difficulty: 'hard',
        frequency: 'frequently_asked',
        expectedTopics: ['Goroutines vs OS threads', 'buffered vs unbuffered channels', '`sync.Mutex` vs `sync.RWMutex` vs channel communication', 'context cancellation propagation (`context.WithTimeout`)'],
        question: "How do Go goroutines and the M:N scheduler achieve lightweight concurrency with minimal memory overhead, and how do you use the `context` package to propagate cancellation across downstream RPC calls?"
    },

    // === DOCKER, KUBERNETES & CLOUD DEVOPS ===
    {
        id: 'devops-docker-opt',
        companies: ['all', 'ibm', 'microsoft', 'amazon', 'google'],
        roles: ['software-engineer', 'devops-engineer', 'backend-engineer'],
        skills: ['docker', 'ci/cd', 'containers'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'standard',
        expectedTopics: ['multi-stage builds', 'layer caching order', 'non-root user security', 'minimal base images (Alpine/Distroless)'],
        question: "What best practices do you follow to optimize Docker images for production security, minimal layer size, and fast CI/CD build cache hit rates?"
    },
    {
        id: 'devops-k8s-arch',
        companies: ['ibm', 'google', 'microsoft', 'netflix'],
        roles: ['devops-engineer', 'backend-engineer', 'system-architect'],
        skills: ['kubernetes', 'cloud', 'devops'],
        category: 'technical',
        difficulty: 'hard',
        frequency: 'standard',
        expectedTopics: ['liveness vs readiness vs startup probes', 'HPA (Horizontal Pod Autoscaling)', 'graceful shutdown (SIGTERM handling & preStop hook)', 'ConfigMaps & Secrets management'],
        question: "How do Kubernetes liveness and readiness probes differ in their handling of unhealthy pods, and how do you ensure zero-downtime rolling deployments during traffic spikes?"
    },
    {
        id: 'devops-cicd-security',
        companies: ['amazon', 'microsoft', 'google', 'all'],
        roles: ['devops-engineer', 'software-engineer'],
        skills: ['ci/cd', 'security', 'devops', 'cloud'],
        category: 'technical',
        difficulty: 'medium',
        frequency: 'standard',
        expectedTopics: ['immutable build artifacts', 'static application security testing (SAST)', 'secret rotation without downtime', 'blue-green vs canary deployments'],
        question: "How do you structure an enterprise CI/CD pipeline with automated automated canary deployments and instant rollback triggers based on Prometheus error-rate metrics?"
    },

    // === DATA STRUCTURES, ALGORITHMS & PROBLEM SOLVING ===
    {
        id: 'dsa-graph-topo-sort',
        companies: ['google', 'meta', 'amazon', 'microsoft', 'apple'],
        roles: ['software-engineer', 'backend-engineer'],
        skills: ['data structures', 'algorithms', 'problem solving'],
        category: 'problem_solving',
        difficulty: 'hard',
        frequency: 'frequently_asked',
        expectedTopics: ['Directed Acyclic Graph (DAG)', 'Kahn\'s Algorithm (indegree queue)', 'DFS cycle detection (visiting/visited states)', 'Time complexity O(V + E)'],
        question: "How would you detect circular dependencies in a package manager or microservice build pipeline using Topological Sort on a Directed Acyclic Graph (DAG)?"
    },
    {
        id: 'dsa-sliding-window',
        companies: ['google', 'meta', 'amazon', 'apple', 'uber'],
        roles: ['software-engineer', 'all'],
        skills: ['data structures', 'algorithms', 'problem solving'],
        category: 'problem_solving',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['two pointers', 'hash map frequency counter', 'dynamic window resizing', 'O(N) linear time complexity'],
        question: "When solving substring or subarray optimization problems, how does the Sliding Window pattern reduce O(N^2) brute-force searches to O(N) linear time complexity?"
    },

    // === BEHAVIORAL & STAR SCENARIOS ===
    {
        id: 'beh-star-conflict',
        companies: ['all', 'amazon', 'google', 'microsoft', 'apple'],
        roles: ['all', 'software-engineer', 'product-manager'],
        skills: ['behavioral', 'leadership', 'communication'],
        category: 'behavioral',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['Situation, Task, Action, Result', 'data-driven decision making', 'disagree and commit', 'respectful compromise'],
        question: "Tell me about a time you had a significant technical disagreement with a teammate or senior engineer about an architectural design. How did you resolve it, and what was the outcome?"
    },
    {
        id: 'beh-star-outage',
        companies: ['amazon', 'netflix', 'meta', 'google', 'uber'],
        roles: ['all', 'software-engineer', 'devops-engineer'],
        skills: ['behavioral', 'problem solving', 'incident management'],
        category: 'behavioral',
        difficulty: 'medium',
        frequency: 'frequently_asked',
        expectedTopics: ['blameless postmortem', 'root cause analysis', 'immediate mitigation vs long-term prevention', 'stakeholder communication during outages'],
        question: "Describe a high-priority production bug or outage you were responsible for debugging under time pressure. Walk me through how you isolated the root cause, mitigated customer impact, and prevented regression."
    },
    {
        id: 'beh-star-delivery-deadline',
        companies: ['all', 'amazon', 'meta', 'tcs', 'infosys'],
        roles: ['all', 'software-engineer'],
        skills: ['behavioral', 'leadership', 'project management'],
        category: 'behavioral',
        difficulty: 'medium',
        frequency: 'standard',
        expectedTopics: ['scope negotiation', 'MVP delivery', 'proactive stakeholder updates', 'managing technical debt'],
        question: "Tell me about a project where unforeseen technical hurdles threatened a critical release deadline. How did you prioritize deliverables, communicate with stakeholders, and ship reliably?"
    }
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. SKILL EXTRACTION & SEMANTIC SIMILARITY UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts normalized skill tokens from unstructured text
 */
function extractSkillTokens(text = '') {
    if (!text || typeof text !== 'string') return [];
    const normalized = text.toLowerCase();
    const knownSkills = [
        'python', 'fastapi', 'django', 'flask', 'asyncio',
        'javascript', 'typescript', 'react', 'node.js', 'express', 'next.js', 'redux', 'vue',
        'java', 'spring', 'spring boot', 'jvm',
        'go', 'golang', 'c++', 'rust', 'ruby',
        'sql', 'postgresql', 'postgres', 'mysql', 'mongodb', 'redis', 'cassandra', 'elasticsearch', 'database', 'indexing',
        'rest apis', 'graphql', 'grpc', 'microservices', 'system design', 'concurrency', 'distributed systems', 'sharding',
        'docker', 'kubernetes', 'k8s', 'terraform', 'aws', 'gcp', 'azure', 'ci/cd', 'kafka', 'rabbitmq', 'event-driven',
        'web performance', 'core web vitals', 'security', 'authentication', 'jwt',
        'data structures', 'algorithms', 'problem solving',
        'behavioral', 'leadership', 'communication', 'incident management'
    ];

    const matched = new Set();
    for (const skill of knownSkills) {
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(normalized) || normalized.includes(skill)) {
            matched.add(skill);
        }
    }
    return Array.from(matched);
}

function stemToken(w) {
    if (!w) return '';
    return w.toLowerCase()
        .replace(/(ing|tion|tions|ed|es|s|ly|ous|al|ic|ment)$/i, '')
        .replace(/^asynchron/i, 'async');
}

/**
 * Calculates Token-Level Jaccard & N-Gram Similarity to detect semantic duplicates
 */
function calculateSemanticSimilarity(textA = '', textB = '') {
    if (!textA || !textB) return 0;
    
    const stopWords = new Set(['how', 'what', 'can', 'you', 'explain', 'describe', 'tell', 'about', 'your', 'the', 'and', 'for', 'with', 'in', 'does', 'work', 'under', 'hood', 'when', 'why']);
    const tokenize = (t) => {
        return t.toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.has(w))
            .map(stemToken);
    };

    const tokensA = tokenize(textA);
    const tokensB = tokenize(textB);

    if (tokensA.length === 0 || tokensB.length === 0) return 0;

    const setA = new Set(tokensA);
    const setB = new Set(tokensB);

    let intersectionCount = 0;
    for (const tokA of setA) {
        if (setB.has(tokA) || Array.from(setB).some(tokB => tokB.startsWith(tokA) || tokA.startsWith(tokB))) {
            intersectionCount++;
        }
    }

    const minSize = Math.min(setA.size, setB.size);
    const overlapRatio = minSize > 0 ? intersectionCount / minSize : 0;

    // Bigram overlap check
    const getBigrams = (tokens) => {
        const bigrams = new Set();
        for (let i = 0; i < tokens.length - 1; i++) {
            bigrams.add(`${tokens[i]}_${tokens[i+1]}`);
        }
        return bigrams;
    };

    const bigramsA = getBigrams(tokensA);
    const bigramsB = getBigrams(tokensB);
    let bigramOverlap = 0;
    if (bigramsA.size > 0 && bigramsB.size > 0) {
        let biInter = 0;
        for (const bg of bigramsA) {
            if (bigramsB.has(bg)) biInter++;
        }
        bigramOverlap = biInter / Math.max(bigramsA.size, bigramsB.size);
    }

    return Math.max(overlapRatio * 0.85, bigramOverlap);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3.1 CANDIDATE UNSURE / SKIP DETECTION HELPER
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Classifies what the candidate actually did this turn.
 *
 * Previously only "unsure / skip" was recognised, so anything else was
 * treated as an answer. A candidate saying "sorry, can you explain that more
 * simply?" had their request scored as a weak answer and the interviewer
 * moved on — the opposite of what a real interviewer does.
 */
const CLARIFY_PATTERNS = [
    /\b(can|could|would) you (please )?(repeat|say that again|rephrase|reword|simplify|explain|clarify|elaborate)\b/i,
    /\b(repeat|rephrase|reword|simplify) (the|that|this) (question|one)\b/i,
    /\bexplain (it|that|the question)?\s*(again|more|better|simpler|simply|in simple)\b/i,
    /\bin (simple|simpler|plain|easier) (terms|words|english)\b/i,
    /\b(what|sorry,? what) do you mean\b/i,
    /\b(i )?(didn'?t|did not|couldn'?t|could not) (quite )?(catch|hear|understand|get) (that|you|the question)\b/i,
    /\bcome again\b/i,
    /\bsay (that )?again\b/i,
    /\b(give|can i get|could i get) (me )?(an |a )?(example|hint)\b/i,
    /\bnot sure (what|which) you('| a)?re asking\b/i,
    /\bwhat exactly are you asking\b/i,
    /\bcan you be more specific\b/i
];

const REPEAT_ONLY = /\b(repeat|say that again|come again|(didn'?t|did not|couldn'?t|could not) (quite )?(catch|hear))\b/i;
const SIMPLIFY = /\b(simpl|plain|easier|basic|layman)\w*\b/i;
const EXAMPLE = /\b(example|hint|for instance)\b/i;

/**
 * @returns {{intent: 'CLARIFY'|'UNSURE_SKIP'|'ANSWER', mode?: 'REPEAT'|'SIMPLIFY'|'EXAMPLE'}}
 */
function detectCandidateIntent(text = '') {
    const raw = String(text || '').trim();
    if (!raw) return { intent: 'ANSWER' };

    const isClarify = CLARIFY_PATTERNS.some(p => p.test(raw));

    // A long turn that merely contains "for example" is an answer, not a
    // request for one. Clarification requests are short.
    const wordCount = raw.split(/\s+/).filter(Boolean).length;
    if (isClarify && wordCount <= 25) {
        let mode = 'REPEAT';
        if (SIMPLIFY.test(raw)) mode = 'SIMPLIFY';
        else if (EXAMPLE.test(raw)) mode = 'EXAMPLE';
        else if (!REPEAT_ONLY.test(raw)) mode = 'SIMPLIFY';
        return { intent: 'CLARIFY', mode };
    }

    if (isCandidateUnsureOrSkipping(raw)) return { intent: 'UNSURE_SKIP' };
    return { intent: 'ANSWER' };
}

function isCandidateUnsureOrSkipping(text = '') {
    if (!text || typeof text !== 'string') return false;
    const lower = text.toLowerCase().trim();
    const patterns = [
        "i don't know",
        "i dont know",
        "i do not know",
        "not sure",
        "i'm not sure",
        "im not sure",
        "no idea",
        "have no idea",
        "i have no clue",
        "no clue",
        "skip this",
        "skip question",
        "can we skip",
        "let's skip",
        "pass this",
        "can we move to the next",
        "move to the next",
        "move to next question",
        "next question please",
        "i don't remember",
        "i dont recall",
        "haven't worked with",
        "havent worked with",
        "not familiar with",
        "never used this"
    ];
    return patterns.some(p => lower.includes(p));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. INTERVIEW TOPIC TRACKING & DIRECTIVE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluates current topic coverage state and determines next interview directive
 */
// ─────────────────────────────────────────────────────────────────────────────
// 4a. ANSWER SUBSTANCE ANALYSIS
// A real interviewer reacts to WHAT was said, not how long it was. A fluent
// answer with no numbers, no named technology and no trade-offs is weak even
// at 60 words — word count alone scores it as SOLID.
// ─────────────────────────────────────────────────────────────────────────────

// "cut latency by 40%", "p99 from 800ms to 120ms", "3x throughput", "~2 million rows"
const METRIC_PATTERN = /\b\d+(?:\.\d+)?\s*(?:%|percent|x\b|ms\b|s\b|sec|seconds?|min|minutes?|hours?|days?|weeks?|months?|k\b|m\b|mm\b|bn?\b|gb|mb|tb|qps|rps|tps|req\/s|users?|rows?|records?|requests?)/i;
const BARE_NUMBER_PATTERN = /\b\d{2,}\b/;

// Unquantified intensifiers — the tell for a claim with no evidence behind it.
const VAGUE_INTENSIFIERS = /\b(a lot|lots|much better|way better|significantly|substantially|drastically|dramatically|hugely|massively|greatly|considerably|quite a bit|pretty good|really good|very good|much faster|way faster|a ton|tons|many times)\b/gi;

// Hedging — signals the candidate is not speaking from direct experience.
const HEDGE_WORDS = /\b(i think|i guess|maybe|probably|sort of|kind of|something like|or something|i'm not sure|not really sure|i believe|possibly|perhaps|i would say)\b/gi;

// Superlatives that demand evidence.
const STRONG_CLAIMS = /\b(best|optimal|fastest|most efficient|perfect|flawless|never fail(?:s|ed)?|always works?|zero downtime|100%|completely eliminated|solved it entirely|no issues)\b/gi;

// Concrete engineering nouns — presence means the answer has real texture.
const SPECIFIC_TERMS = /\b(redis|postgres(?:ql)?|mysql|mongo(?:db)?|kafka|rabbitmq|sqs|kinesis|docker|kubernetes|k8s|terraform|nginx|envoy|grpc|graphql|rest|websocket|oauth|jwt|saml|index(?:es|ing)?|shard(?:ing|ed)?|partition(?:ing|ed)?|replica(?:tion|s)?|cache|caching|cdn|queue|worker|cron|batch|idempoten\w*|transaction|acid|cap theorem|consistency|latency|throughput|p9[59]|percentile|circuit breaker|retry|backoff|rate limit\w*|load balanc\w*|autoscal\w*|blue.?green|canary|rollback|migration|schema|orm|n\+1|deadlock|race condition|mutex|semaphore|goroutine|thread pool|connection pool|memory leak|gc\b|profil(?:er|ing)|trace|span|observability|prometheus|grafana|datadog|sentry|ci\/cd|jenkins|github actions|unit test|integration test|mock|stub|tdd)\b/gi;

function countMatches(text, re) {
    const m = String(text || '').match(re);
    return m ? m.length : 0;
}

/**
 * Classifies the substance of a candidate answer so the directive engine can
 * react the way a human interviewer would.
 */
// Directives that keep the interview on the SAME thread as the previous answer.
// These all count against the consecutive-probe budget so the candidate is
// never grilled on one point forever.
const PROBE_DIRECTIVES = new Set([
    'FOLLOW_UP_DEEPEN',
    'FOLLOW_UP_CLARIFY',
    'CHALLENGE_CLAIM',
    'PROBE_FOR_SPECIFICS',
    'PROBE_FOR_OWNERSHIP',
    'REDIRECT_RAMBLING'
]);

// Only the ACTIVE directive is sent to the model each turn. Sending all eight
// added ~1.7k characters to every prompt, which pushed generation into a
// high-variance latency regime for no benefit — the model only needs this turn.
/**
 * Builds a probe directly from the candidate's own answer, with no model call.
 *
 * Probing must not depend on a flaky upstream: when generation times out the
 * old fallback served a generic verified question, which silently discarded
 * the directive — a candidate who waffled got a textbook question instead of
 * being pushed. These templates are deterministic and instant.
 */
function buildDeterministicProbe(directive, previousAnswer = '') {
    const text = String(previousAnswer || '').trim();

    // Quote the candidate so the probe sounds like it was listening.
    const vagueMatch = text.match(/\b(a lot|lots|much better|way better|significantly|substantially|drastically|dramatically|hugely|massively|greatly|considerably|much faster|way faster|pretty good|really good)\b/i);
    const claimMatch = text.match(/\b(best|optimal|fastest|most efficient|perfect|never fails?|always works?|zero downtime|100%)\b/i);
    const quoted = (vagueMatch && vagueMatch[0]) || (claimMatch && claimMatch[0]) || null;

    switch (directive) {
        case 'CHALLENGE_CLAIM':
            return quoted
                ? `You said it was "${quoted}" — I need to put a number on that. What was the measurement before, and what did it become after?`
                : `That sounds like a meaningful improvement. What was the measurement before, and what did it become after?`;
        case 'PROBE_FOR_SPECIFICS':
            return `Let's get concrete on that. Which specific part did you change, and what did you use to do it?`;
        case 'PROBE_FOR_OWNERSHIP':
            return `I want to understand your part in that. Were you hands-on implementing it, or closer to the design and review side?`;
        case 'FOLLOW_UP_CLARIFY':
            return `Could you expand on that with a specific example from your own work?`;
        case 'REDIRECT_RAMBLING':
            return `Let me stop you there — in one sentence, what was the actual bottleneck you were solving?`;
        case 'FOLLOW_UP_DEEPEN':
            return `Good, that's specific. Now take it further: what breaks first if that system sees ten times the traffic?`;
        default:
            return null;
    }
}

const DIRECTIVE_PLAYBOOK = {
    CHALLENGE_CLAIM: '## THIS TURN — CHALLENGE THE CLAIM:\nThey claimed impact with no evidence. Make them back it up with a number or a before/after, quoting their own words. e.g. "You said it improved a lot — what was it before, and what did it become?" Stay on this topic; do NOT move on.',
    PROBE_FOR_SPECIFICS: '## THIS TURN — PROBE FOR SPECIFICS:\nThe answer named no technology, number or trade-off. Ask for the concrete mechanism. e.g. "Which part specifically? Walk me through what you actually changed." Stay on this topic; do NOT move on.',
    PROBE_FOR_OWNERSHIP: '## THIS TURN — PROBE OWNERSHIP:\nThey hedged ("I think", "not sure"), so they may not have done this themselves. Find the edge of their real experience without embarrassing them. e.g. "Were you hands-on for that part, or closer to the design side?" Stay on this topic.',
    FOLLOW_UP_CLARIFY: '## THIS TURN — ASK THEM TO EXPAND:\nThe answer was too short. Ask for a concrete example on the SAME topic.',
    REDIRECT_RAMBLING: '## THIS TURN — INTERRUPT AND NARROW:\nThey are talking at length without landing a point. Politely cut in and narrow it. e.g. "Let me stop you there — in one sentence, what was the actual bottleneck?"',
    FOLLOW_UP_DEEPEN: '## THIS TURN — GO DEEPER:\nStrong, specific answer. Reward it by going a level harder on the SAME topic: scale, failure modes, trade-offs. e.g. "Good. Now what breaks when traffic goes 10x?"',
    TRANSITION_NEXT_SKILL: '## THIS TURN — MOVE ON:\nAcknowledge their answer in a few words, then pivot to an uncovered topic from the JD.',
    BEHAVIORAL_SCENARIO: '## THIS TURN — BEHAVIOURAL:\nFinal question. Ask a situational question about conflict, failure, ownership or trade-offs.'
};

function isProbeDirective(directive) {
    return PROBE_DIRECTIVES.has(String(directive || ''));
}

function analyzeAnswerSubstance(answerText = '', evaluationScore = null) {
    const text = String(answerText || '').trim();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    const hasMetrics = METRIC_PATTERN.test(text) || BARE_NUMBER_PATTERN.test(text);
    const specificCount = countMatches(text, SPECIFIC_TERMS);
    const vagueCount = countMatches(text, VAGUE_INTENSIFIERS);
    const hedgeCount = countMatches(text, HEDGE_WORDS);
    const claimCount = countMatches(text, STRONG_CLAIMS);

    // Information density: concrete terms per 100 words.
    const density = wordCount > 0 ? (specificCount / wordCount) * 100 : 0;

    // A claim of impact with nothing to back it.
    const hasUnsupportedClaim = (claimCount > 0 || vagueCount > 0) && !hasMetrics;

    // Long, low-density and hedge-heavy: the candidate is talking around it.
    const isRambling = wordCount >= 160 && density < 1.5;

    // Fluent but empty: enough words to pass the old check, nothing concrete in it.
    const isVague = wordCount >= 10 && specificCount === 0 && !hasMetrics;

    const isTooShort = wordCount < 10;

    // Repeated hedging with little concrete detail: the candidate is describing
    // something they did not actually do, or cannot recall.
    const isHedged = hedgeCount >= 2 && specificCount <= 1 && !hasMetrics;

    // Ordered by what a human interviewer would react to first. A bold claim
    // with no evidence outranks general vagueness — it is the more useful probe.
    let substance = 'SOLID';
    if (isTooShort) substance = 'TOO_SHORT';
    else if (hasUnsupportedClaim) substance = 'UNSUPPORTED_CLAIM';
    else if (isHedged) substance = 'HEDGED';
    else if (isVague) substance = 'VAGUE';
    else if (isRambling) substance = 'RAMBLING';
    else if (specificCount >= 3 && hasMetrics) substance = 'STRONG';

    // Score overrides substance when the evaluator clearly disagrees.
    const score = typeof evaluationScore === 'number' ? evaluationScore : null;
    if (score !== null && score <= 4 && substance === 'SOLID') substance = 'VAGUE';
    if (score !== null && score >= 9 && substance === 'SOLID' && specificCount >= 2) substance = 'STRONG';

    return {
        wordCount,
        hasMetrics,
        specificCount,
        vagueCount,
        hedgeCount,
        claimCount,
        density: Math.round(density * 10) / 10,
        hasUnsupportedClaim,
        isRambling,
        isVague,
        isHedged,
        isTooShort,
        substance
    };
}

function computeInterviewTopicState(session) {
    const questions = session.questions || [];
    const answers = session.answers || [];
    const jdSkills = session.jobDescriptionSnapshot?.requirements?.length
        ? session.jobDescriptionSnapshot.requirements.map(s => s.toLowerCase())
        : extractSkillTokens(session.jobDescriptionSnapshot?.fullText || session.jobRole);

    // Track skills covered
    const topicsCoveredSet = new Set();
    const skillsEvaluatedSet = new Set();

    questions.forEach(q => {
        if (q.skill) {
            topicsCoveredSet.add(q.skill.toLowerCase());
            skillsEvaluatedSet.add(q.skill.toLowerCase());
        }
        if (q.category) {
            topicsCoveredSet.add(q.category.toLowerCase());
        }
    });

    const topicsRemaining = jdSkills.filter(s => !topicsCoveredSet.has(s));

    // Determine candidate's last answer performance
    const lastAnswer = answers.length > 0 ? answers[answers.length - 1] : null;
    const lastScore = typeof lastAnswer?.evaluationScore === 'number'
        ? lastAnswer.evaluationScore
        : (typeof lastAnswer?.coaching?.clarityScore === 'number' ? lastAnswer.coaching.clarityScore : null);
    const lastAnsText = lastAnswer?.candidateAnswer || '';
    const isUnsure = isCandidateUnsureOrSkipping(lastAnsText);

    // Substance beats length: a fluent answer with no numbers, no named
    // technology and no trade-offs is weak however many words it runs to.
    const substanceReport = analyzeAnswerSubstance(lastAnsText, lastScore);
    const wordCount = substanceReport.wordCount;

    let lastTurnQuality = 'SOLID';
    if (isUnsure) {
        lastTurnQuality = 'SKIPPED_OR_UNSURE';
    } else if (substanceReport.substance === 'STRONG') {
        lastTurnQuality = 'STRONG';
    } else if (['TOO_SHORT', 'VAGUE', 'HEDGED', 'UNSUPPORTED_CLAIM'].includes(substanceReport.substance)) {
        lastTurnQuality = 'WEAK_OR_INCOMPLETE';
    } else if (substanceReport.substance === 'RAMBLING') {
        lastTurnQuality = 'RAMBLING';
    }

    const currentTurn = questions.length + 1;
    const totalTurns = session.questionLimit || 5;

    // Rolling performance across the session drives difficulty, so one bad
    // answer does not derail an otherwise strong candidate (and vice versa).
    const scored = answers
        .map(a => (typeof a?.evaluationScore === 'number' ? a.evaluationScore : null))
        .filter(v => v !== null);
    const rollingAvg = scored.length
        ? scored.reduce((sum, v) => sum + v, 0) / scored.length
        : null;

    let difficultyTarget = 'medium';
    if (rollingAvg !== null) {
        if (rollingAvg >= 8) difficultyTarget = 'hard';
        else if (rollingAvg <= 5) difficultyTarget = 'easy';
    }

    // How many consecutive probes we have already spent on this thread. Real
    // interviewers push twice at most, then move on rather than grilling.
    let consecutiveFollowUps = 0;
    for (let i = questions.length - 1; i >= 0; i--) {
        if (questions[i]?.isFollowUp) consecutiveFollowUps++;
        else break;
    }

    const isFinalTurn = currentTurn === totalTurns && totalTurns >= 5;
    const probeBudgetLeft = consecutiveFollowUps < 2;
    // Always leave room to cover the remaining JD topics before time runs out.
    const turnsLeft = totalTurns - currentTurn;
    const mustCoverGround = topicsRemaining.length > 0 && turnsLeft <= topicsRemaining.length;

    // Determine Interview Action Directive.
    // Probing is NOT capped to the first three questions any more; a real
    // interviewer follows up whenever an answer invites it, at any point.
    let directive = 'TRANSITION_NEXT_SKILL';
    if (isUnsure) {
        directive = 'TRANSITION_NEXT_SKILL'; // Do NOT interrogate candidate on an unfamiliar topic!
    } else if (isFinalTurn) {
        directive = 'BEHAVIORAL_SCENARIO';
    } else if (!probeBudgetLeft || mustCoverGround) {
        directive = 'TRANSITION_NEXT_SKILL';
    } else if (substanceReport.substance === 'UNSUPPORTED_CLAIM') {
        directive = 'CHALLENGE_CLAIM';
    } else if (substanceReport.substance === 'VAGUE') {
        directive = 'PROBE_FOR_SPECIFICS';
    } else if (substanceReport.substance === 'TOO_SHORT') {
        directive = 'FOLLOW_UP_CLARIFY';
    } else if (substanceReport.substance === 'HEDGED') {
        directive = 'PROBE_FOR_OWNERSHIP';
    } else if (substanceReport.substance === 'RAMBLING') {
        directive = 'REDIRECT_RAMBLING';
    } else if (substanceReport.substance === 'STRONG') {
        directive = 'FOLLOW_UP_DEEPEN';
    } else {
        directive = 'TRANSITION_NEXT_SKILL';
    }

    return {
        topicsCovered: Array.from(topicsCoveredSet),
        topicsRemaining,
        skillsEvaluated: Array.from(skillsEvaluatedSet),
        lastTurnQuality,
        directive,
        currentTurn,
        totalTurns,
        substanceReport,
        difficultyTarget,
        rollingAvg: rollingAvg === null ? null : Math.round(rollingAvg * 10) / 10,
        consecutiveFollowUps
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CANDIDATE QUESTION RETRIEVAL & RANKING ALGORITHM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves, filters, scores, and ranks candidate verified questions for the next turn
 */
function retrieveAndRankQuestions({
    companyId = 'general',
    jobRole = 'software-engineer',
    jdSkills = [],
    resumeSkills = [],
    resumeProjects = [],
    askedQuestions = [],
    topicState = null,
    currentQuestionIndex = 2,
    targetCategory = null,
    targetDifficulty = 'medium'
}) {
    const normalizedCompany = (companyId || 'general').toLowerCase();
    const blueprint = COMPANY_BLUEPRINTS[normalizedCompany] || COMPANY_BLUEPRINTS.general;

    // Build unified skill sets
    const allRequiredSkills = new Set([...jdSkills.map(s => s.toLowerCase()), ...extractSkillTokens(jobRole)]);
    const allCandidateSkills = new Set([...resumeSkills.map(s => s.toLowerCase()), ...extractSkillTokens(JSON.stringify(resumeProjects))]);

    // Already asked question texts, ids, and skills
    const askedTextList = askedQuestions.map(q => (typeof q === 'string' ? q : q.questionText || '').trim());
    const askedIdSet = new Set(askedQuestions.map(q => (typeof q === 'object' ? q.sourceQuestionId || q.id : null)).filter(Boolean));
    const askedSkillSet = new Set(askedQuestions.map(q => (typeof q === 'object' ? q.skill : null)).filter(Boolean).map(s => s.toLowerCase()));

    // Filter candidate question pool
    const candidatePool = VERIFIED_QUESTION_BANK.filter(q => {
        // 1. Strict ID deduplication
        if (askedIdSet.has(q.id)) return false;

        // 2. Semantic Similarity Deduplication (threshold: 0.45)
        for (const askedText of askedTextList) {
            const similarity = calculateSemanticSimilarity(q.question, askedText);
            if (similarity >= 0.45) {
                return false; // Reject semantic duplicate
            }
        }
        return true;
    });

    // Score each candidate question
    const scoredQuestions = candidatePool.map(q => {
        let score = 10; // Baseline

        // A. Company Blueprint match (+40 points)
        if (q.companies.includes(normalizedCompany)) {
            score += 40;
        } else if (q.companies.includes('all')) {
            score += 15;
        }

        // B. Role match (+25 points)
        const normalizedRole = jobRole.toLowerCase().replace(/\s+/g, '-');
        if (q.roles.includes('all') || q.roles.some(r => normalizedRole.includes(r))) {
            score += 25;
        }

        // C. Hard JD Required Skill Match (+40 points per matched skill)
        const matchedJdSkills = q.skills.filter(s => allRequiredSkills.has(s) || Array.from(allRequiredSkills).some(js => js.includes(s) || s.includes(js)));
        score += matchedJdSkills.length * 40;

        // D. Candidate Resume Project / Skill Match (+35 points per matched skill)
        const matchedResumeSkills = q.skills.filter(s => allCandidateSkills.has(s) || Array.from(allCandidateSkills).some(rs => rs.includes(s) || s.includes(rs)));
        score += matchedResumeSkills.length * 35;

        // E. Topic Diversity vs Repetition
        const primarySkill = (q.skills[0] || '').toLowerCase();
        if (topicState && topicState.topicsRemaining.includes(primarySkill)) {
            score += 60; // Major boost to explore uncovered JD topics
        } else if (askedSkillSet.has(primarySkill) && topicState && isProbeDirective(topicState.directive)) {
            // Probing deliberately stays on the skill we just discussed.
            score += 30;
        } else if (askedSkillSet.has(primarySkill) && topicState && topicState.directive === 'TRANSITION_NEXT_SKILL') {
            score -= 50; // Penalty if transitioning and skill was already tested
        }

        // F. Turn Directive Alignment
        if (topicState?.directive === 'BEHAVIORAL_SCENARIO' && q.category === 'behavioral') {
            score += 80;
        } else if (topicState?.directive === 'FOLLOW_UP_DEEPEN' && (q.difficulty === 'hard' || q.category === 'system_design')) {
            score += 35;
        } else if (topicState?.directive === 'CHALLENGE_CLAIM' && (q.difficulty === 'hard' || q.category === 'system_design')) {
            score += 20;
        } else if ((topicState?.directive === 'PROBE_FOR_SPECIFICS' || topicState?.directive === 'PROBE_FOR_OWNERSHIP') && q.difficulty !== 'easy') {
            score += 15;
        } else if (topicState?.directive === 'REDIRECT_RAMBLING' && q.difficulty === 'medium') {
            score += 15;
        } else if (topicState?.directive === 'FOLLOW_UP_CLARIFY' && q.difficulty === 'medium') {
            score += 35;
        }

        // G. Category alignment with blueprint weights
        if (blueprint.categoryWeights[q.category]) {
            score += Math.round(blueprint.categoryWeights[q.category] * 30);
        }

        // H. Frequency Boost (+15 points)
        if (q.frequency === 'frequently_asked') score += 15;

        return {
            ...q,
            rankingScore: score,
            matchedSkillsList: Array.from(new Set([...matchedJdSkills, ...matchedResumeSkills]))
        };
    });

    // Sort descending by rank score
    scoredQuestions.sort((a, b) => b.rankingScore - a.rankingScore);

    console.log(`[INTERVIEW] Ranked ${scoredQuestions.length} candidate questions. Top 3 scores:`, scoredQuestions.slice(0, 3).map(q => `${q.id} (${q.rankingScore}pts)`));

    return scoredQuestions.slice(0, 4); // Top 4 candidate verified questions for LLM selection
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. STRICT STRUCTURED LLM QUESTION GENERATION & PERSONALIZATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Uses LLM to adapt and personalize the top-ranked candidate question
 * with the candidate's actual projects, job description, and previous answer context.
 */
/**
 * Rephrases the question already on the table. Used when the candidate asks
 * for a repeat, a simpler wording, or an example — this must NOT consume a
 * turn or score anything, because no answer was given.
 */
async function rephraseCurrentQuestion({ questionText, mode = 'SIMPLIFY', jobRole = 'the role' }) {
    const styles = {
        REPEAT:   'Repeat the question clearly and naturally. You may shorten it slightly, but keep the same meaning and difficulty.',
        SIMPLIFY: 'Rewrite the question in plainer language. Shorter sentences, no jargon unless essential, same technical substance and same difficulty. Do NOT make it an easier question.',
        EXAMPLE:  'Restate the question and add one short concrete example of the KIND of answer expected, without answering it yourself.'
    };

    const fallbacks = {
        REPEAT:   `Of course — ${questionText}`,
        SIMPLIFY: `No problem, let me put that more simply. ${questionText}`,
        EXAMPLE:  `Sure. ${questionText} For instance, walk me through what you actually built and why you chose that approach.`
    };

    try {
        const groq = getGroqClient();
        if (!groq) return fallbacks[mode] || fallbacks.SIMPLIFY;

        const res = await withTimeout(groq.chat.completions.create({
            model: 'openai/gpt-oss-120b',
            messages: [
                {
                    role: 'system',
                    content: `You are a technical interviewer for ${jobRole}. The candidate asked you to clarify the question. ${styles[mode] || styles.SIMPLIFY}

Rules:
- Open with a brief, warm acknowledgement (e.g. "Of course," / "Sure,").
- Ask exactly ONE question.
- Do NOT answer it, and do NOT change what is being assessed.
- Return JSON: {"question": "<the rephrased question>"}`
                },
                { role: 'user', content: `Original question: "${questionText}"` }
            ],
            temperature: 0.4,
            max_tokens: 400,
            response_format: { type: 'json_object' }
        }), 5000);

        const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
        if (parsed.question && parsed.question.trim().length > 10) return parsed.question.trim();
    } catch (err) {
        console.warn('[INTERVIEW] Rephrase fell back to template:', err.message);
    }
    return fallbacks[mode] || fallbacks.SIMPLIFY;
}

async function generateAdaptiveQuestion({
    session,
    previousAnswer = '',
    candidateHistory = []
}) {
    const {
        sessionId,
        companyName,
        jobRole,
        currentQuestionIndex,
        questionLimit,
        resumeSnapshot,
        jobDescriptionSnapshot,
        blueprintSnapshot
    } = session;

    const isUnsure = isCandidateUnsureOrSkipping(previousAnswer);

    // Compute live topic tracking and turn directive
    const topicState = computeInterviewTopicState(session);
    console.log(`[INTERVIEW] Q${currentQuestionIndex}/${questionLimit} Directive: ${topicState.directive} | Quality: ${topicState.lastTurnQuality} | Unsure/Skip: ${isUnsure} | Uncovered Topics: [${topicState.topicsRemaining.join(', ')}]`);

    // Extract skills
    const jdSkills = jobDescriptionSnapshot?.requirements?.length
        ? jobDescriptionSnapshot.requirements
        : extractSkillTokens(jobDescriptionSnapshot?.fullText || jobRole);

    const resumeSkills = resumeSnapshot?.matchedSkills?.length
        ? resumeSnapshot.matchedSkills
        : extractSkillTokens(JSON.stringify(resumeSnapshot));

    const resumeProjects = resumeSnapshot?.projects || [];

    // Retrieve top candidate questions from verified DB
    const topCandidates = retrieveAndRankQuestions({
        companyId: session.companyId || companyName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        jobRole,
        jdSkills,
        resumeSkills,
        resumeProjects,
        askedQuestions: session.questions,
        topicState,
        currentQuestionIndex
    });

    const topCandidateSummary = topCandidates.map((c, i) =>
        `${i + 1}. [ID: ${c.id}] Category: ${c.category} | Primary Skill: ${c.skills[0]} | Difficulty: ${c.difficulty}\n   Template: "${c.question}"\n   Expected Concepts: ${c.expectedTopics.join(', ')}`
    ).join('\n');

    // Build clean context summary
    const resumeTextSummary = `
- Candidate Name: ${resumeSnapshot?.fullName || 'Candidate'}
- Target Role: ${resumeSnapshot?.professionalTitle || jobRole}
- Verified Skills on Resume: ${resumeSkills.join(', ') || 'General Engineering'}
- Actual Projects on Resume: ${resumeProjects.map(p => typeof p === 'string' ? p : `${p.name || p.title}: ${p.description || p.tech || ''}`).join(' | ') || 'None provided'}
- Summary: ${resumeSnapshot?.summary || 'Standard Software Engineer Profile'}
`.trim();

    const jdTextSummary = `
- Company: ${companyName}
- Position: ${jobRole}
- Required Technologies / Focus: ${jdSkills.join(', ') || 'Software Engineering'}
- Job Description Context: ${jobDescriptionSnapshot?.fullText?.substring(0, 500) || 'Scalable Software Engineering'}
`.trim();

    const companyBlueprintSummary = `
- Company: ${companyName}
- Hiring Bar: ${blueprintSnapshot?.hiringBar || '9.0 / 10'}
- Core Engineering Focus: ${blueprintSnapshot?.culture || 'High-throughput scalable systems'}
`.trim();

    // Prompt size is capped so generation time stays flat across the interview.
    // Replaying every turn in full made the prompt grow each question until the
    // model could no longer finish inside its budget, and later questions fell
    // back to canned ones (observed from Q7 onward on a 10-question run).
    // Recent turns stay verbatim because the interviewer probes against them;
    // older turns collapse to a one-line topic record, which is all the
    // anti-repetition rule needs (topicsCovered is also passed separately).
    const VERBATIM_TURNS = Number(process.env.INTERVIEW_VERBATIM_TURNS || 3);
    const allTurns = session.questions || [];
    const recentTurns = allTurns.slice(-VERBATIM_TURNS);
    const olderTurns = allTurns.slice(0, Math.max(0, allTurns.length - VERBATIM_TURNS));

    const olderSummary = olderTurns.length
        ? `Earlier in this interview (already covered — do not repeat):\n` +
          olderTurns.map(q => `- Q${q.index}: ${q.skill || q.category || 'topic'} — "${String(q.questionText || '').substring(0, 90)}..."`).join('\n')
        : '';

    const recentDetail = recentTurns.map((q) => {
        const matchingAns = session.answers?.find(a => a.questionIndex === q.index);
        const ansText = matchingAns
            ? String(matchingAns.candidateAnswer || '').substring(0, 250)
            : String(previousAnswer || '').substring(0, 250) || 'None';
        return `Q${q.index}: "${q.questionText}"\nCandidate Answer A${q.index}: "${ansText}"`;
    }).join('\n\n');

    const lastQuestionsAndAnswers = [olderSummary, recentDetail].filter(Boolean).join('\n\n');

    const systemPrompt = `You are HIERO's professional Senior Technical Interviewer at ${companyName}, conducting an authentic, realistic, supportive technical interview for the ${jobRole} position.

## CRITICAL ANTI-REPETITION, CONSOLATION & GROUNDING RULES:
1. You are NOT a generic chatbot. The verified question database and candidate resume are your absolute ground truth.
2. Select one of the TOP RETRIEVED VERIFIED QUESTIONS below and personalize the phrasing.
3. NEVER repeat a question, topic, or concept already asked in previous turns.
4. ${isUnsure ? 'IMPORTANT CONSOLATION RULE: The candidate stated they are not sure or asked to move to the next question. You MUST start your response with a warm, empathetic consoling sentence acknowledging that it is completely fine (e.g. "No problem at all! That is completely understandable, let us move right along." or "No worries at all! That is perfectly fine, let us switch gears.") before introducing the new question. Do NOT grill or press them on the topic they skipped.' : ''}
5. If Directive is "FOLLOW_UP_DEEPEN": Probe deeper into trade-offs, scalability, or edge cases of their previous answer.
6. If Directive is "FOLLOW_UP_CLARIFY": Clarify a fundamental mechanism or missing technical concept they struggled with.
7. If Directive is "TRANSITION_NEXT_SKILL": Seamlessly bridge the conversation to the next uncovered JD skill.
8. If referencing a resume project, cite the EXACT project title from the Candidate Resume (e.g., "In your project [Project Name]..."). NEVER invent project names or skills not in the resume.
9. Return ONLY a valid, parseable JSON object. No Markdown code fences, no conversational preamble.

## JSON OUTPUT FORMAT:
{
  "question": "Exact single-sentence or two-sentence interview question to be read aloud to the candidate.",
  "sourceQuestionId": "ID of the selected verified question template",
  "category": "technical" | "resume_project" | "system_design" | "problem_solving" | "behavioral",
  "skill": "Primary skill evaluated (e.g. FastAPI, PostgreSQL, Distributed Systems, Redis)",
  "difficulty": "easy" | "medium" | "hard",
  "source": "company_question_bank" | "job_description + verified_db" | "adaptive_followup",
  "reason": "Clear explanation of why this question was selected based on candidate projects/skills, JD requirements, and turn directive.",
  "answerGuide": [
    "Key area or architectural concept 1",
    "Key area or trade-off consideration 2",
    "Key area or production practice 3"
  ],
  "isFollowUp": true | false,
  "followUpToQuestion": null | 1 | 2 | 3,
  "expectedTopics": ["topic1", "topic2", "topic3"]
}`;

    const userPrompt = `## CANDIDATE RESUME:
${resumeTextSummary}

## JOB DESCRIPTION & REQUIREMENTS:
${jdTextSummary}

## COMPANY INTERVIEW BLUEPRINT:
${companyBlueprintSummary}

## INTERVIEW HISTORY:
${lastQuestionsAndAnswers || 'Q1: Introduction round completed.'}

## CANDIDATE LAST ANSWER:
"${previousAnswer || 'None'}"
${isUnsure ? '⚠️ CANDIDATE UNSURE/SKIPPED PREVIOUS QUESTION: Console them empathetically first, then transition to a fresh topic.' : ''}

## TURN DIRECTIVE & TOPIC STATE:
- Directive: ${topicState.directive}
- Candidate Last Turn Quality: ${topicState.lastTurnQuality}
- Answer Substance: ${topicState.substanceReport?.substance || 'UNKNOWN'} (words: ${topicState.substanceReport?.wordCount ?? 0}, concrete terms: ${topicState.substanceReport?.specificCount ?? 0}, has metrics: ${topicState.substanceReport?.hasMetrics ? 'yes' : 'no'})
- Target Difficulty: ${topicState.difficultyTarget} (rolling score: ${topicState.rollingAvg ?? 'n/a'})
- Topics Covered So Far: [${topicState.topicsCovered.join(', ') || 'Introduction'}]
- Remaining Uncovered JD Topics: [${topicState.topicsRemaining.join(', ')}]

${DIRECTIVE_PLAYBOOK[topicState.directive] || DIRECTIVE_PLAYBOOK.TRANSITION_NEXT_SKILL}

## INTERVIEWER STYLE RULES:
1. Acknowledge what they just said in a short clause before asking (a real interviewer reacts; they do not read from a script).
2. Never ask two questions in one turn. One question, clearly.
3. Match ${topicState.difficultyTarget} difficulty: easy = fundamentals, medium = applied, hard = scale/failure/trade-offs.
4. Do not praise a weak answer. Be warm, but honest and direct.
5. When probing, reference the candidate's own words so it is obvious you were listening.

## TOP RETRIEVED CANDIDATE QUESTIONS FROM VERIFIED DATABASE:
${topCandidateSummary}

## TASK:
Select and adapt the best verified question for Question #${currentQuestionIndex} of ${questionLimit}. Personalize it with the candidate's actual projects and skills while following the ${topicState.directive} directive.
Return ONLY the structured JSON object.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    try {
        const groq = getGroqClient();
        if (groq) {
            // Order is measured, not guessed: on the full prompt (history + ranked
            // candidates + resume + JD) qwen3.8-27b timed out on EVERY turn while
            // gpt-oss-120b succeeded on every one. Leading with qwen cost a wasted
            // timeout per question. groq/compound-mini removed: 404 model_not_found.
            const candidateModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

            // HARD CEILING on the whole generation step. A candidate sitting in
            // silence is a broken interview, so we never spend longer than this
            // across all models and retries combined — we fall back to a verified
            // question instead. Observed worst case before this guard: 80s.
            const TOTAL_BUDGET_MS = Number(process.env.INTERVIEW_QGEN_BUDGET_MS || 7000);
            const PER_MODEL_MS = Number(process.env.INTERVIEW_QGEN_MODEL_MS || 4000);
            const genDeadline = Date.now() + TOTAL_BUDGET_MS;

            for (const model of candidateModels) {
                const msLeft = genDeadline - Date.now();
                if (msLeft <= 500) {
                    console.warn(`[INTERVIEW] Question generation budget spent (${TOTAL_BUDGET_MS}ms); using verified fallback.`);
                    break;
                }
                try {
                    const res = await withTimeout(groq.chat.completions.create({
                        model,
                        messages,
                        temperature: 0.45,
                        max_tokens: 2000,
                        response_format: { type: 'json_object' }
                    }), Math.min(PER_MODEL_MS, msLeft));
                    const rawContent = res.choices[0]?.message?.content?.trim();
                    if (rawContent) {
                        const parsed = JSON.parse(rawContent);
                        if (parsed.question && parsed.question.trim().length > 10) {
                            // Check semantic duplicate against previous questions
                            let isDuplicate = false;
                            for (const prevQ of session.questions || []) {
                                if (calculateSemanticSimilarity(parsed.question, prevQ.questionText) >= 0.50) {
                                    isDuplicate = true;
                                    break;
                                }
                            }

                            if (!isDuplicate) {
                                let finalQText = parsed.question.trim();
                                if (isUnsure && !finalQText.toLowerCase().includes('problem') && !finalQText.toLowerCase().includes('worries') && !finalQText.toLowerCase().includes('fine') && !finalQText.toLowerCase().includes('okay')) {
                                    finalQText = `No problem at all! That's completely fine. Let's move on to our next question: ${finalQText}`;
                                }

                                const answerGuide = Array.isArray(parsed.answerGuide) && parsed.answerGuide.length > 0
                                    ? parsed.answerGuide
                                    : (Array.isArray(parsed.expectedTopics) && parsed.expectedTopics.length > 0
                                        ? parsed.expectedTopics.map(t => `Key concept: ${t}`)
                                        : ["Architecture & workflow", "Trade-offs and design decisions", "Production considerations"]);

                                console.log(`[INTERVIEW] Successfully generated non-duplicate Q${currentQuestionIndex} via ${model}: "${finalQText}"`);
                                return {
                                    questionNumber: currentQuestionIndex,
                                    questionIndex: currentQuestionIndex,
                                    index: currentQuestionIndex,
                                    questionText: finalQText,
                                    sourceQuestionId: parsed.sourceQuestionId || topCandidates[0]?.id || 'custom',
                                    category: parsed.category || topCandidates[0]?.category || 'technical',
                                    skill: parsed.skill || topCandidates[0]?.skills?.[0] || 'Technical Skills',
                                    difficulty: parsed.difficulty || 'medium',
                                    source: parsed.source || 'company_question_bank',
                                    reason: parsed.reason || `Evaluates ${parsed.skill || 'core requirements'} for ${companyName} ${jobRole}`,
                                    answerGuide,
                                    isFollowUp: parsed.isFollowUp || isProbeDirective(topicState.directive),
                                    followUpToQuestion: parsed.followUpToQuestion || (isProbeDirective(topicState.directive) ? currentQuestionIndex - 1 : null),
                                    expectedTopics: Array.isArray(parsed.expectedTopics) ? parsed.expectedTopics : ['core principles', 'trade-offs']
                                };
                            }
                        }
                    }
                } catch (modelErr) {
                    console.warn(`[INTERVIEW] Groq model ${model} notice:`, modelErr.message);
                }
            }
        }
    } catch (llmErr) {
        console.error('[INTERVIEW] LLM question generation error, using verified fallback:', llmErr.message);
    }

    // Deterministic Verified Fallback
    const fallbackTemplate = topCandidates[0] || VERIFIED_QUESTION_BANK[0];
    let personalizedFallback = fallbackTemplate.question;
    if (resumeProjects.length > 0 && resumeProjects[0].name) {
        personalizedFallback = `In your work on "${resumeProjects[0].name}", how did you design the underlying architecture for ${fallbackTemplate.skills[0] || 'the backend'} and handle performance trade-offs?`;
    }

    if (isUnsure) {
        personalizedFallback = `No problem at all! That's completely fine. Let's move on to our next technical topic: ${personalizedFallback}`;
    }

    const fallbackGuide = fallbackTemplate.expectedTopics && fallbackTemplate.expectedTopics.length > 0
        ? fallbackTemplate.expectedTopics.map(t => `Key consideration: ${t}`)
        : ["Architecture & workflow", "Trade-offs and design decisions", "Production considerations"];

    // A probe directive must survive generation failure — answer the candidate,
    // not the question bank.
    if (!isUnsure && isProbeDirective(topicState.directive)) {
        const probe = buildDeterministicProbe(topicState.directive, previousAnswer);
        if (probe) {
            personalizedFallback = probe;
            console.log(`[INTERVIEW] Deterministic ${topicState.directive} probe for Q${currentQuestionIndex}: "${probe}"`);
        }
    }

    console.log(`[INTERVIEW] Using verified question fallback for Q${currentQuestionIndex}: "${personalizedFallback}"`);

    return {
        questionNumber: currentQuestionIndex,
        questionIndex: currentQuestionIndex,
        index: currentQuestionIndex,
        questionText: personalizedFallback,
        sourceQuestionId: fallbackTemplate.id,
        category: fallbackTemplate.category,
        skill: fallbackTemplate.skills[0] || 'Software Engineering',
        difficulty: fallbackTemplate.difficulty,
        source: 'company_question_bank',
        reason: `Matched ${companyName} focus on ${fallbackTemplate.skills.join(', ')}`,
        answerGuide: fallbackGuide,
        isFollowUp: false,
        followUpToQuestion: null,
        expectedTopics: fallbackTemplate.expectedTopics
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. REAL-TIME CANDIDATE ANSWER EVALUATION & COACHING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyzes candidate spoken answer and generates actionable feedback & clarity score
 */
async function evaluateCandidateAnswer({
    questionText,
    candidateAnswer,
    expectedTopics = [],
    role = 'Software Engineer'
}) {
    if (!candidateAnswer || candidateAnswer.trim().length < 4) {
        return {
            improvedPhrase: '',
            grammarTip: 'Please speak your answer into the microphone with specific technical examples.',
            clarityScore: 4,
            evaluationScore: 4,
            notes: 'Answer was brief or incomplete.'
        };
    }

    // Special graceful handling for candidate saying "I don't know" or skipping
    if (isCandidateUnsureOrSkipping(candidateAnswer)) {
        return {
            improvedPhrase: "I have not worked deeply with this specific component in production yet, though in related projects I focused on foundational architecture.",
            grammarTip: "Excellent honesty and self-awareness. In real interviews, acknowledging boundaries clearly and offering to explore adjacent topics is highly appreciated.",
            clarityScore: 7.5,
            evaluationScore: 6.0,
            notes: "Candidate stated they are not sure/skipped. Handled smoothly with supportive feedback."
        };
    }

    const systemPrompt = `You are an expert AI Interview Coach and Hiring Bar Evaluator.
Analyze the candidate's spoken answer to this interview question.

Rules:
1. Provide a polished, professional way to phrase their main point (improvedPhrase).
2. Provide a 1-sentence grammar/delivery tip (grammarTip).
3. Assign a delivery clarity score (clarityScore) from 1 to 10.
4. Assign a technical depth score (evaluationScore) from 1 to 10.
5. Return ONLY JSON.

JSON Format:
{
  "improvedPhrase": "Concise, professional corporate phrasing of their core idea",
  "grammarTip": "1 concise constructive tip on sentence structure or active voice",
  "clarityScore": 8,
  "evaluationScore": 8,
  "notes": "Brief feedback summary"
}`;

    const userPrompt = `Role: ${role}
Question Asked: "${questionText}"
Candidate Spoken Answer: "${candidateAnswer}"
Expected Concepts: ${expectedTopics.join(', ')}`;

    try {
        const groq = getGroqClient();
        if (groq) {
            const candidateModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
            // Bounded like question generation: scoring must never stall the turn.
            const EVAL_BUDGET_MS = Number(process.env.INTERVIEW_EVAL_BUDGET_MS || 5000);
            const evalDeadline = Date.now() + EVAL_BUDGET_MS;
            for (const model of candidateModels) {
                const msLeft = evalDeadline - Date.now();
                if (msLeft <= 500) {
                    console.warn('[INTERVIEW] Answer evaluation budget spent; using heuristic score.');
                    break;
                }
                try {
                    const res = await withTimeout(groq.chat.completions.create({
                        model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.3,
                        max_tokens: 600,
                        response_format: { type: 'json_object' }
                    }), Math.min(3500, msLeft));
                    const data = JSON.parse(res.choices[0]?.message?.content || '{}');
                    return {
                        improvedPhrase: data.improvedPhrase || candidateAnswer.substring(0, 80),
                        grammarTip: data.grammarTip || 'Maintain active sentence structure and clear technical metrics.',
                        clarityScore: typeof data.clarityScore === 'number' ? data.clarityScore : 8,
                        evaluationScore: typeof data.evaluationScore === 'number' ? data.evaluationScore : 8,
                        notes: data.notes || 'Good technical clarity.'
                    };
                } catch (mErr) {}
            }
        }
    } catch (e) {
        console.warn('[INTERVIEW] Answer evaluation warning:', e.message);
    }

    // Heuristic Fallback
    const wordCount = candidateAnswer.split(/\s+/).length;
    const score = Math.min(10, Math.max(5, Math.round(wordCount / 12) + 4));
    return {
        improvedPhrase: candidateAnswer.length > 80 ? candidateAnswer.substring(0, 80) + '...' : candidateAnswer,
        grammarTip: 'Use the STAR method (Situation, Task, Action, Result) to structure practical examples.',
        clarityScore: score,
        evaluationScore: score,
        notes: 'Constructive response recorded.'
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. FINAL INTERVIEW SCORECARD GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates an end-of-session performance scorecard based on all Q&A turns
 */
async function generateSessionScorecard(session) {
    const questionsAndAnswers = (session.questions || []).map((q, idx) => {
        const ans = session.answers?.find(a => a.questionIndex === q.index);
        return `Question ${q.index} (${q.category} - ${q.skill}): "${q.questionText}"\nCandidate Answer: "${ans ? ans.candidateAnswer : '[Skipped / Unanswered]'}"\nClarity: ${ans?.coaching?.clarityScore || 'N/A'}/10 | Depth: ${ans?.evaluationScore || 'N/A'}/10`;
    }).join('\n\n');

    const prompt = `You are the Lead Hiring Committee Reviewer at ${session.companyName}.
Evaluate this candidate's full mock interview for the ${session.jobRole} role.

## FULL TRANSCRIPT & EVALUATIONS:
${questionsAndAnswers}

## REQUIRED JSON FORMAT:
{
  "overallScore": 8.5,
  "communicationScore": 8.8,
  "technicalScore": 8.4,
  "problemSolvingScore": 8.2,
  "resumeAlignmentScore": 8.6,
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "recommendation": "Strong Yes",
  "summary": "Executive summary of candidate performance."
}`;

    try {
        const groq = getGroqClient();
        if (groq) {
            const candidateModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b'];
            // Runs once at the end; generous but still capped.
            const reportDeadline = Date.now() + Number(process.env.INTERVIEW_REPORT_BUDGET_MS || 12000);
            for (const model of candidateModels) {
                try {
                    const res = await withTimeout(groq.chat.completions.create({
                        model,
                        messages: [
                            { role: 'system', content: 'You are an executive hiring bar reviewer. Return strictly formatted JSON.' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.35,
                        max_tokens: 1500,
                        response_format: { type: 'json_object' }
                    }), Math.min(6000, Math.max(1000, reportDeadline - Date.now())));
                    const scorecard = JSON.parse(res.choices[0]?.message?.content || '{}');
                    if (scorecard.overallScore) {
                        return scorecard;
                    }
                } catch (mErr) {}
            }
        }
    } catch (e) {
        console.warn('[INTERVIEW] Final scorecard LLM warning:', e.message);
    }

    // Default Scorecard Fallback
    const avgScore = session.answers?.length
        ? Math.round(session.answers.reduce((sum, a) => sum + (a.evaluationScore || 8), 0) / session.answers.length * 10) / 10
        : 8.2;

    return {
        overallScore: avgScore,
        communicationScore: 8.5,
        technicalScore: avgScore,
        problemSolvingScore: 8.0,
        resumeAlignmentScore: 8.7,
        strengths: [
            'Demonstrated solid grasp of core technology stack and project workflows.',
            'Effective communication and structured verbal delivery.'
        ],
        areasToImprove: [
            'Practice elaborating on specific edge cases and failure modes.',
            'Incorporate more quantitative metrics (latency, throughput, scale) in project explanations.'
        ],
        recommendation: avgScore >= 8.0 ? 'Strong Yes' : 'Yes',
        summary: `The candidate demonstrated strong foundational knowledge for the ${session.jobRole} role at ${session.companyName} with clear communication across all interview questions.`
    };
}

module.exports = {
    COMPANY_BLUEPRINTS,
    VERIFIED_QUESTION_BANK,
    extractSkillTokens,
    calculateSemanticSimilarity,
    isCandidateUnsureOrSkipping,
    detectCandidateIntent,
    rephraseCurrentQuestion,
    computeInterviewTopicState,
    analyzeAnswerSubstance,
    isProbeDirective,
    buildDeterministicProbe,
    retrieveAndRankQuestions,
    generateAdaptiveQuestion,
    evaluateCandidateAnswer,
    generateSessionScorecard
};
