# Supabase Setup Guide

This guide will help you set up Supabase for persistent storage of admin changes and uploaded images.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up (free tier available)
2. Click **"New Project"**
3. Choose a name, password, and region (closest to your users)
4. Wait for the project to initialize (1-2 minutes)

## Step 2: Get Your Credentials

1. Go to **Settings > API** in your Supabase dashboard
2. Copy your **Project URL** (looks like: `https://xxxx.supabase.co`)
3. Copy your **anon public key** (starts with `eyJ...`)
4. Save these for the next step

## Step 3: Set Up Environment Variables

1. In your project root, create a `.env` file (copy from `.env.example`)
2. Paste your credentials:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_ADMIN_PASSWORD_HASH=240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
   ```
3. Save the file

## Step 4: Create Database Tables

1. In Supabase, go to **SQL Editor**
2. Click **"New Query"**
3. Paste the SQL from `supabase_migrations.sql` into the editor
4. Click **"Run"** (top-right)
5. Confirm all tables are created

## Step 5: Create Storage Bucket

1. Go to **Storage** in Supabase sidebar
2. Click **"Create New Bucket"**
3. Name it: `images` (lowercase, no spaces)
4. Enable **"Public Bucket"**
5. Click **"Create"**

## Step 6: Set Up RLS Policies (Security)

The migrations script includes RLS policies. If you need to troubleshoot:

**Categories & Projects tables:**
- Anyone can read
- Only authenticated users (admin) can modify

**Site Content table:**
- Anyone can read
- Only authenticated users can modify

**Inquiries table:**
- Only authenticated users can read/create

**Images bucket:**
- Anyone can read uploaded images
- Only authenticated users can upload

## Step 7: Test It Out

1. Run the dev server: `npm run dev`
2. Go to `/studio-admin`
3. Login with password: `admin123`
4. Try uploading an image file
5. Create a new project
6. Check the Supabase dashboard to verify data was saved

## Troubleshooting

**"Could not upload images. Make sure Supabase is configured in .env"**
- Check that `.env` file exists in your project root
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Restart your dev server after adding `.env`

**Images upload but don't appear**
- Check that `images` bucket exists and is public
- In Supabase Storage, verify files appear in `images/projects/` folder
- Check browser console for errors (F12 → Console tab)

**Data not syncing to Supabase**
- Verify all tables were created (check SQL Editor > Recent queries)
- Use Supabase Dashboard to manually check if rows exist in tables
- Look for errors in browser console (F12 → Console)

**Password won't work**
- The default hash is for password: `admin123`
- To change password, generate a new SHA-256 hash at: https://www.sha256online.org/
- Update `VITE_ADMIN_PASSWORD_HASH` in `.env`

## Data Persistence

After setup:
- Admin changes save immediately to Supabase
- Uploaded images stored in Supabase Storage
- Data survives GitHub deployments
- Multiple team members can share one project

✅ Done! Your site now has persistent admin changes & image uploads.
