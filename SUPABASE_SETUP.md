# Supabase Setup Guide

To enable authentication and storage for your Resume Builder, follow these steps:

## 1. Create a Supabase Project
Go to [Supabase](https://supabase.com/) and create a new project.

## 2. Run SQL Query
Go to the **SQL Editor** in your Supabase dashboard and run the following script to create the `resumes` table and set up security policies.

```sql
-- Create a table to store user resumes
create table public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null unique,
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.resumes enable row level security;

-- Create Policy: Users can only view their own resume
create policy "Users can view own resume"
  on public.resumes for select
  using ( auth.uid() = user_id );

-- Create Policy: Users can insert their own resume
create policy "Users can insert own resume"
  on public.resumes for insert
  with check ( auth.uid() = user_id );

-- Create Policy: Users can update their own resume
create policy "Users can update own resume"
  on public.resumes for update
  using ( auth.uid() = user_id );

-- Create Policy: Users can delete their own resume
create policy "Users can delete own resume"
  on public.resumes for delete
  using ( auth.uid() = user_id );
```

## 3. Get API Credentials
Go to **Project Settings** -> **API**.
Copy the following values:
- **Project URL**
- **anon public key**

## 4. Configure Environment Variables
Create a file named `.env` in the root of your project (same folder as `app.py`) and add the following:

```env
SUPABASE_URL=your_project_url_here
SUPABASE_KEY=your_anon_key_here
SECRET_KEY=your_flask_secret_key_here
```
