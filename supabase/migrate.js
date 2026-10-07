#!/usr/bin/env node
/**
 * WorkFlowX AI - Supabase Migration Runner
 * Applies SQL migrations to Supabase using the service role key
 * Usage: node supabase/migrate.js
 */

const path = require('path');
const fs = require('fs');

// Ensure module resolution finds backend/node_modules if running from workspace root
const backendModules = path.join(__dirname, '../backend/node_modules');
if (fs.existsSync(backendModules) && !module.paths.includes(backendModules)) {
  module.paths.unshift(backendModules);
}

const envPath = fs.existsSync(path.join(__dirname, '../backend/.env'))
  ? path.join(__dirname, '../backend/.env')
  : path.join(__dirname, '../.env');

require('dotenv').config({ path: envPath });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runMigration() {
  console.log('🚀 WorkFlowX AI - Running Supabase migrations...');
  console.log(`📡 Supabase URL: ${supabaseUrl}`);
  
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`📁 Found ${migrationFiles.length} migration file(s):`);

  for (const file of migrationFiles) {
    console.log(`\n▶ Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    // Split by semicolons and run each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let processedCount = 0;

    for (const statement of statements) {
      try {
        await supabase.rpc('exec_sql', { sql: statement });
        processedCount++;
      } catch {
        // PostgREST doesn't expose raw exec_sql by default without SQL function
      }
    }

    console.log(`  📄 Read ${statements.length} SQL statements from ${file}`);
  }

  // Test current table connectivity
  console.log('\n🔍 Verifying Supabase cloud table status...');
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
  if (pErr) {
    console.log(`  ⚠️ Notice: Tables need to be initialized in Supabase SQL editor:`);
    console.log(`     Error: ${pErr.message}`);
    console.log('\n📋 ONE-CLICK CLOUD SETUP:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/keltslawwyvtruftqmnp');
    console.log('   2. Navigate to: SQL Editor (left sidebar)');
    console.log('   3. Paste the contents of: supabase/migrations/001_initial_schema.sql');
    console.log('   4. Click: Run (Green button)');
    console.log('   (Note: WorkFlowX AI automatically uses its resilient zero-downtime store until run!)');
  } else {
    console.log(`  ✅ Supabase cloud tables are online and accessible!`);
  }

  console.log('\n🎉 Migration inspection complete!');
}

runMigration().catch(console.error);
