# TINA - AI Phone Answering Service

An AI-powered phone answering service built with Express, Twilio, and Supabase.

## Deployment to Railway

### Prerequisites
- Railway account ([railway.app](https://railway.app))
- Railway CLI installed: `npm i -g @railway/cli`

### Deploy Steps

1. **Login to Railway**
   ```bash
   railway login
   ```

2. **Initialize Railway project**
   ```bash
   railway init
   ```

3. **Add environment variables**
   ```bash
   railway variables set TWILIO_ACCOUNT_SID=your_sid
   railway variables set TWILIO_AUTH_TOKEN=your_token
   railway variables set SUPABASE_URL=your_url
   railway variables set SUPABASE_ANON_KEY=your_key
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Get your deployment URL**
   ```bash
   railway domain
   ```

### Manual Deployment via Dashboard

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables in the Variables tab:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. Railway will automatically deploy

### Configure Twilio Webhook

Once deployed, configure your Twilio phone number webhook:
1. Go to Twilio Console → Phone Numbers
2. Select your number
3. Under "Voice & Fax", set "A call comes in" webhook to:
   ```
   https://your-railway-url.railway.app/voice
   ```
4. Save

## Local Development

1. Copy `.env.example` to `.env` and fill in your credentials
2. Install dependencies: `npm install`
3. Start server: `npm start`
4. Server runs on `http://localhost:3000`

## Endpoints

- `GET /` - Health check
- `POST /voice` - Twilio voice webhook (returns TwiML)
