const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const realSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// File-backed local store for zero-downtime resilience before SQL migrations are applied in Supabase dashboard
const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'local_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_WF_ID = '00000000-0000-0000-0000-000000000002';

const loadStore = () => {
  let initial = null;
  if (fs.existsSync(DATA_FILE)) {
    try {
      initial = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
      // ignore
    }
  }
  const s = initial || {
    profiles: [],
    users: [],
    workflows: [],
    tasks: [],
    agent_logs: [],
    workflow_events: [],
    approvals: [],
  };

  // Ensure default demo profile exists with verified 'password123' hash
  const DEMO_PW_HASH = '$2a$10$iwg3g/aJ0lbdDQUt5RdiVOZV1zdXKLHxBoMCZKmb3CmVlFHm34AQG';
  if (!s.profiles) s.profiles = [];
  const existingDemo = s.profiles.find(p => p.email === 'demo@workflowx.ai');
  if (!existingDemo) {
    s.profiles.push({
      id: DEMO_USER_ID,
      name: 'Demo Administrator',
      email: 'demo@workflowx.ai',
      password_hash: DEMO_PW_HASH,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  } else {
    // Keep hash valid
    existingDemo.password_hash = DEMO_PW_HASH;
  }

  // Ensure default demo workflow exists
  if (!s.workflows) s.workflows = [];
  if (!s.workflows.some(w => w.id === DEMO_WF_ID)) {
    s.workflows.push({
      id: DEMO_WF_ID,
      title: 'A customer was charged for an order, but the order was not created.',
      description: 'Customer was billed $129.00 on Stripe (txn_89410). Payment succeeded, but the downstream order creation queue timed out. The customer submitted an urgent complaint.',
      department: 'Billing & Fulfillment',
      status: 'ready',
      priority: 'HIGH',
      business_impact: 'High customer churn risk & potential payment dispute',
      health_score: 95,
      created_by: DEMO_USER_ID,
      ai_analysis: {
        summary: 'Payment transaction was charged successfully, but downstream order record was not generated due to an asynchronous timeout.',
        category: 'Billing & Fulfillment',
        priority: 'HIGH',
        confidence: 0.96,
        recommendations: [
          'Verify Stripe charge transaction ID',
          'Inspect database transaction logs for uncommitted order items',
          'Execute customer refund or manual order recreation based on stock',
        ],
      },
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (!s.tasks) s.tasks = [];
    s.tasks.push(
      {
        id: '00000000-0000-0000-0000-000000000011',
        workflow_id: DEMO_WF_ID,
        title: 'Verify Payment Gateway Transaction',
        description: 'Check Stripe charge status, capture token, and verify payment legitimacy.',
        assigned_agent: 'Execution Agent',
        status: 'completed',
        priority: 'HIGH',
        task_order: 1,
        created_at: new Date(Date.now() - 3000000).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000012',
        workflow_id: DEMO_WF_ID,
        title: 'Inspect Order Database Records',
        description: 'Search order fulfillment repository for orphan cart or uncommitted transactions.',
        assigned_agent: 'Coordination Agent',
        status: 'completed',
        priority: 'HIGH',
        task_order: 2,
        created_at: new Date(Date.now() - 2500000).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000013',
        workflow_id: DEMO_WF_ID,
        title: 'Simulate Warehouse Stock & Order Dispatch',
        description: 'Attempt inventory reservation and trigger dispatch pipeline.',
        assigned_agent: 'Execution Agent',
        status: 'in_progress',
        priority: 'HIGH',
        task_order: 3,
        created_at: new Date(Date.now() - 2000000).toISOString(),
      },
      {
        id: '00000000-0000-0000-0000-000000000014',
        workflow_id: DEMO_WF_ID,
        title: 'Telemetry & SLA Breach Watcher',
        description: 'Monitor dispatch response latency and detect unexpected exceptions.',
        assigned_agent: 'Monitoring Agent',
        status: 'in_progress',
        priority: 'MEDIUM',
        task_order: 4,
        created_at: new Date(Date.now() - 1500000).toISOString(),
      }
    );

    if (!s.approvals) s.approvals = [];
    s.approvals.push({
      id: '00000000-0000-0000-0000-000000000021',
      workflow_id: DEMO_WF_ID,
      action_type: 'refund_customer',
      reason: 'Payment was charged but downstream order record was not generated.',
      ai_recommendation: 'Authorize customer refund ($129.00) to maintain high customer satisfaction.',
      status: 'pending',
      created_at: new Date(Date.now() - 1000000).toISOString(),
    });
  }

  return s;
};

const store = loadStore();

const saveStore = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save local store:', err.message);
  }
};

/**
 * Local Query Builder implementing Supabase PostgREST chaining API
 */
class LocalQueryBuilder {
  constructor(table) {
    this.table = table;
    if (!store[table]) store[table] = [];
    this.filters = [];
    this.orderConfig = null;
    this.limitCount = null;
    this.isSingle = false;
    this.action = 'select';
    this.actionPayload = null;
  }

  select() {
    if (this.action !== 'insert' && this.action !== 'update') {
      this.action = 'select';
    }
    return this;
  }

  insert(payload) {
    this.action = 'insert';
    this.actionPayload = payload;
    return this;
  }

  update(payload) {
    this.action = 'update';
    this.actionPayload = payload;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(col, val) {
    this.filters.push((row) => row[col] === val);
    return this;
  }

  neq(col, val) {
    this.filters.push((row) => row[col] !== val);
    return this;
  }

  in(col, vals) {
    const set = new Set(vals);
    this.filters.push((row) => set.has(row[col]));
    return this;
  }

  is(col, val) {
    this.filters.push((row) => row[col] === val);
    return this;
  }

  order(col, { ascending = true } = {}) {
    this.orderConfig = { col, ascending };
    return this;
  }

  limit(n) {
    this.limitCount = n;
    return this;
  }

  range(from, to) {
    this.rangeFrom = Number(from);
    this.rangeTo = Number(to);
    return this;
  }

  gte(col, val) {
    this.filters.push((row) => row[col] >= val);
    return this;
  }

  lte(col, val) {
    this.filters.push((row) => row[col] <= val);
    return this;
  }

  gt(col, val) {
    this.filters.push((row) => row[col] > val);
    return this;
  }

  lt(col, val) {
    this.filters.push((row) => row[col] < val);
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  async execute() {
    let rows = [...(store[this.table] || [])];

    if (this.action === 'insert') {
      const items = Array.isArray(this.actionPayload) ? this.actionPayload : [this.actionPayload];
      const inserted = items.map((item) => {
        const id = item.id || uuidv4();
        const now = new Date().toISOString();
        const record = {
          ...item,
          id,
          created_at: item.created_at || now,
          updated_at: item.updated_at || now,
        };
        store[this.table].push(record);
        return record;
      });
      saveStore();
      const resData = Array.isArray(this.actionPayload) ? inserted : inserted[0];
      return { data: resData, error: null };
    }

    // Apply filters
    for (const filter of this.filters) {
      rows = rows.filter(filter);
    }

    if (this.action === 'update') {
      const now = new Date().toISOString();
      const updated = rows.map((r) => {
        Object.assign(r, this.actionPayload, { updated_at: now });
        return { ...r };
      });
      saveStore();
      return { data: this.isSingle ? updated[0] || null : updated, error: null };
    }

    if (this.action === 'delete') {
      const deleteIds = new Set(rows.map((r) => r.id));
      store[this.table] = store[this.table].filter((r) => !deleteIds.has(r.id));
      saveStore();
      return { data: rows, error: null };
    }

    // Sort
    if (this.orderConfig) {
      const { col, ascending } = this.orderConfig;
      rows.sort((a, b) => {
        if (a[col] < b[col]) return ascending ? -1 : 1;
        if (a[col] > b[col]) return ascending ? 1 : -1;
        return 0;
      });
    }

    // Limit & Range
    if (this.rangeFrom !== undefined && this.rangeTo !== undefined) {
      rows = rows.slice(this.rangeFrom, this.rangeTo + 1);
    } else if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    if (this.isSingle) {
      return { data: rows[0] || null, error: null };
    }

    return { data: rows, error: null };
  }

  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

/**
 * Resilient Supabase Client Wrapper
 * Tries cloud Supabase first. If table is not yet in schema cache (PGRST205 / 42P01) or network fails,
 * transparently switches to the local store and remembers it so subsequent queries are instant.
 */
let hasLoggedFallback = false;
const fallbackTables = new Set();

const supabase = {
  ...realSupabase,
  from(table) {
    if (fallbackTables.has(table)) {
      return new LocalQueryBuilder(table);
    }

    const recordedCalls = [];
    const createProxy = (target) => {
      return new Proxy(target, {
        get(t, prop, receiver) {
          if (prop === 'then') {
            return function (onFulfilled, onRejected) {
              return t.then((result) => {
                if (result && result.error && (result.error.code === 'PGRST205' || result.error.code === '42P01' || result.error.message?.includes('relation') || result.error.message?.includes('schema cache'))) {
                  fallbackTables.add(table);
                  if (!hasLoggedFallback) {
                    console.log(`[Supabase Notice] Cloud table '${table}' not found in schema cache. Using resilient local storage.`);
                    hasLoggedFallback = true;
                  }
                  const local = new LocalQueryBuilder(table);
                  for (const call of recordedCalls) {
                    if (typeof local[call.method] === 'function') {
                      local[call.method](...call.args);
                    }
                  }
                  return local.execute().then(onFulfilled, onRejected);
                }
                return onFulfilled ? onFulfilled(result) : result;
              }).catch((err) => {
                fallbackTables.add(table);
                if (!hasLoggedFallback) {
                  console.log(`[Supabase Notice] Cloud connection for '${table}' failed (${err?.message || 'offline'}). Using resilient local storage.`);
                  hasLoggedFallback = true;
                }
                const local = new LocalQueryBuilder(table);
                for (const call of recordedCalls) {
                  if (typeof local[call.method] === 'function') {
                    local[call.method](...call.args);
                  }
                }
                return local.execute().then(onFulfilled, onRejected);
              });
            };
          }

          if (typeof t[prop] === 'function') {
            return function (...args) {
              recordedCalls.push({ method: prop, args });
              try {
                const nextTarget = t[prop](...args);
                return createProxy(nextTarget);
              } catch (err) {
                fallbackTables.add(table);
                return createProxy({
                  then(onF, onR) {
                    const local = new LocalQueryBuilder(table);
                    for (const call of recordedCalls) {
                      if (typeof local[call.method] === 'function') {
                        local[call.method](...call.args);
                      }
                    }
                    return local.execute().then(onF, onR);
                  }
                });
              }
            };
          }

          return Reflect.get(t, prop, receiver);
        },
      });
    };

    return createProxy(realSupabase.from(table));
  },
};

module.exports = supabase;
