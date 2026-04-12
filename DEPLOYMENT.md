# Vercel Deployment

## What you need

1. A Vercel project connected to this repository.
2. A MongoDB Atlas database and connection string.
3. A Vercel Blob token if you want image and logo uploads to persist in production.

## Environment variables

Add these in the Vercel project settings:

- `MONGODB_URI`
- `BLOB_READ_WRITE_TOKEN`

`BLOB_READ_WRITE_TOKEN` is required only if the deployed admin panel will upload files.

## MongoDB Atlas checklist

1. Create a database user with read and write access.
2. In Network Access, allow the IPs that need to connect.
3. Copy the Atlas SRV connection string and store it as `MONGODB_URI` in Vercel.

## Deploy checklist

1. Push the repository changes.
2. Import the repository into Vercel.
3. Set the environment variables.
4. Redeploy the project.
5. Open `/api/health` on the deployed site.

If `/api/health` returns JSON with `"ok": true`, the backend is connected.

## Notes

- Old files from the local `uploads/` folder are not automatically available on Vercel.
- New uploads will persist only when `BLOB_READ_WRITE_TOKEN` is configured.
- The backend serves static files and API routes from `server.js`.
