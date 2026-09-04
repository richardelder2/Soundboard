# Soundboard Local & Edge Setup Guide

This guide walks you through setting up and running your Soundboard Interpretable Context Methodology (ICM) workspace using local edge models (like Gemma or Llama) or cloud fallbacks like OpenRouter or Gemini.

---

## 🛠️ Prerequisites

Before starting, ensure you have the following installed on your system:
1. **Node.js** (v18 or higher recommended)
2. **Git**
3. **Obsidian** (optional, for visual note management and terminal integration)
4. **Warp Terminal** (optional, for a high-performance terminal environment)

---

## 🚀 Step 1: Install Local Edge Models (In-House Hosting)

To run models locally on your own machine without an internet connection, we recommend using **Ollama**:

1. Download and install [Ollama](https://ollama.com/).
2. Start the Ollama background service.
3. Download and run your chosen model in your terminal (e.g., Gemma 2 / Gemma 4 / Llama 3):
   ```bash
   ollama run gemma2
   ```
   *Note: Ollama automatically runs an OpenAI-compatible API server locally at `http://localhost:11434`.*

---

## ⚙️ Step 2: Configure Environment Variables

Create a file named `.env` in the root of your `saga_icm/` project directory:

### Option A: Local Ollama / llama.cpp Server (Zero Cost, Offline)
Set these variables to route prompts to your local model:
```env
LOCAL_MODEL=true
LOCAL_MODEL_URL=http://localhost:11434/v1/chat/completions
LOCAL_MODEL_NAME=gemma2
```

### Option B: OpenRouter API (Access Free Models in the Cloud)
If you want to use cloud-hosted free models without taxing your local CPU/GPU:
1. Get a free API key from [OpenRouter](https://openrouter.ai/).
2. Add these variables to your `.env`:
```env
USE_OPENROUTER=true
OPENROUTER_API_KEY=your_openrouter_key_here
OPENROUTER_MODEL=meta-llama/llama-3-8b-instruct:free
```

### Option D: Hybrid Setup (Local Assistant + Cloud Heavyweight)
If you want to run quick onboarding questions and styling checks locally on your machine, but run heavy tasks (such as the final synthesis outline generation or global diagnostic editing playbooks) in the cloud:
1. Turn on the local model server (e.g. Ollama with Gemma 2).
2. Configure your cloud key (Gemini or OpenRouter).
3. Set your `.env` like this:
```env
# Enable local model by default
LOCAL_MODEL=true
LOCAL_MODEL_URL=http://localhost:11434/v1/chat/completions
LOCAL_MODEL_NAME=gemma2

# Provide fallback cloud credentials for heavy reasoning tasks
GEMINI_API_KEY=your_gemini_api_key_here
```
The SAGA-ICM system will automatically route routine wizard prompts locally to save bandwidth/compute, but switch to the cloud API for heavy structural audits.

### Option E: Maximize Your Paid CLI Subscriptions (Claude Code & Antigravity CLI)
If you run this pipeline inside **Claude Code** or **Antigravity CLI** (using your standard $20/month subscription accounts):
1. **Agent-Guided Stage Execution (Zero API Costs)**: 

---

## 🏗️ Step 3: Scaffold a Clean Novel Project Folder

To ensure your master Soundboard repository remains completely clean and free of narrative files, each novel must live in its own dedicated folder.

Run the initializer directly specifying your new novel's folder:
```bash
node scripts/soundboard.js init novels/my-new-novel
```

Or cd into a new directory elsewhere and run:
```bash
node "path/to/soundboard/scripts/soundboard.js" init
```

Run `npm install` inside your new directory to configure dependencies.

---

## 🎭 Step 4: Run the Onboarding Wizard (or Agent-Led Chat)

Once your clean project workspace is scaffolded and the `.env` file is set up, start the interactive onboarding wizard:

```bash
node scripts/soundboard.js wizard onboard --blueprint=comfort_scifi
# or any other genre blueprint, e.g.:
node scripts/soundboard.js wizard onboard --blueprint=thriller_domestic
```

*(Note: If you are using Antigravity or Claude Code, simply ask the agent to onboard a new novel directly in chat!)*

---

## 📊 Step 5: Check Pipeline Status & Run Diagnostics

At any point, verify which stages of the novel have been completed by running:

```bash
node scripts/soundboard.js status
```

To run diagnostics:
```bash
node scripts/soundboard.js diag rhythm
node scripts/soundboard.js diag dialogue
node scripts/soundboard.js diag all
```
