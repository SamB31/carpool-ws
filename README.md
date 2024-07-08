Carpool App
Overview

This project is a carpool application designed to manage and track carpool check-ins and check-outs using WebSockets for real-time updates and has a companion iOS app. The backend is built with Node.js, Express, Sequelize ORM for SQLite database interactions, and WebSockets for real-time communication. It also includes CSV file operations for historical data management.
Key Features

    Real-Time Updates: Utilizes WebSockets to broadcast real-time updates to all connected clients.
    Database Management: Uses Sequelize ORM for managing family, inline, and historical data.
    CSV Integration: Supports reading from and writing to CSV files for data import/export.
    Web and iOS Compatibility: The server serves a web application and communicates with an iOS app for carpool management.

Application Structure
Database Models

    Family: Stores family member details.
    InLine: Tracks families currently in the carpool line.
    Historical: Stores historical carpool data.

Server-Side Code
Dependencies

    http, fs, csv-parser, sequelize, express, body-parser, multer, path, ws.

WebSocket Communication

    Broadcasting Messages: Sends real-time updates to all connected WebSocket clients.
    Handling Client Messages: Processes messages from clients to provide initial or historical data based on the requested page.

HTTP Server

    Express Middleware: Serves static files and parses incoming request bodies.
    Routes:
        GET /: Serves the main index page.
        GET /historical: Serves the historical data page.
        GET /carpool: Serves the carpool management page.
        POST /submit-check-in: Handles carpool check-in requests.
        POST /submit-check-out: Handles carpool check-out requests.
        POST /submit-end: Ends the carpool session and clears data.
