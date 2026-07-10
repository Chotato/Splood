# Splood 🍝

**Splood** is a real-time, location-based social dining application. It connects nearby individuals who want to share a meal or split a dish at a local restaurant!

## Features

- **📍 Precise Geolocation:** Interactive map powered by Leaflet to drop a pin on your exact location.
- **📡 Real-Time Splood Feed:** Broadcast your dining requests and see nearby requests instantly.
- **📏 Distance Filtering:** Advanced geolocation algorithms (Haversine formula) calculate exactly how far away other users are and filter your feed based on your custom search radius.
- **💬 Live Chat:** Click "Splood!" on a nearby request to instantly open a private, real-time chat room with that user.
- **⏳ Smart Data Lifecycle:** Your feed stays fresh. Active requests are capped at 3 per user, and any request older than 1 hour is automatically hidden.
- **🔐 Secure Authentication:** Full user accounts powered by Firebase Authentication.

## Tech Stack

- **Frontend:** Next.js (App Router), React, TypeScript
- **Backend & Database:** Firebase (Firestore, Auth)
- **Maps:** Leaflet.js, React-Leaflet, OpenStreetMap Nominatim API
- **Styling:** Custom CSS (Glassmorphism, Dark Mode)

## Live Deployment

This project is fully deployed and hosted on **Vercel**. 
You do not need to run this locally! Simply visit the live URL to start splooding.

*(If you are the repository owner, you can find your live Vercel URL in your Vercel Dashboard or GitHub deployment environments).*
