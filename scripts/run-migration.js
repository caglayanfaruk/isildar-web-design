import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/populate_complete_site_data.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded, executing SQL...');
    
    // Split SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('/*') && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (error) {
            console.error(`❌ Error in statement ${i + 1}:`, error);
            // Continue with next statement
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Exception in statement ${i + 1}:`, err);
        }
      }
    }
    
    console.log('🎉 Migration completed!');
    console.log('📊 Checking data...');
    
    // Verify data was inserted
    const { data: categories } = await supabase.from('categories').select('*');
    const { data: products } = await supabase.from('products').select('*');
    const { data: languages } = await supabase.from('languages').select('*');
    const { data: translations } = await supabase.from('translations').select('*');
    
    console.log(`✅ Categories: ${categories?.length || 0}`);
    console.log(`✅ Products: ${products?.length || 0}`);
    console.log(`✅ Languages: ${languages?.length || 0}`);
    console.log(`✅ Translations: ${translations?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

runMigration();