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

## Technical Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Templating**: EJS
- **Real-time Communication**: Socket.io
- **Visualization**: Chart.js
- **Drag and Drop**: SortableJS

## Getting Started

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
├── controllers/         # Business logic
├── models/              # Database models
├── public/              # Static assets
│   ├── css/             # Stylesheets
│   └── js/              # Client-side JavaScript
├── routes/              # API routes
├── views/               # EJS templates
│   └── partials/        # Reusable template parts
├── server.js            # Application entry point
└── package.json         # Project dependencies
```

## License

ISC

## Background

The Collaborative Decision Maker application was developed to address the challenges teams face when making decisions collectively. Traditional decision-making processes can be time-consuming and may not effectively incorporate diverse perspectives. This application aims to streamline the process by providing a structured workflow that encourages collaboration and transparency.

I had a [conversation with herbie](https://ai.bluehive.com/session/uCGXm4b6hdScWkcSv#FXlaNhMmLT5ksLHi2xZF9KbQzjDxMt8uZLTHjJLkvTk) to get it kicked off.
