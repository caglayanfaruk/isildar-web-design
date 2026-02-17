import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function setupStorage() {
  try {
    console.log('Checking storage buckets...');

    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    console.log('Existing buckets:', buckets.map(b => b.name));

    // Check if 'media' bucket exists
    const mediaBucket = buckets.find(b => b.name === 'media');

    if (!mediaBucket) {
      console.log('Media bucket not found. Please create it manually in Supabase Dashboard:');
      console.log('1. Go to Storage section');
      console.log('2. Create new bucket named "media"');
      console.log('3. Set it as public bucket');
    } else {
      console.log('✓ Media bucket exists');

      // Test upload
      console.log('Testing upload...');
      const testFile = new Blob(['test'], { type: 'text/plain' });
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload('test.txt', testFile);

      if (uploadError) {
        console.error('Upload test failed:', uploadError.message);
      } else {
        console.log('✓ Upload test successful');

        // Clean up test file
        await supabase.storage.from('media').remove(['test.txt']);
      }
    }

  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupStorage();
