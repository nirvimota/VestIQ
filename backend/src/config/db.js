// Supabase is used as the primary datastore (see supabase.js), so a separate
// SQL connection pool isn't needed for the MVP. Keep this file as the place
// to add a raw Postgres pool (pg) later if you need queries Supabase's
// client can't express.
export {};