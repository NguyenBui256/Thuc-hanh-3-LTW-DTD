# Photo Sharing Application

This is a photo sharing application with a React frontend and Express backend.

## Setup Instructions

1. Install dependencies:
```
npm install
```

2. Set up MongoDB:
   - Make sure your `.env` file contains the MongoDB connection string:
   ```
   DB_URL=mongodb+srv://username:password@cluster.mongodb.net/photo_sharing?retryWrites=true&w=majority
   ```

3. Run the backend server:
```
npm run dev:server
```

4. In a separate terminal, run the React frontend:
```
npm start
```

## API Endpoints

### User List
```
GET /user/list
```
Returns a list of users for the navigation sidebar with _id, first_name, and last_name.

### User Details
```
GET /user/:id
```
Returns detailed information for a specific user with _id, first_name, last_name, location, description, and occupation.

### Photos of a User
```
GET /photosOfUser/:id
```
Returns the photos of a specific user along with comments and minimal user information for each comment.

## Technologies Used

- React
- Express
- MongoDB with Mongoose
- Node.js
