**🎙️ ROXSTAR**
Real-Time Voice Collaboration & Interactive Multiplayer Platform
Repository: github.com/roshankumar101/RoxStar
Platform: React Native / Expo + Node.js + MongoDB + Socket.IO

**Executive Overview**
ROXSTAR is a full-stack real-time multiplayer application focused on # ROXSTAR

### Real-Time Voice Collaboration & Interactive Multiplayer Platform

**Repository:** [github.com/roshankumar101/RoxStar](https://github.com/roshankumar101/RoxStar)

**Platform:** React Native / Expo · Node.js · MongoDB · Socket.IO

---

## Executive Overview

**ROXSTAR** is a full-stack real-time multiplayer application focused on **voice interaction, room-based collaboration, audio recording, and interactive multiplayer experiences**.

The system consists of a **React Native mobile client**, **Node.js/Express backend**, **MongoDB database**, **Socket.IO real-time communication**, and a dedicated **native-audio module**.

---

# 1. Repository Structure

```text
RoxStar/
├── .github/
│   └── workflows/          # GitHub Actions
├── .vscode/                # VS Code configuration
├── backend/                # Node.js + Express backend
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── mobile/                 # React Native + Expo application
│   ├── app/
│   ├── assets/
│   ├── package.json
│   └── app.json
├── native-audio/           # Native audio module
├── docker-compose.yml      # Backend + MongoDB
├── .gitignore
└── README.md
2. Product & Key Features
Voice Recording
- Start / Stop Recording
- Recording Duration
- Voice Drafts
- Editable Draft Names
- Recording State UI
- Native Audio Integration
Real-Time Multiplayer
- Room-based multiplayer
- Real-time state synchronization
- Socket.IO communication
- Shared application events
Mobile Client
     │
     │ Socket.IO
     ▼
Backend
     │
     ├── Room State
     ├── User State
     ├── Real-Time Events
     └── Application Events
Authentication
- JWT authentication
- bcrypt password hashing
- Zod validation
- Environment-based configuration
Interactive Multiplayer
The application supports room-based participation and synchronized multiplayer state, with important state managed by the backend.
Data Persistence
MongoDB is used as the primary database through Mongoose.
Application
     │
     ▼
Node.js Backend
     │
     ▼
Mongoose
     │
     ▼
MongoDB
3. Architecture / System Design
ROXSTAR follows a client-server real-time architecture.
┌──────────────────────┐
│   React Native App   │
│        Expo          │
└──────────┬───────────┘
           │
     REST / Socket.IO
           │
           ▼
┌──────────────────────┐
│   Node.js Backend    │
│ Express + Socket.IO  │
└──────────┬───────────┘
           │
       Mongoose
           │
           ▼
┌──────────────────────┐
│       MongoDB        │
└──────────────────────┘

Native Audio
     │
     ▼
Device Microphone
Communication Model
REST API
Client → Express → Business Logic → MongoDB
Socket.IO
Client A ───────┐
Client B ───────┼──► Socket.IO Server
Client C ───────┘           │
                            ▼
                     Broadcast Events
4. Tech Stack
Mobile
Technology	Purpose
React Native	Mobile application
Expo SDK 57	Development platform
Expo Router	Navigation
TypeScript	Type safety
Zustand	State management
Socket.IO Client	Real-time communication
Reanimated	Animations


Backend
Technology	Purpose
Node.js	Runtime
TypeScript	Type safety
Express.js	REST API
Socket.IO	Real-time communication
MongoDB	Database
Mongoose	MongoDB ODM
JWT	Authentication
bcrypt	Password hashing
Zod	Validation


Native Audio
Native Audio
     │
     ├── Native audio processing
     ├── Device microphone access
     └── Oboe-based audio layer
DevOps
- Docker
- Docker Compose
- GitHub Actions
5. Quick Start
Prerequisites
- Node.js 20.19+
- npm
- MongoDB or Docker
- Expo development environment
- Android Studio for Android development
Backend
cd backend
npm install
npm run dev
Build
npm run build
Production
npm start
Database Check
npm run db:check
Mobile
cd mobile
npm install
npm start
Android
npm run android
iOS
npm run ios
Web
npm run web
6. Docker / Deployment
Start the complete backend stack:
docker compose up --build
Run in detached mode:
docker compose up --build -d
Check containers:
docker compose ps
View backend logs:
docker compose logs backend
View MongoDB logs:
docker compose logs mongo
Stop the stack:
docker compose down
Docker Architecture
             Docker Compose
                   │
          ┌────────┴────────┐
          ▼                 ▼
   ┌─────────────┐   ┌─────────────┐
   │   Backend   │   │   MongoDB   │
   │  Node.js 20 │──►│   Mongo 7   │
   │   Express   │   │             │
   │  Socket.IO  │   │ mongo_data  │
   └──────┬──────┘   └─────────────┘
          │
          ▼
       Port 3000
7. Testing
The current project does not define an npm test script.
Available validation commands:
Mobile
cd mobile
npm run lint
Backend
cd backend
npm run build
Database
npm run db:check
8. Architecture Diagrams / Documentation
Recommended documentation structure:
docs/
├── architecture/
│   ├── system-architecture.md
│   ├── realtime-flow.md
│   ├── audio-flow.md
│   └── data-flow.md
└── api/
    └── api-reference.md
Recommended diagrams:
- System Architecture
- Real-Time Event Flow
- Audio Flow
- Authentication Flow
- Database / Data Flow
Security Note
The repository currently contains:
github-actions-key
github-actions-key.pub
If github-actions-key contains an actual private key, rotate/revoke it and remove it from the repository and Git history.
Project Status
ROXSTAR currently includes:
- React Native + Expo mobile client
- Expo SDK 57
- Node.js + Express backend
- MongoDB persistence
- Socket.IO real-time communication
- Native audio module
- Docker infrastructure
- GitHub Actions workflowsvoice interaction, room-based collaboration, audio recording, and interactive multiplayer experiences.
The system is designed around a modular architecture consisting of a React Native mobile client, a Node.js/Express backend, MongoDB persistence, and Socket.IO real-time communication.
The project also contains a dedicated native-audio module for low-level audio capabilities, allowing the application to move beyond standard JavaScript-only audio handling when native performance and device-level audio access are required.
The backend provides authentication, room and application logic, database integration, and real-time communication, while the mobile application provides the user-facing experience.

**1. 📁 Repository Structure**
RoxStar/
│
├── .github/
│   └── workflows/              # GitHub Actions workflows
│
├── .vscode/                    # VS Code project configuration
│
├── backend/                    # Node.js + Express backend
│   ├── src/                    # Server-side application source
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── mobile/                     # React Native mobile application
│   ├── app/                    # Expo Router application
│   ├── assets/                 # Application assets
│   ├── package.json
│   └── app.json
│
├── native-audio/               # Native audio implementation
│
├── docker-compose.yml          # Backend + MongoDB orchestration
│
├── .gitignore
│
├── github-actions-key
├── github-actions-key.pub
│
└── README.md
The current repository contains separate backend, mobile, and native-audio components, with Docker Compose at the root for backend/database orchestration. GitHub

**2. 🎨 Product & Key Features**
🎙️ Voice Recording
ROXSTAR provides a mobile voice-recording experience designed around quick voice capture.
The mobile application requests microphone access and is configured with Android audio permissions for recording and audio settings. GitHub
Core recording capabilities include:
- Start / stop recording
- Recording duration
- Voice draft creation
- Editable draft naming
- Recording-state UI
- Local audio handling
- Native audio integration
👥 Real-Time Multiplayer Rooms
ROXSTAR is designed around a room-based multiplayer architecture.
Users can participate in shared rooms where application state can be synchronized through real-time communication.
The backend uses Socket.IO, while the mobile client uses socket.io-client. GitHub
This allows the application to support real-time events such as:
Mobile Client
     │
     │ Socket.IO
     ▼
Backend
     │
     ├── Room State
     ├── User State
     ├── Real-Time Events
     └── Application Events
🔐 Authentication & Security
The backend includes authentication-related dependencies and infrastructure for handling protected application functionality.
Current backend technologies include:
- JWT
- bcrypt
- Cookie Parser
- CORS
- Zod validation
- Environment-based configuration GitHub
🎡 Interactive Multiplayer Experience
ROXSTAR is structured to support interactive multiplayer game mechanics, including room-based participation and synchronized application state.
The architecture keeps important multiplayer state on the backend so that clients can synchronize their UI with server-side events rather than independently maintaining authoritative state.
💾 Persistent Application Data
MongoDB is used as the primary database through Mongoose.
The Docker environment provisions MongoDB 7 with a persistent Docker volume:
Application
     │
     ▼
Node.js Backend
     │
     ▼
Mongoose
     │
     ▼
MongoDB

**3.  Architecture / System Design**

ROXSTAR follows a **client-server real-time architecture**.

                    ┌─────────────────────┐
                    │     Mobile App      │
                    │ React Native / Expo │
                    └──────────┬──────────┘
                               │
                    REST / Socket.IO
                               │
                               ▼
                 ┌──────────────────────────┐
                 │       Node.js Backend     │
                 │                          │
                 │  Express REST API        │
                 │  Socket.IO Server        │
                 │  Authentication          │
                 │  Room Management         │
                 │  Application Logic       │
                 └────────────┬─────────────┘
                              │
                       Mongoose / MongoDB
                              │
                              ▼
                 ┌──────────────────────────┐
                 │        MongoDB           │
                 │                          │
                 │ Persistent Application   │
                 │ Data                     │
                 └──────────────────────────┘


                 ┌──────────────────────────┐
                 │       Native Audio       │
                 │                          │
                 │ Native Audio Processing  │
                 │ / Oboe Integration       │
                 └────────────┬─────────────┘
                              │
                              ▼
                       Device Microphone
Communication Model
ROXSTAR uses two primary communication mechanisms:
HTTP / REST
Used for request-response operations such as:
Client
  │
  │ HTTP Request
  ▼
Express
  │
  ▼
Business Logic
  │
  ▼
MongoDB
Socket.IO
Used for real-time application events:
Client A ───────┐
                │
Client B ───────┼──► Socket.IO Server
                │          │
Client C ───────┘          │
                           ▼
                    Broadcast Events
The backend's current dependency stack includes Express 5, Mongoose 9, Socket.IO 4, JWT, bcrypt and Zod. GitHub

**4.  Tech Stack**
Mobile
Technology	Purpose
React Native	Cross-platform mobile application
Expo SDK 57	Mobile development platform
Expo Router	Application navigation
TypeScript	Type-safe development
Zustand	Client-side state management
Socket.IO Client	Real-time communication
React Native Reanimated	Animations
Expo Dev Client	Native development workflow


The current mobile application uses Expo ~57.0.23, React Native 0.86.3, React 19.2.3, Zustand 5.0.15, and Socket.IO Client 4.8.3. GitHub
Backend
Technology	Purpose
Node.js	Server runtime
TypeScript	Type-safe backend development
Express.js	REST API
Socket.IO	Real-time communication
MongoDB	Database
Mongoose	MongoDB ODM
JWT	Authentication
bcrypt	Password hashing
Zod	Validation
dotenv	Environment configuration


The backend requires Node.js >=20.19.0. GitHub
Native Audio
Native Audio
     │
     ├── Native audio processing
     ├── Device microphone access
     └── Oboe-based audio layer
The repository maintains a separate native-audio module so native audio functionality can remain isolated from the main React Native application.
DevOps
Docker
Docker Compose
GitHub Actions
MongoDB Container
Node.js Container
The backend uses a multi-stage Node 20 Alpine Docker build. GitHub

**5. Quick Start**
Prerequisites
Make sure you have:
- Node.js 20.19+
- npm
- MongoDB or Docker
- Expo development environment
- Android Studio for Android native builds
Backend Setup
cd backend
Install dependencies:
npm install
Create your environment file:
.env
Example:
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/roxstar
JWT_SECRET=your_secret
Start development server:
npm run dev
Build the backend:
npm run build
Run production build:
npm start
Check database connectivity:
npm run db:check
These commands correspond to the current backend scripts. GitHub
Mobile Setup
Open a new terminal:
cd mobile
Install dependencies:
npm install
Start Expo:
npm start
For Android:
npm run android
For iOS:
npm run ios
For web:
npm run web
The current mobile package exposes these scripts directly. GitHub

**6. Docker / Deployment**
ROXSTAR includes Docker Compose configuration for running the backend together with MongoDB.
Start the complete backend stack
From the project root:
docker compose up --build
Run in detached mode:
docker compose up --build -d
Check running containers:
docker compose ps
View backend logs:
docker compose logs backend
View MongoDB logs:
docker compose logs mongo
Stop the stack:
docker compose down
Docker Architecture
                 Docker Compose
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
 ┌─────────────────┐       ┌─────────────────┐
 │     Backend     │       │     MongoDB     │
 │   Node.js 20    │──────►│      Mongo 7    │
 │   Express       │       │                 │
 │   Socket.IO     │       │  mongo_data     │
 └────────┬────────┘       └─────────────────┘
          │
          ▼
       Port 3000
The Compose configuration currently runs MongoDB 7 and the backend on port 3000, with a persistent mongo_data volume and a MongoDB health check before the backend starts. GitHub
The backend Dockerfile uses a builder stage to compile TypeScript and a production stage containing only production dependencies and the compiled dist output. GitHub
**7. Testing**
The project currently has development validation and linting support, but the backend package.json does not currently define an npm test script. GitHub
Mobile lint
cd mobile
npm run lint
Backend build validation
cd backend
npm run build
Database connectivity check
npm run db:check
For future development, automated unit, integration, API, and real-time Socket.IO tests can be added as the application grows.
8. 📐 Architecture Diagrams / Documentation
The architecture documentation for ROXSTAR can be organized around the following diagrams:
System Architecture
Mobile Application
        │
        ├── REST API
        │
        └── Socket.IO
                │
                ▼
          Node.js Backend
                │
                ▼
             MongoDB
Real-Time Event Flow
User Action
    │
    ▼
Mobile Client
    │
    │ Socket.IO Event
    ▼
Backend
    │
    ├── Validate
    ├── Update State
    └── Broadcast
          │
          ▼
    Connected Clients
Audio Flow
Microphone
    │
    ▼
Native Audio Layer
    │
    ▼
Audio Processing
    │
    ▼
Recording / Draft
    │
    ▼
Application Layer
Recommended documentation structure
docs/
├── architecture/
│   ├── system-architecture.md
│   ├── realtime-flow.md
│   ├── audio-flow.md
│   └── data-flow.md
│
└── api/
    └── api-reference.md
These documents can later contain Mermaid diagrams for the system architecture, Socket.IO event flow, audio pipeline, authentication flow, and database relationships.
🔐 Security Note
The current public repository contains files named:
github-actions-key
github-actions-key.pub
If github-actions-key contains an actual private SSH key, it should not remain in a public repository. Rotate/revoke that key and remove the secret from the repository/history before treating the repository as production-safe. The files are currently visible in the public repository root. GitHub
📌 Project Status
ROXSTAR is currently structured as a full-stack application with:
- React Native mobile client
- Expo SDK 57
- Node.js/Express backend
- MongoDB persistence
- Socket.IO real-time communication
- Native audio module
- Dockerized backend infrastructure
- GitHub Actions workflow infrastructure GitHub
