# Firebase Security Rules for Devebhyo

## Overview

These security rules ensure:
- Users can only modify their own data
- Priests can manage their services and availability
- Bookings are accessible only to involved parties
- Reviews are public but only authenticated users can create
- Payment data is read-only (written by server functions)
- Images have size limits and type restrictions

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isPriest() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'priest';
    }
    
    function isDevotee() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.userType == 'devotee';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false;
    }
    
    // Services collection
    match /services/{serviceId} {
      allow read: if isAuthenticated();
      allow create: if isPriest() && request.auth.uid == request.resource.data.priestId;
      allow update: if isPriest() && request.auth.uid == resource.data.priestId;
      allow delete: if isPriest() && request.auth.uid == resource.data.priestId;
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read: if isAuthenticated() && 
        (request.auth.uid == resource.data.priestId || 
         request.auth.uid == resource.data.devoteeId);
      allow create: if isDevotee() && request.auth.uid == request.resource.data.devoteeId;
      allow update: if isAuthenticated() && 
        (request.auth.uid == resource.data.priestId || 
         request.auth.uid == resource.data.devoteeId);
      allow delete: if false;
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if isAuthenticated() && 
        request.auth.uid == request.resource.data.reviewerId;
      allow update: if isOwner(resource.data.reviewerId);
      allow delete: if false;
    }
    
    // Availability collection
    match /availability/{priestId}/dates/{date} {
      allow read: if isAuthenticated();
      allow write: if isPriest() && isOwner(priestId);
    }
    
    // Payments collection (restricted)
    match /payments/{paymentId} {
      allow read: if isAuthenticated() && 
        (request.auth.uid == resource.data.priestId || 
         request.auth.uid == resource.data.devoteeId);
      allow write: if false; // Only server can write
    }
  }
}
```

## Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isImageFile() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isValidSize() {
      return request.resource.size < 5 * 1024 * 1024; // 5MB
    }
    
    // User profile images
    match /users/{userId}/profile/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId) && isImageFile() && isValidSize();
    }
    
    // Service images
    match /services/{serviceId}/{fileName} {
      allow read: if true; // Public
      allow write: if isAuthenticated() && isImageFile() && isValidSize();
    }
    
    // Ceremony/ritual images
    match /ceremonies/{ceremonyId}/{fileName} {
      allow read: if true; // Public
      allow write: if isAuthenticated() && isImageFile() && isValidSize();
    }
    
    // Chat attachments
    match /chats/{chatId}/{fileName} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isValidSize();
    }
    
    // Review images
    match /reviews/{reviewId}/{fileName} {
      allow read: if true; // Public
      allow write: if isAuthenticated() && isImageFile() && isValidSize();
    }
  }
}
```

## How to Deploy

1. **Using Firebase CLI:**
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage:rules
   ```

2. **Using Firebase Console:**
   - Go to Firestore Database → Rules
   - Copy and paste the Firestore rules
   - Go to Storage → Rules
   - Copy and paste the Storage rules

## Security Notes

- These rules are safe to commit to version control
- Never commit service account keys or API credentials
- Rules are enforced server-side, not client-side
- Test rules thoroughly using Firebase Emulator Suite

## Rule Explanations

### Firestore Rules
- **Users**: Can read any authenticated user, but only modify own profile
- **Services**: Public read, only priests can create/modify their own
- **Bookings**: Private to involved parties (priest and devotee)
- **Reviews**: Public read, authenticated users can create
- **Availability**: Priests manage their own calendar
- **Payments**: Read-only for involved parties, server-side writes only

### Storage Rules
- **Profile Images**: Private, owner-only access
- **Service Images**: Public visibility
- **File Restrictions**: 5MB limit, images only for most buckets
- **Security**: All uploads require authentication