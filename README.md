# DeepProbe: AI Interview Agent Platform

[![Deployment Status](https://img.shields.io/badge/Deployment-Active-brightgreen)](https://vaishali-deep-probe.vercel.app)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Framework-Next.js-black?logo=next.js)](https://nextjs.org/)
[![Google Generative AI](https://img.shields.io/badge/AI-Google%20Gemini-blue?logo=google)](https://deepmind.google/technologies/gemini/)

> **DeepProbe** is an intelligent AI-powered interview platform that conducts dynamic, conversational interviews with candidates and provides comprehensive feedback on their performance, strengths, and growth areas.

🌐 **Live Demo**: [vaishali-deep-probe.vercel.app](https://vaishali-deep-probe.vercel.app)

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Specification](#api-specification)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

DeepProbe leverages advanced AI (Google Gemini) to conduct realistic technical and behavioral interviews. The platform:

- **Engages candidates** in natural, multi-turn conversations
- **Maintains context** across interview sessions
- **Provides intelligent feedback** with actionable insights
- **Evaluates performance** across multiple dimensions
- **Delivers comprehensive reports** with strengths, gaps, and recommendations

Perfect for recruiting teams, educational institutions, and self-assessment purposes.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                      │
│  - React 19 UI Components                                   │
│  - Real-time Chat Interface                                 │
│  - Session Management                                       │
│  - Feedback Display                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   BACKEND LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         API Endpoints (Next.js API Routes)          │   │
│  │  - POST /api/interview (Interview management)       │   │
│  │  - Session handling & routing                       │   │
│  └────────┬──────────────────────────────────────────┬─┘   │
│           │                                          │       │
│           ▼                                          ▼       │
│  ┌──────────────────┐                    ┌──────────────────┐
│  │ Session Manager  │                    │ Interview Flow   │
│  │ - State tracking │                    │ - Conversation   │
│  │ - History mgmt   │                    │ - Evaluation     │
│  └──────────────────┘                    └────────┬─────────┘
│                                                    │
│                                                    ▼
│                                        ┌──────────────────────┐
│                                        │   AI Core Engine     │
│                                        │  (Google Gemini)     │
│                                        │  - Natural Language  │
│                                        │  - Question Gen      │
│                                        │  - Response Eval     │
│                                        └──────────────────────┘
│                                                    │
└────────────────────────────────────────────────────┼───────────┘
                                                     │
                                    ┌────────────────▼────────────┐
                                    │   External Services        │
                                    │  - Google Generative AI API│
                                    │  - UUID Generation         │
                                    │  - Vercel Deployment       │
                                    └─────────────────────────────┘
```

### Component Layers

**1. Presentation Layer**
- Built with **React 19** and **Next.js 16.3**
- Real-time UI updates with **Framer Motion** animations
- Responsive design with **Tailwind CSS**
- Icon system using **Lucide React**

**2. API Layer**
- RESTful endpoints following OpenAPI standards
- State management via `sessionId`
- Request/response validation
- Error handling & graceful fallbacks

**3. Interview Engine**
- Session state management
- Multi-turn conversation orchestration
- Context preservation across turns
- Interview conclusion detection
- Feedback generation & evaluation

**4. AI Intelligence**
- **Google Gemini API** integration
- Natural language understanding
- Dynamic question generation
- Performance evaluation
- Feedback synthesis

---

## Key Features

### 🎯 Core Interview Features

- **Dynamic Questioning**: AI-generated contextual questions based on candidate profile
- **Multi-Turn Conversations**: Natural back-and-forth dialogue across multiple interview turns
- **Session Persistence**: Maintains interview state and history using unique session IDs
- **Real-Time Feedback**: Immediate responses to candidate answers
- **Interview Completion Detection**: Automatic detection when interview should conclude

### 📊 Assessment & Feedback

- **Comprehensive Evaluation**: Multi-dimensional assessment of candidate performance
- **Structured Feedback**:
  - Executive summary of interview
  - Key strengths identified
  - Skill gaps and areas for improvement
  - Actionable next steps for growth
- **Performance Scoring**: Quantitative and qualitative assessment metrics
- **Detailed Reports**: PDF-ready feedback format

### 🎨 User Experience

- **Smooth Animations**: Framer Motion-powered transitions
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Clean Interface**: Intuitive chat-based interaction
- **Visual Feedback**: Real-time status indicators
- **Accessibility**: Built-in semantic HTML and ARIA support

### 🔐 Technical Capabilities

- **Stateful Sessions**: Full conversation history preservation
- **No Authentication Required**: Simplified access for interviews
- **Scalable Architecture**: Ready for concurrent interview sessions
- **Type-Safe Development**: Full TypeScript codebase
- **Production Ready**: Deployed on Vercel with CI/CD

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.8 | UI framework |
| **Next.js** | 16.3.0 | Full-stack framework |
| **TypeScript** | ^5 | Type safety |
| **Tailwind CSS** | ^4 | Styling |
| **Framer Motion** | ^13.0.0 | Animations |
| **Lucide React** | ^1.30.0 | Icon library |

### Backend & AI
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | (Latest) | Runtime |
| **Google Generative AI** | ^0.24.1 | LLM integration |
| **UUID** | ^14.0.1 | Session ID generation |

### Developer Tools
| Tool | Version | Purpose |
|------|---------|---------|
| **ESLint** | ^9 | Code linting |
| **TypeScript Compiler** | ^5 | Type checking |
| **Next.js Config** | 16.3.0 | Build optimization |

### Deployment & DevOps
- **Vercel**: Hosting & CI/CD
- **npm**: Package management
- **Git**: Version control

---

## Project Structure

```
vaishali-DeepProbe/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Main interview page
│   │   ├── layout.tsx         # Root layout
│   │   └── api/
│   │       └── interview/     # Interview endpoint handler
│   ├── components/            # Reusable React components
│   │   ├── InterviewChat.tsx # Chat interface
│   │   ├── FeedbackDisplay.tsx # Feedback renderer
│   │   └── SessionManager.tsx # Session handler
│   ├── lib/                   # Utility functions
│   │   ├── gemini.ts         # AI engine wrapper
│   │   ├── interview.ts      # Interview logic
│   │   └── types.ts          # TypeScript types
│   └── data/                  # Static data & schemas
│       └── candidates.json    # Candidate schema
├── public/                    # Static assets
├── styles/                    # Global styles
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── next.config.ts            # Next.js config
├── tailwind.config.ts        # Tailwind config
├── technical-spec.md         # API specification
└── README.md                 # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Google API Key** for Gemini (Free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vaishali-rgb/vaishali-DeepProbe.git
   cd vaishali-DeepProbe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   echo "NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here" > .env.local
   ```
   Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

4. **Start development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Build for production
npm start           # Start production server

# Code Quality
npm run lint        # Run ESLint
```

---

## API Specification

### Interview Endpoint

**Endpoint**: `POST /api/interview`

#### Start Interview

**Request**:
```json
{
  "sessionId": "abc-123",
  "candidate": {
    "name": "John Doe",
    "role": "Full Stack Developer",
    "experience": "5 years",
    "skills": ["JavaScript", "React", "Node.js"]
  }
}
```

**Response**:
```json
{
  "reply": "Welcome to the interview, John! Let's begin with a technical question...",
  "done": false
}
```

#### Continue Interview

**Request**:
```json
{
  "sessionId": "abc-123",
  "message": "I use React hooks for state management..."
}
```

**Response**:
```json
{
  "reply": "Great! Can you explain the differences between useState and useReducer?",
  "done": false
}
```

#### End Interview

**Response**:
```json
{
  "reply": "Thank you for the interview! Here's your feedback:",
  "done": true,
  "feedback": {
    "summary": "Strong technical foundation with excellent communication skills",
    "strengths": [
      "Deep understanding of React concepts",
      "Clear explanation ability",
      "Problem-solving approach"
    ],
    "gaps": [
      "Limited experience with TypeScript",
      "Need to explore backend optimization"
    ],
    "next": [
      "Study TypeScript for type safety",
      "Practice system design problems",
      "Build a full-stack project"
    ]
  }
}
```

For complete API documentation, see [technical-spec.md](./technical-spec.md)

---

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Add environment variable: `NEXT_PUBLIC_GEMINI_API_KEY`
   - Deploy!

3. **View Live**
   - Your app will be live at `your-project.vercel.app`

### Deploy Locally

```bash
# Build
npm run build

# Start production server
npm start
```

---

## Architecture Highlights

### 🎯 Design Principles

1. **Scalability**: Stateless API design allows horizontal scaling
2. **Maintainability**: Clear separation of concerns with organized file structure
3. **Type Safety**: Full TypeScript ensures fewer runtime errors
4. **Performance**: Next.js optimization for fast load times
5. **Developer Experience**: Hot reload, clear error messages, organized code

### 🔄 Interview Flow

```
1. User Initiates Interview
   ↓
2. Session Created with Unique ID
   ↓
3. AI Generates Welcome Message
   ↓
4. User Provides First Response
   ↓
5. Loop: AI Evaluates → Generates Question → Waits for Response
   ↓
6. AI Detects Conclusion Criteria
   ↓
7. Generate Comprehensive Feedback
   ↓
8. Return Final Response with Evaluation
```

---

## Contributing

We welcome contributions! Here's how to get involved:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Standards

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain 80%+ test coverage
- Write clear commit messages
- Update documentation

---

## Roadmap

- [ ] Multi-language support
- [ ] Interview templates (Technical, Behavioral, HR)
- [ ] Real-time scoring dashboard
- [ ] Interview recording & playback
- [ ] Advanced analytics & reporting
- [ ] Integration with ATS systems
- [ ] Mobile app (React Native)
- [ ] Interview team collaboration features

---

## Troubleshooting

### API Key Issues
- Verify `NEXT_PUBLIC_GEMINI_API_KEY` is set correctly
- Check that the key has appropriate permissions
- Ensure it's added to `.env.local` (not `.env`)

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Runtime Issues
- Check browser console for errors
- Review server logs: `npm run dev` output
- Verify Node.js version: `node --version`

---

## License

This project is open source and available under the MIT License.

---

## Support & Contact

- 📧 Email: vaishali-rgb@example.com
- 🐙 GitHub: [@vaishali-rgb](https://github.com/vaishali-rgb)
- 🌐 Website: [vaishali-deep-probe.vercel.app](https://vaishali-deep-probe.vercel.app)

---

## Acknowledgments

- Built with **Next.js** by Vercel
- AI powered by **Google Gemini**
- Styled with **Tailwind CSS**
- Icons from **Lucide React**
- Animations with **Framer Motion**

---

<div align="center">

**Made with ❤️ by [vaishali-rgb](https://github.com/vaishali-rgb)**

[⬆ Back to Top](#deepprobe-ai-interview-agent-platform)

</div>
