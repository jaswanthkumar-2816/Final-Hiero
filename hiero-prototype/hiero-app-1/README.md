# HIERO App

## Overview
The HIERO app is a responsive web application designed for user authentication and resume analysis. It provides a seamless experience for students and job seekers to log in and access their respective functionalities.

## Features
- Glowing logo and title for a modern aesthetic.
- Two distinct login options: "Login as Student" and "Login as Job Seeker".
- Responsive design that adapts to various screen sizes.
- Integration with backend services for user authentication.

## Project Structure
```
hiero-app
├── public
│   ├── index.html          # Main HTML file
│   └── robots.txt         # Controls search engine indexing
├── src
│   ├── components
│   │   ├── LoginSelectionScreen.jsx  # Login selection screen component
│   │   └── Logo.jsx                  # Logo component
│   ├── pages
│   │   ├── StudentLogin.jsx          # Student login page component
│   │   └── JobSeekerLogin.jsx        # Job seeker login page component
│   ├── services
│   │   └── api.js                    # API interaction functions
│   ├── App.jsx                       # Main application component with routing
│   ├── index.js                      # Entry point for the React application
│   └── styles
│       └── styles.css                # Custom CSS styles
├── package.json                      # Project metadata and dependencies
├── tailwind.config.js                # Tailwind CSS configuration
├── postcss.config.js                 # PostCSS configuration
└── README.md                         # Project documentation
```

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   cd hiero-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000` to view the application.

## Usage
- Upon loading, users will see the login selection screen.
- Users can choose to log in as a Student or a Job Seeker.
- The application will handle navigation and authentication through the backend services.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.