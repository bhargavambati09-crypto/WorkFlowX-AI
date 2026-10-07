const supabase = require('../config/supabase');

/**
 * Database client and helper exports
 */
module.exports = {
  supabase,
  db: supabase,
  query: (table) => supabase.from(table),
};
