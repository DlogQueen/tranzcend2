import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://prmpnnylrcmwixggwiei.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybXBubnlscmNtd2l4Z2d3aWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MDMxMjYsImV4cCI6MjA4NjI3OTEyNn0.b8o045ZaMT4xIc2igw0mmF6Isp70gZQ3nNmMPOSXUks';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
