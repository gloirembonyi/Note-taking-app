# NoteGenius: AI-Powered Note-Taking Application

NoteGenius is a modern note-taking application built with Next.js, featuring AI-powered suggestions, speech-to-text capabilities, and real-time collaboration.

## Features

### AI-Powered Assistance
- **Smart Suggestions**: Get real-time writing suggestions as you type
- **Text Formatting**: Format your text professionally with a single click
- **Automatic Tagging**: AI automatically suggests relevant tags for your notes
- **Meeting Transcription Enhancement**: Transform raw meeting transcripts into structured notes with action items

### Speech-to-Text
- **Voice Recording**: Record your thoughts or meetings directly in the app
- **Speaker Identification**: Automatically identify different speakers in a conversation
- **Real-time Transcription**: See your speech converted to text as you speak

### Real-Time Collaboration
- **Multi-User Editing**: Work on notes simultaneously with teammates
- **Presence Indicators**: See who's viewing and editing your notes
- **Cursor Tracking**: View collaborators' cursor positions in real-time

### User Experience
- **Responsive Design**: Fully functional on both desktop and mobile
- **Secure Authentication**: User authentication powered by Clerk
- **Markdown Support**: Write using markdown for easy formatting

## Technology Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Authentication**: Clerk
- **AI Integration**: Google Generative AI (Gemini)
- **Speech-to-Text**: Deepgram
- **Real-time Collaboration**: LiveKit

## Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/note-taking-app.git
cd note-taking-app
```

2. Install dependencies:
```bash
npm install
# or
yarn
# or
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# LiveKit Real-time Collaboration
NEXT_PUBLIC_LIVEKIT_URL=your_livekit_url
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Google Generative AI
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_google_ai_api_key

# Deepgram Speech-to-Text
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_api_key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Authentication
- Sign up or log in using the authentication provided by Clerk
- Once authenticated, you'll be redirected to your notes page

### Creating Notes
- Click the "+" button to create a new note
- Add a title and start typing your content
- Use markdown formatting for headings, lists, and more

### Using AI Features
- Click the wand icon in the editor toolbar to enable/disable AI suggestions
- As you type, AI will suggest completions for your text
- Select text and use the format button to change the style (professional, casual, etc.)

### Speech-to-Text
- Click the microphone icon to start recording
- Speak clearly, and your words will be transcribed
- Stop recording when finished, and the transcription will be added to your note

### Collaboration
- Click the users icon to enable collaboration
- Share the unique URL with others to collaborate in real-time
- See other users' cursor positions and edits as they happen

## Deployment

This application can be easily deployed on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fnote-taking-app)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Clerk](https://clerk.dev/)
- [Google Generative AI](https://ai.google.dev/)
- [Deepgram](https://deepgram.com/)
- [LiveKit](https://livekit.io/)
- [TailwindCSS](https://tailwindcss.com/)
