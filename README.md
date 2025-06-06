# Collaborative Decision Maker

A Node.js application for facilitating collaborative decision-making through a structured three-phase workflow.

## Overview

This application provides a platform for teams to make decisions collaboratively by:

1. Defining and sharing criteria that matter to them
2. Evaluating candidates against these criteria
3. Analyzing results and making informed decisions

## Features

### Phase 1: Definition

- Create and join decision-making topics
- Define personal criteria important to the decision
- Share selected criteria with the team
- Rank-order criteria by importance

### Phase 2: Collection

- Add candidates to be evaluated
- Score each candidate against each criterion
- Private evaluations without seeing others' scores
- Add notes to explain evaluations

### Phase 3: Decision

- View visualizations of aggregated scores
- See average scores and score variance
- Create personalized rankings of candidates
- Identify discrepancies between evaluations and rankings
- Get suggestions for new criteria based on scoring patterns

### Other Features

- Real-time updates via Socket.io
- Demo mode with mock data
- User management
- Responsive design

## Architecture Overview

The Collaborative Decision Maker is built as a modern web application with a clear separation between backend services, data layer, and frontend interfaces. The system follows a three-phase workflow that guides users through structured decision-making.

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER                            │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser                                                    │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   EJS Templates │ │  Client-side JS │ │   Socket.io     │   │
│  │   (Views)       │ │  (Interactions) │ │  (Real-time)    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                            HTTP/WebSocket
                                  │
┌─────────────────────────────────────────────────────────────────┐
│                       APPLICATION TIER                          │
├─────────────────────────────────────────────────────────────────┤
│  Node.js + Express Server                                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │     Routes      │ │   Controllers   │ │   Socket.io     │   │
│  │  (API Endpoints)│ │ (Business Logic)│ │   (Events)      │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                              Mongoose ODM
                                  │
┌─────────────────────────────────────────────────────────────────┐
│                          DATA TIER                              │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB Database                                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Collections   │ │     Indexes     │ │   Relationships │   │
│  │  (Data Storage) │ │  (Performance)  │ │   (References)  │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Model Relationships

The application's data model supports the three-phase workflow with interconnected entities:

```
                    ┌─────────────┐
                    │    User     │
                    │             │
                    │ - name      │
                    │ - email     │
                    └──────┬──────┘
                           │
                    participates in
                           │
                    ┌──────▼──────┐         ┌─────────────┐
                    │    Topic    │◄────────│   Criterion │
                    │             │         │             │
                    │ - name      │ defines │ - name      │
                    │ - phase     │         │ - rank      │
                    │ - description│        │ - isShared  │
                    └──────┬──────┘         └─────────────┘
                           │                        │
                     contains │                    │ evaluates
                           │                        │
                    ┌──────▼──────┐                 │
                    │  Candidate  │                 │
                    │             │                 │
                    │ - name      │                 │
                    │ - description│◄───────────────┘
                    └─────────────┘         
                           │                 ┌─────────────┐
                           └─────────────────│ Evaluation  │
                                             │             │
                                             │ - score     │
                                             │ - notes     │
                                             └─────────────┘
                                                     │
                                             ┌───────▼─────────┐
                                             │ CandidateRanking│
                                             │                 │
                                             │ - rankings[]    │
                                             └─────────────────┘
```

### Three-Phase Workflow

The application enforces a structured decision-making process:

1. **Phase 1 - Definition**: Users define and rank criteria
2. **Phase 2 - Collection**: Users score candidates against criteria  
3. **Phase 3 - Decision**: Users analyze results and create rankings

### Technical Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Templating**: EJS
- **Real-time Communication**: Socket.io
- **Visualization**: Chart.js
- **Drag and Drop**: SortableJS

### Request Flow and Real-time Updates

The application handles both traditional HTTP requests and real-time WebSocket communication:

```
Client Browser                    Express Server                 MongoDB
      │                                │                           │
      ├─ HTTP Request ────────────────►│                           │
      │  (GET/POST/PATCH/DELETE)       │                           │
      │                                ├─ Route Handler ─────────►│
      │                                │   (topicRoutes.js)        │
      │                                │                           │
      │                                │◄─ Mongoose Query ────────┤
      │                                │   (Model.find/save)       │
      │◄─ JSON Response ──────────────┤                           │
      │                                │                           │
      ├─ WebSocket Connection ────────►│                           │
      │  (Socket.io)                   │                           │
      │                                │                           │
      │◄─ Real-time Events ───────────┤                           │
      │  (criterionAdded,              │                           │
      │   candidateAdded,              │                           │
      │   evaluationAdded)             │                           │
```

**Socket.io Events:**
- `joinTopic` - User joins a topic room for real-time updates
- `newCriterion` - Broadcast when criteria are added/shared
- `newCandidate` - Broadcast when candidates are added
- `newEvaluation` - Broadcast when evaluations are submitted

### Data Flow Through Phases

```
Phase 1: Definition
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ User defines    │───►│ Criterion saved │───►│ Socket broadcast│
│ personal        │    │ to database     │    │ to topic        │
│ criteria        │    │                 │    │ participants    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ User ranks      │───►│ Criterion.rank  │
│ criteria by     │    │ updated         │
│ importance      │    │                 │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ User shares     │───►│ Criterion.      │
│ selected        │    │ isShared = true │
│ criteria        │    │                 │
└─────────────────┘    └─────────────────┘

Phase 2: Collection  
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ User adds       │───►│ Candidate       │───►│ Socket broadcast│
│ candidates      │    │ created         │    │ to participants │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ User evaluates  │───►│ Evaluation      │───►│ Socket broadcast│
│ candidates on   │    │ record created  │    │ (private scores)│
│ each criterion  │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘

Phase 3: Decision
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ System          │───►│ Aggregated      │───►│ Charts and      │
│ calculates      │    │ scores          │    │ visualizations  │
│ averages        │    │ computed        │    │ rendered        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│ User creates    │───►│ CandidateRanking│
│ final rankings  │    │ saved           │
│                 │    │                 │
└─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ System detects  │
│ discrepancies   │
│ between scores  │
│ and rankings    │
└─────────────────┘
```

### Getting Started

### Prerequisites

- Node.js
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the application:
   ```
   npm start
   ```
   
   For development with auto-restart:
   ```
   npm run dev
   ```

4. Access the application at `http://localhost:3000`

### Demo Mode

Click the "Start Demo Mode" button on the homepage to initialize the application with sample data including:

- Demo users
- Sample topics
- Pre-defined criteria
- Sample candidates
- Evaluation data

## Project Structure

```
collaborative-decision-maker/
├── config/              # Configuration files
│   └── config.js        # Database and server configuration
├── controllers/         # Business logic controllers
│   └── dashboardController.js
├── models/              # MongoDB schemas with Mongoose
│   ├── User.js          # User accounts and relationships
│   ├── Topic.js         # Decision topics and phases
│   ├── Criterion.js     # Evaluation criteria (personal/shared)
│   ├── Candidate.js     # Options being evaluated
│   ├── Evaluation.js    # User scores for candidate-criterion pairs
│   └── CandidateRanking.js # Final user rankings
├── routes/              # Express API route handlers
│   ├── userRoutes.js    # User management endpoints
│   ├── topicRoutes.js   # Topic CRUD and phase management
│   ├── criteriaRoutes.js # Criteria definition and sharing
│   ├── candidateRoutes.js # Candidate management
│   ├── evaluationRoutes.js # Scoring and evaluation
│   └── demoRoutes.js    # Demo data initialization
├── public/              # Static client-side assets
│   ├── css/
│   │   └── style.css    # Application styles
│   └── js/
│       ├── main.js      # Common utilities and API helpers
│       ├── dashboard.js # Dashboard interactions
│       └── topic.js     # Topic workflow and phase management
├── views/               # EJS server-side templates
│   ├── partials/        # Reusable template components
│   ├── index.ejs        # Landing page
│   ├── dashboard.ejs    # User dashboard
│   └── topic.ejs        # Topic workflow interface
├── server.js            # Application entry point and Express setup
└── package.json         # Dependencies and scripts
```

### API Endpoints

The application exposes RESTful APIs organized by resource:

```
/api/users              # User management
├── GET    /            # List all users
├── POST   /            # Create new user
├── GET    /:id         # Get user details
└── PATCH  /:id         # Update user

/api/topics             # Topic management
├── GET    /            # List all topics
├── POST   /            # Create new topic
├── GET    /:id         # Get topic details
├── PATCH  /:id         # Update topic
├── PATCH  /:id/phase   # Advance/change topic phase
└── POST   /:id/participants # Add participant

/api/criteria           # Criteria management
├── GET    /topic/:topicId      # Get criteria for topic
├── POST   /                    # Create new criterion
├── PATCH  /:id                 # Update criterion
├── DELETE /:id                 # Delete criterion
└── PATCH  /:id/share          # Share criterion

/api/candidates         # Candidate management
├── GET    /topic/:topicId      # Get candidates for topic
├── POST   /                    # Create new candidate
├── PATCH  /:id                 # Update candidate
└── DELETE /:id                 # Delete candidate

/api/evaluations        # Scoring and evaluation
├── GET    /topic/:topicId      # Get evaluations for topic
├── POST   /                    # Submit evaluation
├── PATCH  /:id                 # Update evaluation
└── GET    /aggregated/:topicId # Get aggregated scores

/demo                   # Demo data management
└── POST   /init        # Initialize demo data
```

## License

ISC

## Background

The Collaborative Decision Maker application was developed to address the challenges teams face when making decisions collectively. Traditional decision-making processes can be time-consuming and may not effectively incorporate diverse perspectives. This application aims to streamline the process by providing a structured workflow that encourages collaboration and transparency.

I had a [conversation with herbie](https://ai.bluehive.com/session/uCGXm4b6hdScWkcSv#FXlaNhMmLT5ksLHi2xZF9KbQzjDxMt8uZLTHjJLkvTk) to get it kicked off.
