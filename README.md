# EasyTutor

EasyTutor is your ultimate local AI-powered CDACC tutor explicitly mapped for Engineering Mathematics and automotive coursework!

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd easytutor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Anthropic credentials:
   ```env
   EXPO_PUBLIC_ANTHROPIC_API_KEY=your_api_key_here
   ```

## Running on Device via Expo Go

Start the native development server:
```bash
npx expo start
```
Simply scan the QR code generated in your terminal using the Expo Go application on an iOS or Android device.

## Running Fully Offline via Local Ollama

Optionally switch out Anthropic inference and utilize your desktop's local Ollama environment seamlessly natively via WiFi setup:
1. **Ensure Ollama is running globally:** Expose it to your local network natively by starting your daemon with `OLLAMA_HOST=0.0.0.0 ollama serve`.
2. Grab your machine's local IP Address (ex: `http://192.168.1.50:11434`).
3. Press the gear icon inside EasyTutor's Home Dashboard, explicitly enable **Use Local AI (Ollama)** natively, and input the server host string and desired model explicitly.
4. You're ready to test your questions locally and perfectly offline!

## Screenshots

*(Placeholder: Upload screenshots of the intuitive Home Layout, custom Roadmap tracker and Study chat Interface here)*

---
*Developed with Expo & NativeWind.*
