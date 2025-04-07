# NoteGenius - AI-Powered Note-Taking App

NoteGenius is a full-featured note-taking application built with Next.js that integrates AI assistance, speech-to-text capabilities, and real-time collaboration.

## Features

### AI-Powered Assistance (Google Gemini)
- Context-aware writing suggestions
- Smart text formatting and organization
- Automatic tagging and categorization
- Meeting transcription enhancement
- Image-to-text extraction

### Speech-to-Text (Deepgram)
- High-quality speech transcription
- Speaker identification
- Real-time speech recognition
- Smart noise reduction

### Real-Time Collaboration (LiveKit)
- Multi-user editing
- Cursor presence
- Room-based collaboration
- Visual collaborator indicators

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Note-taking-app.git
cd Note-taking-app
```

### 2. Install Dependencies
```bash
npm install
# or
yarn
# or
pnpm install
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory with the following variables:

```env
# Google Gemini AI
GOOGLE_GENERATIVE_AI_KEY=your_gemini_api_key

# LiveKit for real-time collaboration
NEXT_PUBLIC_LIVEKIT_URL=your_livekit_endpoint
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Deepgram for speech-to-text
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_api_key

# Clerk for authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

### 4. Run the Development Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Ensuring Features Work with Real Data

### AI Integration
1. Set up a Google Gemini API key at [https://ai.google.dev/](https://ai.google.dev/)
2. Add your API key to the `.env.local` file
3. Test AI suggestions by typing content in the note editor and clicking the sparkles icon

### Speech-to-Text
1. Set up a Deepgram API key at [https://deepgram.com/](https://deepgram.com/)
2. Add your API key to the `.env.local` file
3. Test speech-to-text by clicking the microphone icon and speaking
4. Allow microphone access in your browser when prompted

### Real-Time Collaboration
1. Set up a LiveKit account at [https://livekit.io/](https://livekit.io/)
2. Add your LiveKit credentials to the `.env.local` file
3. Test collaboration by opening the same note in two different browsers
4. Enable collaboration by clicking the users icon in each browser
5. You should see real-time updates and cursor position sharing

### Authentication
1. Set up a Clerk account at [https://clerk.dev/](https://clerk.dev/)
2. Add your Clerk credentials to the `.env.local` file
3. Test authentication by signing in using the authentication pages

## Troubleshooting

### AI Suggestions Not Working
- Ensure your Google Gemini API key is valid
- Check browser console for errors
- Verify that content is at least 20 characters long

### Speech-to-Text Not Working
- Ensure your Deepgram API key is valid
- Check that microphone permissions are granted
- Verify browser support for MediaRecorder API

### Collaboration Not Working
- Ensure LiveKit credentials are correctly configured
- Check that both users are authenticated
- Verify that note IDs match for collaboration
- Check browser console for WebSocket connection errors

## Contact

For support, contact [your-email@example.com](mailto:your-email@example.com).
