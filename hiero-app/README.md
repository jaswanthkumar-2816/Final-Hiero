# HIERO App

Welcome to the HIERO app! This application provides a platform for students and job seekers to connect and access resources tailored to their needs.

## Project Structure

The project is organized as follows:

```
hiero-app
├── public
│   ├── index.html         # Main HTML file for the React application
│   └── favicon.ico        # Favicon for the application
├── src
│   ├── components         # Contains React components
│   │   ├── LoginSelectionScreen.tsx  # Login selection screen component
│   │   └── Logo.tsx      # Logo component
│   ├── styles             # Contains custom CSS styles
│   │   └── styles.css     # Custom styles for the application
│   ├── App.tsx           # Main application component with routing
│   ├── index.tsx         # Entry point of the application
│   └── react-app-env.d.ts # TypeScript definitions for the React app environment
├── package.json           # npm configuration file with dependencies and scripts
├── tsconfig.json          # TypeScript configuration file
├── tailwind.config.js     # Tailwind CSS configuration file
├── postcss.config.js      # PostCSS configuration file for processing Tailwind CSS
└── README.md              # Documentation for the project
```

## Features

- **Responsive Design**: The application is designed to be responsive and works well on various screen sizes.
- **Glowing Effects**: The login selection screen features glowing text and buttons for an engaging user experience.
- **Navigation**: Users can easily navigate to the login pages for students or job seekers.

## Getting Started

To get started with the HIERO app, follow these steps:

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd hiero-app
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and go to `http://localhost:3000` to view the application.

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- React Router

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.