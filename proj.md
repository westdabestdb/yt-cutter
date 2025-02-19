# YTCut - YouTube Video Trimmer

A web application that allows users to trim YouTube videos by specifying start and end points.

## To Do

### Setup & Infrastructure
- [ ] Set up Shadcn UI
- [ ] Set up environment variables

### Features
- [ ] Enhance YouTube link input component
  - [ ] Add loading state
  - [ ] Add error handling for network issues
  - [ ] Preview video thumbnail
- [ ] Enhance video player component
  - [ ] Add keyboard shortcuts
  - [ ] Add volume control
  - [ ] Add fullscreen support
- [ ] Enhance video trimming interface
  - [ ] Add frame-by-frame navigation
  - [ ] Add zoom functionality for precise trimming
  - [ ] Add preview functionality
- [ ] Implement video export functionality
  - [ ] Set up backend API for video processing
  - [ ] Add progress indicator
  - [ ] Implement download functionality

### Technical Implementation
- [ ] Set up YouTube Data API integration
- [ ] Implement video processing service
- [ ] Add loading states
- [ ] Optimize performance
- [ ] Add error boundary

### Testing & Documentation
- [ ] Add unit tests for components
- [ ] Add integration tests
- [ ] Write API documentation
- [ ] Add user documentation

## Done
- [x] Initialize Next.js 14 project with TypeScript
- [x] Set up Tailwind CSS
- [x] Configure project structure
- [x] Install essential dependencies:
  - Zod for validation
  - React Player for YouTube video playback
  - Zustand for state management
  - Radix UI icons
  - React Hook Form with resolvers
  - Utility libraries (clsx, class-variance-authority, tailwind-merge)
- [x] Create basic layout components
- [x] Implement YouTube URL validation
- [x] Create video state management with Zustand
- [x] Add responsive design
- [x] Create basic YouTube link input component
- [x] Add basic video player integration
- [x] Add basic error handling for invalid URLs
- [x] Create video trimming interface
  - [x] Add timeline slider for trim points
  - [x] Display current time markers
  - [x] Add draggable trim handles
- [x] Enhance video player component
  - [x] Add custom video controls
  - [x] Add play/pause functionality
  - [x] Add seek functionality
  - [x] Add automatic stop at end time
