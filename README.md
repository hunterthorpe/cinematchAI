# Cinematch AI

An intelligent movie recommendation engine that suggests the perfect film for a group to watch. Built with a modern serverless architecture on AWS, Cinematch AI leverages the power of Google's Gemini API to understand collective taste and provide unique, high-quality suggestions.

---

## Technology Stack & Architecture

This project was built using a modern, scalable, and secure full-stack architecture, emphasizing professional development practices.

### Frontend
-   **Framework:** **React**
-   **Language:** **TypeScript**
-   **Build Tool:** **Vite**
-   **Styling:** **Tailwind CSS**

### Backend (Serverless)
-   **Runtime:** **Node.js** with **Express.js**
-   **AI Engine:** **Google Gemini API** (`gemini-2.5-flash`)
-   **Movie Data:** **The Movie Database (TMDb) API**

### Cloud & Deployment
-   **Platform:** **AWS Amplify**
-   **Hosting:** CI/CD pipeline from GitHub for automatic builds and deployments.
-   **Backend Infrastructure:**
    -   **AWS Lambda** for running the serverless Express API.
    -   **Amazon API Gateway** to create and manage the REST endpoint.

---
