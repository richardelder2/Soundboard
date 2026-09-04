# SAGA-ICM Local & Edge Setup Guide

This guide walks you through setting up and running your SAGA Interpretable Context Methodology (ICM) workspace using local edge models (like Gemma or Llama) or cloud fallbacks like OpenRouter.

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
   Because ICM is built around plain markdown files and folders, you don't need to configure external API keys for the agent itself. You can simply command your active agent (Claude Code / Antigravity) in chat:
   > *"Read stages/02_planning/CONTEXT.md and process the beat sheet outputs."*
   The agent will read the stage contract, ingest the inputs from the folder, and generate the files directly in the output directory. All reasoning tokens are billed directly to your active CLI agent subscription.
2. **Free API Setup for Diagnostics Scripts**:
   For standalone background diagnostic programs (such as `prose_rhythm_diagnostic.js` or the onboarding coach validation checks) that run directly inside your terminal shell:
   - Configure `.env` to point to **OpenRouter's free tier** (`meta-llama/llama-3-8b-instruct:free`).
   - The diagnostic scripts will perform their automated checks for free, without needing personal credit card billing.

---

## 🏗️ Step 3: Scaffold a Clean Novel Project Folder

To ensure your master template repository (wherever you cloned `saga-icm`) remains completely clean and free of narrative files, use the CLI's `init` command to generate a new, blank workspace elsewhere:

1. Create a blank folder where you want to write your book (e.g. `~/my_new_novel` or `C:\Users\<you>\my_new_novel`).
2. Open your terminal inside this new folder:
   ```bash
   cd path/to/my_new_novel
   ```
3. Run the SAGA-ICM initializer pointing to the template CLI script (use your clone's path):
   ```bash
   node "path/to/saga-icm/scripts/saga.js" init
   ```
4. Run `npm install` inside your new directory to configure dependencies.
5. **Launch Claude Code using your chosen profile**:
   - To launch **Vanilla Claude Code** (using standard subscription auth):
     ```powershell
     powershell -File ./scripts/claude-vanilla.ps1
     ```
   - To launch **OpenRouter Claude Code** (using API key from `.env`):
     ```powershell
     powershell -File ./scripts/claude-openrouter.ps1
     ```


---

## 🎭 Step 4: Run the Onboarding Wizard

Once your clean project workspace is scaffolded and the `.env` file is set up, start the interactive onboarding wizard inside Warp or your Obsidian integrated terminal:

```bash
node scripts/saga.js wizard onboard
```

### What happens next:
1. The script loads the Hard Sci-Fi Comfort Book blueprint from `setup/comfort_scifi_blueprint.md`.
2. It guides you step-by-step through **16 targeted Q&A questions** (asking exactly one question at a time).
3. The coach validates the scientific rigor of your inputs in real-time.
4. After completing the interview, it synthesizes the answers into an Open Knowledge Format (OKF) world bible and characters profile files under `stages/01_onboarding/output/`.

---

## 📊 Step 5: Check Pipeline Status

At any point, verify which stages of the novel have been completed by running:

```bash
node scripts/saga.js status
```

This will print the status of all 5 stages along with files generated under their respective `output/` directories.
