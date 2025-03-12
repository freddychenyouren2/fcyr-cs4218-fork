# E-Commerce Application

This is a full-stack e-commerce application built with the MERN stack (MongoDB, Express, React, Node.js).

## Continuous Integration

Our project uses GitHub Actions for continuous integration. The CI pipeline runs tests automatically on every push to the main branch and on pull requests.

**CI URL:** https://github.com/cs4218/cs4218-2420-ecom-project-team04-1/actions/workflows/main.yml

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm (v8 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Git

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=6060
DEV_MODE=development
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
BRAINTREE_MERCHANT_ID=your_braintree_merchant_id
BRAINTREE_PUBLIC_KEY=your_braintree_public_key
BRAINTREE_PRIVATE_KEY=your_braintree_private_key
```

### Frontend Environment Variables

The frontend already has a `.env` file with:

```
REACT_APP_API=http://localhost:6060
```

## Installation

### Clone the repository

```bash
git clone https://github.com/cs4218/cs4218-2420-ecom-project-team04-1
cd cs4218-2420-ecom-project-team04-1
```

### Install backend dependencies

```bash
npm install
```

### Install frontend dependencies

```bash
cd client
npm install
cd ..
```

## Running the Application

### Development Mode

To run both the backend and frontend concurrently:

```bash
npm run dev
```

This will start:

- Backend server on http://localhost:6060
- Frontend development server on http://localhost:3000

### Running Backend Only

```bash
npm run server
```

### Running Frontend Only

```bash
npm run client
```

## Testing

### Running All Tests

```bash
npm test
```

### Running Frontend Tests

```bash
npm run test:frontend
```

### Running Backend Tests

```bash
npm run test:backend
```

## Project Structure

```
├── client/                 # React frontend
│   ├── public/             # Public assets
│   ├── src/                # React source code
│   └── package.json        # Frontend dependencies
├── config/                 # Backend configuration
├── controllers/            # Route controllers
├── middlewares/            # Express middlewares
├── models/                 # Mongoose models
├── routes/                 # API routes
├── tests/                  # Test files
├── .github/                # GitHub Actions workflows
├── server.js              # Express server entry point
└── package.json           # Backend dependencies
```

## API Endpoints

The API is available at `http://localhost:6060/api/v1/` with the following routes:

- **Auth**: `/api/v1/auth`
- **Categories**: `/api/v1/category`
- **Products**: `/api/v1/product`

## SonarQube Integration

This project includes SonarQube for code quality analysis. To run SonarQube:

1. Ensure SonarQube server is running on http://localhost:9000
2. Run the analysis:

```bash
npm run sonarqube
```

## Troubleshooting

- **MongoDB Connection Issues**: Ensure your MongoDB server is running and the connection string in `.env` is correct.
- **Port Conflicts**: If port 6060 or 3000 is already in use, you can change the port in the respective configuration files.
- **Missing Environment Variables**: Make sure all required environment variables are set in the `.env` file.
