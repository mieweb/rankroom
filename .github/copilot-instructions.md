<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Collaborative Decision Maker

This is a Node.js Express application for a collaborative decision-making tool. The tool supports a three-phase workflow for group decision making:

1. **Definition Phase**: Users define and rank-order criteria important to them
2. **Collection Phase**: Users score candidates against criteria
3. **Decision Phase**: Users analyze results with visualizations

## Technologies

- Node.js with Express for the backend
- MongoDB with Mongoose for data storage
- EJS for templating
- Socket.io for real-time communication
- Chart.js for data visualization
- Bootstrap 5 for UI components

## Project Structure

- `models/`: MongoDB schemas
- `routes/`: Express routes for API endpoints
- `controllers/`: Business logic
- `views/`: EJS templates
- `public/`: Static assets (CSS, client-side JavaScript)
- `config/`: Configuration files

## Key Features

- Three-phase workflow
- Personal and shared criteria
- Independent candidate evaluations
- Score visualization
- Discrepancy detection
- Demo mode with mock data

When suggesting code changes, keep this workflow and the relationships between topics, criteria, candidates, and evaluations in mind.
