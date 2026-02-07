<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gestor de Gastos

Plataforma avançada de gestão financeira com tema escuro, suporte a gastos recorrentes (empréstimos) e análise via Gemini AI.

View your app in AI Studio: https://ai.studio/apps/drive/18LDsqh8J9IcsgtYcaCEjs1aiybDsDOku

## Run Locally

**Prerequisites:**  Node.js 18+

### Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your API credentials:
   - `VITE_GEMINI_API_KEY`: Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - `VITE_SUPABASE_URL`: Get from your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api)
   - `VITE_SUPABASE_ANON_KEY`: Get from your Supabase project settings

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Features

- 💰 Advanced expense tracking with categories
- 📊 Financial analytics dashboard
- 🤖 AI-powered financial insights with Gemini
- 🌙 Dark mode support
- 💳 Recurring expenses and loan management
- 📱 Responsive design
- 🔒 Secure authentication with Supabase

## Security Note

⚠️ **Never commit your `.env` file to version control!** The `.env` file contains sensitive API keys and should remain private. Always use `.env.example` as a template.
