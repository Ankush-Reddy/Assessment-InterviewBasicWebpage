# Interview Test Web Page - Audio Processing Application - Assessment

A React-based web application that implements microphone access and real-time 3D audio visualization using Web Audio API and WebGL.

##  How to Run the Project

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation & Setup

```bash
# Clone or extract the project
git clone https://github.com/Ankush-Reddy/Assessment-InterviewBasicWebpage.git

# Install dependencies
npm install

# Install Tailwind dependencies (if not already configured)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

```
**Configure Tailwind CSS**
   Update `tailwind.config.js`:
   ```javascript
   module.exports = {
     content: [
       "./src/**/*.{js,jsx,ts,tsx}",
       "./public/index.html"
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```

**Add Tailwind directives to CSS**
   Create `src/index.css`:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

**Start the development server**
   ```bash
   npm start
   ```

The application will open at `http://localhost:3000`

### Usage
1. Click **"CLICK HERE TO START RECORDING!"** to enter recording mode
2. Grant microphone permissions when prompted
3. The visualization area will turn beige and display the 3D spectrogram
4. Click any instrument icon at the bottom to play sounds and see visualizations
5. Click **"CLICK HERE TO STOP RECORDING"** to return to the initial state


##  Features Implemented

### Core Requirements
-  **Figma Design Implementation**: Exact match to provided design
-  **Microphone Access**: getUserMedia() API from web.dev tutorial
-  **Web Audio API**: Real-time audio processing with AudioWorklet
-  **3D Spectrogram**: WebGL-based visualization inspired by Chrome Music Lab

### Technical Features
-  **3D WebGL Visualization**: Custom vertex and fragment shaders
-  **Real-time Audio Analysis**: Frequency domain processing
-  **Responsive Design**: Works on desktop and mobile devices
-  **Modern React**: Hooks-based functional components
-  **Performance Optimized**: Efficient WebGL rendering

##  Technical Implementation

### Architecture
- **Frontend**: React 18 with functional components and hooks
- **Styling**: Tailwind CSS with custom design system
- **Audio Processing**: Web Audio API with AnalyserNode
- **3D Graphics**: WebGL with custom shaders
- **Real-time Rendering**: RequestAnimationFrame loop

### Key Components
1. **MicrophoneAudioApp**: Main component handling all audio and WebGL logic
2. **3D Spectrogram**: Custom WebGL implementation with shaders
3. **Audio Processing**: Web Audio API integration following web.dev tutorial
4. **State Management**: React hooks for clean state handling


##  Assumptions Made

1. **Figma Design**: Implemented based on provided screenshot with exact colors and layout
2. **3D Visualization**: Created WebGL-based spectrogram inspired by Chrome Music Lab
3. **Audio Processing**: Used exact web.dev tutorial implementation for microphone access
4. **User Experience**: Prioritized visual feedback and smooth interactions
5. **Performance**: Optimized for modern browsers with WebGL support

##  What I'd Improve with More Time

1. **Advanced Spectrogram Features**:
   - Replace the current wave animations with actual instrument images
   - More sophisticated particle effects tailored to each instrument's acoustic properties
   - Multiple visualization modes (2D/3D toggle)

2. **Mobile Optimization**:
   - Touch-friendly controls
   - Mobile-specific audio handling

## Unfinished Items
No significant items remain unfinished. The application meets all specified requirements and provides additional enhancements beyond the basic scope.

##  Development Sources & GenAI Assistance

### Resources Used
- [Web.dev Microphone Tutorial](https://web.dev/patterns/media/microphone-process) - Core implementation
- [Chrome Music Lab Spectrogram](https://github.com/googlecreativelab/chrome-music-lab) - Inspiration
- [WebGL Fundamentals](https://webglfundamentals.org/) - 3D graphics implementation
- [React Documentation](https://reactjs.org/docs) - Component patterns

### AI Assistance
- Used Claude (Anthropic) for:
  - Project architecture planning
  - WebGL shader development
  - React best practices guidance


##  Project Structure

```
├── public/
│   ├── processor.js          # AudioWorklet processor
│   └── index.html           # HTML template
├── src/
│   ├── components/
│   │   └── MicrophoneAudioApp.jsx  # Main component
│   ├── App.js               # App entry point
│   ├── index.js             # React entry point
│   └── index.css            # Tailwind CSS
├── package.json             # Dependencies
├── tailwind.config.js       # Tailwind configuration
└── README.md               # This file
```

##  Code Quality

- **Well-commented code**: Clear explanations for complex audio and WebGL logic
- **Modular architecture**: Separated concerns for audio, visualization, and UI
- **Error handling**: Graceful fallbacks for audio loading and microphone access
- **Performance optimizations**: Efficient rendering loops and memory management
