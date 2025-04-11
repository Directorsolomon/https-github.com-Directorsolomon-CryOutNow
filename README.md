CryOutNow - Prayer Request Community
CryOutNow is a web application that allows users to share prayer requests, pray for others, and build a supportive faith community. This platform enables users to post public or private prayer requests, interact with others through prayers and comments, and manage their personal profiles.

CryOutNow Logo

Table of Contents
Features
Technology Stack
Getting Started
Prerequisites
Installation
Environment Variables
Usage
Authentication
Creating Prayer Requests
Interacting with Prayer Requests
Profile Management
Architecture
Database Schema
Component Structure
Deployment
Contributing
License
Features
User Authentication: Secure sign-up and login with email/password or Google OAuth
Prayer Request Management: Create, view, and delete prayer requests
Media Support: Attach images to prayer requests
Privacy Controls: Choose between public and private prayer requests
Community Interaction: Pray for others' requests and leave comments
Profile Customization: Update profile information, avatar, and cover images
Responsive Design: Optimized for both desktop and mobile devices
Real-time Updates: See new prayers and comments without refreshing
Technology Stack
Frontend:
React with TypeScript
Vite for build tooling
Tailwind CSS for styling
Shadcn UI components
React Router for navigation
Backend:
Supabase for authentication, database, and storage
PostgreSQL database
Supabase Storage for image hosting
Deployment:
Vercel for hosting
Custom domain (cryoutnow.com)
Vercel Analytics for usage tracking
Getting Started
Prerequisites
Node.js (v16 or higher)
npm or yarn
Supabase account
Installation
Clone the repository:
Install dependencies:
Create a Supabase project and set up the database schema (see Database Schema section).
Create a .env file in the root directory with your Supabase credentials (see Environment Variables section).
Start the development server:
Loading...
Open your browser and navigate to http://localhost:5173
Environment Variables
Create a .env file in the root directory with the following variables:

Usage
Authentication
Sign Up: Create a new account using email/password or Google authentication.
Sign In: Log in with your credentials or Google account.
Password Reset: Use the "Forgot Password" link if you need to reset your password.
Creating Prayer Requests
Click the "+" button on the home page or use the "Create Prayer Request" button.
Enter your prayer request content.
(Optional) Attach an image by clicking the image icon.
Toggle the privacy setting to make the request public or private.
Click "Post" to submit your prayer request.
Interacting with Prayer Requests
Praying: Click the hand-heart icon to pray for a request.
Commenting: Click the comment icon to view and add comments.
Sharing: Use the share icon to share a prayer request.
Deleting: If you're the owner, use the menu (three dots) to delete your request.
Profile Management
Navigate to your profile page by clicking your username or avatar.
Update your profile information, including username and bio.
Change your avatar by clicking the camera icon on your profile picture.
Update your cover image by clicking the camera icon on the cover area.
View and manage your prayer requests from the profile page.
Architecture
Database Schema
The application uses the following Supabase tables:

profiles
id (UUID, primary key)
username (text)
full_name (text)
avatar_url (text)
cover_url (text)
created_at (timestamp)
updated_at (timestamp)
prayer_requests
id (UUID, primary key)
user_id (UUID, foreign key to profiles.id)
content (text)
is_public (boolean)
created_at (timestamp)
image_url (text)
prayer_interactions
id (UUID, primary key)
user_id (UUID, foreign key to profiles.id)
prayer_request_id (UUID, foreign key to prayer_requests.id)
created_at (timestamp)
comments
id (UUID, primary key)
profile_id (UUID, foreign key to profiles.id)
prayer_request_id (UUID, foreign key to prayer_requests.id)
content (text)
created_at (timestamp)
Component Structure
The application is organized into the following main components:

Auth Components: Handle user authentication (AuthForm, AuthCallback)
Layout Components: Provide consistent layout (Header)
Page Components: Main page views (LandingPage, Home, ProfilePage)
Feature Components: Specific features (PrayerRequestCard, PrayerRequestForm, PrayerRequestDetail, CommentDialog)
UI Components: Reusable UI elements (buttons, inputs, dialogs)
Deployment
CryOutNow is deployed on Vercel with the domain cryoutnow.com.

To deploy your own instance:

Create a Vercel account and connect it to your GitHub repository.
Set up the environment variables in the Vercel dashboard.
Configure your custom domain if desired.
Deploy the application.
Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

Fork the repository
Create your feature branch (git checkout -b feature/amazing-feature)
Commit your changes (git commit -m 'Add some amazing feature')
Push to the branch (git push origin feature/amazing-feature)
Open a Pull Request
License
This project is licensed under the MIT License - see the LICENSE file for details.

Contact
For questions or support, please contact us at support@cryoutnow.com.

"And pray in the Spirit on all occasions with all kinds of prayers and requests." - Ephesians 6:18

