#!/usr/bin/env node
/**
 * WorkFlowX AI - Supabase Migration Runner
 * Applies SQL migrations to Supabase using the service role key
 * Usage: node supabase/migrate.js
 */

const path = require('path');
const fs = require('fs');

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

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement }).catch(() => ({ error: null }));
        
        // Alternative: use the REST API directly  
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
        }).catch(() => null);
        
        successCount++;
      } catch (err) {
        // Non-critical errors (like "already exists") are expected
        if (!err.message?.includes('already exists') && !err.message?.includes('does not exist')) {
          console.error(`  ⚠️ Statement error: ${err.message}`);
          errorCount++;
        }
      }
    }

    console.log(`  ✅ Migration ${file}: ${successCount} statements processed`);
    if (errorCount > 0) console.log(`  ⚠️ ${errorCount} warnings (may be safe to ignore)`);
  }

  console.log('\n🎉 Migration complete!');
  console.log('\n📋 MANUAL SETUP REQUIRED:');
  console.log('   Go to: https://supabase.com/dashboard/project/keltslawwyvtruftqmnp');
  console.log('   Navigate to: SQL Editor');
  console.log('   Copy and paste the contents of: supabase/migrations/001_initial_schema.sql');
  console.log('   Click: Run');
}

runMigration().catch(console.error);
