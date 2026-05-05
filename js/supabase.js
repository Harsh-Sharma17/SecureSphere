// ⛔ Replace with your real values
const SUPABASE_URL = "https://ctlcsfrmdbcjwwnmsfai.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0bGNzZnJtZGJjand3bm1zZmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDYzNzksImV4cCI6MjA5MzIyMjM3OX0.Vjfur2V3YMboDBojKhsj3UBcGJkrHUCw8bNDk3ofU1E";

// ✅ FIX: use a different variable name
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ✅ make it globally available
window.db = client;