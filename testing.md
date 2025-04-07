# NoteGenius Testing Checklist

This checklist ensures that all AI integration, Speech-to-Text, and Real-time Collaboration features are working with real data.

## Prerequisites
- [ ] Environment variables are properly set in `.env.local`
- [ ] All dependencies installed via `pnpm install`
- [ ] Development server running via `pnpm dev`

## Authentication (Clerk)
- [ ] User can sign up for a new account
- [ ] User can sign in with existing account
- [ ] User can sign out
- [ ] Protected routes redirect to sign-in when not authenticated

## AI Integration (Google Gemini)
- [ ] AI suggestions can be toggled on/off
- [ ] AI suggestions appear after typing at least 20 characters and clicking the sparkles icon
- [ ] AI suggestions are contextually relevant to the note content
- [ ] AI suggestions can be accepted or rejected
- [ ] Text formatting (bold, italic, headings, etc.) works correctly
- [ ] Error handling works properly when API key is invalid or requests fail

## Speech-to-Text (Deepgram)
- [ ] Microphone permission can be granted
- [ ] Speech recording starts when clicking the microphone icon
- [ ] Recording indicator appears during active recording
- [ ] Transcription appears in the editor after stopping recording
- [ ] Multiple recordings can be added to the same note
- [ ] Error handling works properly when API key is invalid or microphone access is denied

## Real-Time Collaboration (LiveKit)
- [ ] Collaboration can be toggled on/off
- [ ] Multiple users can connect to the same note (test with two browsers)
- [ ] User notifications appear when a collaborator joins/leaves
- [ ] Text changes sync in real-time between collaborators
- [ ] Cursor positions are visible to collaborators
- [ ] Disconnection and reconnection are handled properly
- [ ] Error handling works when LiveKit credentials are invalid

## Note Management
- [ ] Notes can be created
- [ ] Notes can be edited and content is saved
- [ ] Notes can be deleted
- [ ] Notes can be searched and filtered
- [ ] Notes can be favorited
- [ ] Notes can be exported as markdown

## Editor Features
- [ ] Markdown preview mode toggle works
- [ ] Preview displays properly formatted markdown
- [ ] System messages appear with appropriate information
- [ ] Editor toolbar is fully functional
- [ ] Copy/paste and undo/redo work properly

## Console Output Verification
- Check browser console for:
- [ ] No errors related to API keys or authentication
- [ ] Environment variables are properly loaded
- [ ] WebSocket connections for LiveKit establish successfully
- [ ] AI and Speech-to-Text API requests return 200 status codes

## Debugging Issues

### Common Problems and Solutions

#### AI Not Working
- Verify Google Gemini API key is valid and active
- Check browser network tab for API response errors
- Review server logs for any backend errors
- Ensure text content meets minimum length requirements

#### Speech-to-Text Not Working
- Verify Deepgram API key is valid
- Check microphone permissions in browser
- Ensure audio is being recorded (check with browser audio indicators)
- Verify the API endpoint is correctly configured

#### LiveKit Collaboration Not Working
- Verify LiveKit credentials are valid
- Check WebSocket connection in network tab
- Ensure both users are authenticated
- Verify room names match between collaborators
- Check CORS configuration for LiveKit URL

## After Testing

If all checklist items pass, the application is working correctly with real data from all integrated services. If any issues are found, refer to the corresponding debugging section in the checklist. 