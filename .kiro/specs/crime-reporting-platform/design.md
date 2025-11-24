# Design Document

## Overview

The Crime Reporting and Community Verification Platform is a real-time web application built with Svelte, Firebase, and Google Gemini AI. The system enables citizens to report crimes with location data and media, allows community verification through voting and commenting, and provides an interactive map visualization of crime data. The architecture follows a serverless approach using Firebase services for authentication, data storage, and real-time synchronization.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Svelte)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth UI    │  │  Crime Feed  │  │  Map View    │      │
│  │  Components  │  │  Components  │  │  (Leaflet)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Svelte Stores  │
                    │  (State Mgmt)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│    Firebase    │  │    Firestore    │  │    Firebase    │
│ Authentication │  │   (Database)    │  │    Storage     │
└───────┬────────┘  └────────┬────────┘  └───────┬────────┘
        │                    │                    │
        │           ┌────────▼────────┐           │
        │           │  Real-time      │           │
        │           │  Listeners      │           │
        │           └─────────────────┘           │
        │                                         │
        └─────────────────┬───────────────────────┘
                          │
                  ┌───────▼────────┐
                  │  Google Gemini │
                  │   AI API       │
                  └────────────────┘
```

### Component Architecture

The application follows a component-based architecture with clear separation of concerns:

1. **Presentation Layer**: Svelte components for UI rendering
2. **State Management Layer**: Svelte stores for reactive state
3. **Service Layer**: Firebase SDK integration and API calls
4. **Data Layer**: Firestore collections and Firebase Storage

## Components and Interfaces

### Frontend Components

#### Authentication Components

**LoginForm.svelte**
- Handles email/password and phone/OTP authentication
- Props: None
- Events: `on:success` (emits user object)
- Uses: Firebase Authentication SDK

**RegisterForm.svelte**
- User registration with email or phone
- Props: None
- Events: `on:success` (emits user object)
- Uses: Firebase Authentication SDK

#### Crime Report Components

**ReportForm.svelte**
- Form for creating new crime reports
- Props: None
- Events: `on:submit` (emits report data)
- Uses: Firestore, Firebase Storage, Google Gemini API

**ReportCard.svelte**
- Displays individual crime report
- Props: `report` (Report object), `compact` (boolean)
- Events: `on:vote`, `on:comment`, `on:flag`
- Uses: Firestore for real-time updates

**ReportList.svelte**
- Displays list of crime reports with filtering
- Props: `filters` (FilterOptions)
- Events: `on:select` (emits report ID)
- Uses: Firestore queries

#### Map Components

**CrimeMap.svelte**
- Interactive map with crime markers
- Props: `reports` (Report[]), `center` (LatLng)
- Events: `on:markerClick`, `on:locationSelect`
- Uses: Leaflet, OpenStreetMap, marker clustering

**LocationPicker.svelte**
- Map-based location selector
- Props: `initialLocation` (LatLng)
- Events: `on:select` (emits LatLng)
- Uses: Leaflet

#### Interaction Components

**VoteButtons.svelte**
- Upvote/downvote interface
- Props: `reportId` (string), `userVote` (Vote)
- Events: `on:vote` (emits vote type)
- Uses: Firestore transactions

**CommentSection.svelte**
- Comment display and input
- Props: `reportId` (string)
- Events: `on:comment` (emits comment text)
- Uses: Firestore real-time listeners

#### Admin/Moderation Components

**ModerationPanel.svelte**
- Moderation actions interface
- Props: `reportId` (string)
- Events: `on:flag`, `on:remove`
- Uses: Firestore, Firebase Functions

**UserManagement.svelte**
- Admin panel for role management
- Props: None
- Events: `on:roleChange`
- Uses: Firestore, custom claims

### Service Interfaces

#### AuthService

```typescript
interface AuthService {
  signUpWithEmail(email: string, password: string): Promise<User>
  signInWithEmail(email: string, password: string): Promise<User>
  signInWithPhone(phoneNumber: string): Promise<ConfirmationResult>
  confirmPhoneCode(confirmationResult: ConfirmationResult, code: string): Promise<User>
  signOut(): Promise<void>
  getCurrentUser(): User | null
  onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe
}
```

#### ReportService

```typescript
interface ReportService {
  createReport(report: CreateReportInput): Promise<string>
  getReport(reportId: string): Promise<Report>
  getReports(filters: FilterOptions): Promise<Report[]>
  subscribeToReports(filters: FilterOptions, callback: (reports: Report[]) => void): Unsubscribe
  updateReport(reportId: string, updates: Partial<Report>): Promise<void>
  deleteReport(reportId: string): Promise<void>
}
```

#### VoteService

```typescript
interface VoteService {
  vote(reportId: string, voteType: 'up' | 'down'): Promise<void>
  removeVote(reportId: string): Promise<void>
  getUserVote(reportId: string): Promise<Vote | null>
}
```

#### CommentService

```typescript
interface CommentService {
  addComment(reportId: string, text: string): Promise<string>
  getComments(reportId: string): Promise<Comment[]>
  subscribeToComments(reportId: string, callback: (comments: Comment[]) => void): Unsubscribe
  deleteComment(commentId: string): Promise<void>
}
```

#### AIService

```typescript
interface AIService {
  analyzeText(text: string): Promise<AIAnalysis>
  analyzeImage(imageUrl: string): Promise<AIAnalysis>
  analyzeCrimeReport(description: string, imageUrls: string[]): Promise<CrimeAnalysis>
}
```

#### StorageService

```typescript
interface StorageService {
  uploadFile(file: File, path: string): Promise<string>
  deleteFile(url: string): Promise<void>
  getDownloadURL(path: string): Promise<string>
}
```

## Data Models

### User Model

```typescript
interface User {
  uid: string
  email?: string
  phoneNumber?: string
  displayName?: string
  role: 'citizen' | 'moderator' | 'admin'
  createdAt: Timestamp
  updatedAt: Timestamp
  suspended: boolean
}
```

**Firestore Collection**: `users`
**Document ID**: Firebase Auth UID

### Report Model

```typescript
interface Report {
  id: string
  authorId: string
  authorName: string
  title: string
  description: string
  crimeType: string
  location: {
    latitude: number
    longitude: number
    address?: string
  }
  mediaUrls: string[]
  aiAnalysis?: {
    summary: string
    severity: 'low' | 'medium' | 'high'
    categories: string[]
    confidence: number
  }
  upvotes: number
  downvotes: number
  commentCount: number
  status: 'active' | 'flagged' | 'removed'
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Firestore Collection**: `reports`
**Indexes**: 
- `createdAt` (descending)
- `crimeType`, `createdAt` (descending)
- `status`, `createdAt` (descending)

### Vote Model

```typescript
interface Vote {
  id: string
  reportId: string
  userId: string
  voteType: 'up' | 'down'
  createdAt: Timestamp
}
```

**Firestore Collection**: `reports/{reportId}/votes`
**Document ID**: User ID (ensures one vote per user per report)

### Comment Model

```typescript
interface Comment {
  id: string
  reportId: string
  authorId: string
  authorName: string
  text: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**Firestore Collection**: `reports/{reportId}/comments`
**Indexes**: `createdAt` (ascending)

### ModerationLog Model

```typescript
interface ModerationLog {
  id: string
  moderatorId: string
  action: 'flag' | 'remove' | 'suspend' | 'restore'
  targetType: 'report' | 'comment' | 'user'
  targetId: string
  reason?: string
  createdAt: Timestamp
}
```

**Firestore Collection**: `moderation_logs`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication State Consistency

*For any* user authentication action (login, logout, registration), the authentication state in the Svelte store should match the Firebase Authentication state within 1 second.

**Validates: Requirements 1.1, 1.2, 1.3, 1.5**

### Property 2: Vote Uniqueness

*For any* user and report combination, there should exist at most one vote document in the votes subcollection, ensuring users cannot vote multiple times on the same report.

**Validates: Requirements 3.4**

### Property 3: Vote Count Consistency

*For any* report, the upvotes and downvotes counts in the report document should equal the count of corresponding vote documents in the votes subcollection.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Real-time Update Propagation

*For any* data change (new report, vote, comment), all connected clients should receive the update within 1 second through Firestore real-time listeners.

**Validates: Requirements 2.6, 3.5, 4.2, 5.4**

### Property 5: Media Storage Consistency

*For any* uploaded media file, if the Firebase Storage upload succeeds, then the media URL should be stored in the report document, and if the upload fails, no URL should be added.

**Validates: Requirements 2.2**

### Property 6: Location Data Validity

*For any* crime report with location data, the latitude should be between -90 and 90, and the longitude should be between -180 and 180.

**Validates: Requirements 2.3**

### Property 7: AI Analysis Idempotency

*For any* crime report, running AI analysis multiple times on the same content should produce consistent results (same categories and similar confidence scores).

**Validates: Requirements 2.4, 2.5**

### Property 8: Role-Based Access Control

*For any* moderation action, only users with role 'moderator' or 'admin' should be able to execute the action, and the Firestore security rules should enforce this.

**Validates: Requirements 6.1, 6.2, 6.3, 7.1, 7.2**

### Property 9: Comment Ordering

*For any* report's comment list, comments should be ordered chronologically by createdAt timestamp in ascending order.

**Validates: Requirements 4.3**

### Property 10: Filter Consistency

*For any* applied filter (crime type, date range), the displayed reports should match the filter criteria, and no reports outside the criteria should be shown.

**Validates: Requirements 5.3**

### Property 11: Session Persistence

*For any* authenticated user who closes and reopens the application, the session should be restored automatically using Firebase refresh tokens without requiring re-authentication.

**Validates: Requirements 1.5**

### Property 12: Marker Clustering Performance

*For any* map view with more than 50 markers, the marker clustering algorithm should group nearby markers to maintain smooth interaction performance.

**Validates: Requirements 5.5, 9.4**

## Error Handling

### Authentication Errors

- **Invalid Credentials**: Display user-friendly error message, allow retry
- **Network Errors**: Show offline indicator, queue actions for retry
- **OTP Timeout**: Allow resend OTP with rate limiting
- **Duplicate Account**: Prevent registration, suggest login

### Data Operation Errors

- **Firestore Write Failures**: Retry with exponential backoff (3 attempts)
- **Storage Upload Failures**: Show progress, allow cancel/retry
- **Permission Denied**: Redirect to login, show appropriate message
- **Quota Exceeded**: Display error, suggest trying later

### AI Service Errors

- **API Rate Limit**: Queue requests, process with delay
- **API Failure**: Log error, save report without AI analysis
- **Invalid Response**: Use fallback analysis or skip
- **Timeout**: Cancel request after 10 seconds, proceed without analysis

### Map Errors

- **Geolocation Denied**: Use default location, allow manual selection
- **Tile Loading Failure**: Show error overlay, retry on user action
- **Invalid Coordinates**: Validate input, show error message

### Real-time Listener Errors

- **Connection Lost**: Show offline indicator, attempt reconnection
- **Listener Detached**: Reattach listener automatically
- **Permission Changes**: Refresh authentication, update UI

## Testing Strategy

### Unit Testing

Unit tests will verify individual functions and components in isolation:

- **Authentication functions**: Test sign-up, sign-in, sign-out flows
- **Data validation**: Test input validation for reports, comments, votes
- **Utility functions**: Test date formatting, coordinate validation, text sanitization
- **Store logic**: Test Svelte store updates and derived values

### Property-Based Testing

Property-based tests will verify universal properties across many inputs using **fast-check** (JavaScript property testing library). Each test will run a minimum of 100 iterations with randomly generated inputs.

Property tests will be tagged with comments referencing the design document:
```javascript
// Feature: crime-reporting-platform, Property 2: Vote Uniqueness
```

Key property tests:
- Vote uniqueness across random user/report combinations
- Vote count consistency with random vote sequences
- Location coordinate validity with random lat/lng values
- Filter consistency with random filter combinations
- Comment ordering with random timestamp sequences

### Integration Testing

Integration tests will verify component interactions:

- **Report submission flow**: Create report → Upload media → AI analysis → Save to Firestore
- **Voting flow**: User votes → Update counts → Real-time sync to other clients
- **Comment flow**: Add comment → Save to Firestore → Real-time display
- **Authentication flow**: Login → Access protected routes → Logout

### End-to-End Testing

E2E tests will verify complete user workflows:

- User registration and login
- Submit crime report with location and media
- View reports on map and interact with markers
- Vote and comment on reports
- Moderator flags inappropriate content
- Admin assigns moderator role

### Performance Testing

- Measure initial page load time (target: < 2 seconds)
- Test map performance with 100+ markers
- Measure real-time update latency (target: < 1 second)
- Test concurrent user interactions

### Security Testing

- Verify Firestore security rules prevent unauthorized access
- Test authentication token expiration and refresh
- Verify role-based access control for moderation actions
- Test input sanitization to prevent XSS attacks



## Firebase Configuration

### Firestore Security Rules

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
    
    function isModerator() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['moderator', 'admin'];
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Reports collection
    match /reports/{reportId} {
      allow read: if resource.data.status == 'active' || isModerator();
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.authorId) || isModerator();
      allow delete: if isModerator();
      
      // Votes subcollection
      match /votes/{voteId} {
        allow read: if true;
        allow write: if isAuthenticated() && voteId == request.auth.uid;
      }
      
      // Comments subcollection
      match /comments/{commentId} {
        allow read: if true;
        allow create: if isAuthenticated();
        allow update: if isOwner(resource.data.authorId);
        allow delete: if isOwner(resource.data.authorId) || isModerator();
      }
    }
    
    // Moderation logs
    match /moderation_logs/{logId} {
      allow read: if isModerator();
      allow create: if isModerator();
      allow update, delete: if false;
    }
  }
}
```

### Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Crime report media
    match /reports/{reportId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && 
                     request.resource.size < 10 * 1024 * 1024 && // 10MB limit
                     request.resource.contentType.matches('image/.*|video/.*');
      allow delete: if request.auth != null;
    }
    
    // User profile images
    match /users/{userId}/profile/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && 
                     request.auth.uid == userId &&
                     request.resource.size < 2 * 1024 * 1024 && // 2MB limit
                     request.resource.contentType.matches('image/.*');
    }
  }
}
```

### Firebase Configuration File

```javascript
// src/lib/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

## State Management

### Svelte Stores

#### Auth Store

```javascript
// src/lib/stores/authStore.js
import { writable, derived } from 'svelte/store';
import { auth } from '$lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

function createAuthStore() {
  const { subscribe, set } = writable(null);
  
  onAuthStateChanged(auth, (user) => {
    set(user);
  });
  
  return {
    subscribe,
    signOut: async () => {
      await auth.signOut();
      set(null);
    }
  };
}

export const authStore = createAuthStore();
export const isAuthenticated = derived(authStore, $auth => $auth !== null);
export const userRole = derived(authStore, $auth => $auth?.role || 'citizen');
```

#### Reports Store

```javascript
// src/lib/stores/reportsStore.js
import { writable } from 'svelte/store';
import { db } from '$lib/firebase/config';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

function createReportsStore() {
  const { subscribe, set } = writable([]);
  
  let unsubscribe = null;
  
  const subscribeToReports = (filters = {}) => {
    if (unsubscribe) unsubscribe();
    
    const q = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc')
    );
    
    unsubscribe = onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      set(reports);
    });
  };
  
  return {
    subscribe,
    subscribeToReports,
    unsubscribe: () => {
      if (unsubscribe) unsubscribe();
    }
  };
}

export const reportsStore = createReportsStore();
```

## API Integration

### Google Gemini AI Integration

```javascript
// src/lib/services/aiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Rate limiter: 15 requests per minute
const requestQueue = [];
const MAX_REQUESTS_PER_MINUTE = 15;
const MINUTE_MS = 60000;

async function rateLimitedRequest(fn) {
  const now = Date.now();
  const recentRequests = requestQueue.filter(time => now - time < MINUTE_MS);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestRequest = recentRequests[0];
    const waitTime = MINUTE_MS - (now - oldestRequest);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  requestQueue.push(Date.now());
  return await fn();
}

export async function analyzeCrimeReport(description, imageUrls = []) {
  try {
    return await rateLimitedRequest(async () => {
      const prompt = `Analyze this crime report and provide:
1. A brief summary
2. Severity level (low/medium/high)
3. Crime categories (e.g., theft, assault, vandalism)
4. Confidence score (0-1)

Report: ${description}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse AI response (simplified)
      return {
        summary: text.substring(0, 200),
        severity: extractSeverity(text),
        categories: extractCategories(text),
        confidence: 0.85
      };
    });
  } catch (error) {
    console.error('AI analysis failed:', error);
    return null;
  }
}

export async function analyzeImage(imageUrl) {
  try {
    return await rateLimitedRequest(async () => {
      const prompt = 'Describe what you see in this image related to a crime report.';
      
      const result = await model.generateContent([prompt, {
        inlineData: {
          data: await fetchImageAsBase64(imageUrl),
          mimeType: 'image/jpeg'
        }
      }]);
      
      const response = await result.response;
      return response.text();
    });
  } catch (error) {
    console.error('Image analysis failed:', error);
    return null;
  }
}

function extractSeverity(text) {
  const lower = text.toLowerCase();
  if (lower.includes('high') || lower.includes('severe')) return 'high';
  if (lower.includes('medium') || lower.includes('moderate')) return 'medium';
  return 'low';
}

function extractCategories(text) {
  const categories = ['theft', 'assault', 'vandalism', 'burglary', 'fraud'];
  return categories.filter(cat => text.toLowerCase().includes(cat));
}

async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
}
```

## Deployment Configuration

### Environment Variables

```bash
# .env.example
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Firebase Hosting Configuration

```json
{
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Build Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  build: {
    target: 'es2015',
    minify: 'terser',
    sourcemap: true
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage']
  }
});
```

## Performance Optimization

### Code Splitting

- Lazy load map components (Leaflet) only when needed
- Lazy load admin/moderation panels for authorized users
- Split AI service into separate chunk

### Caching Strategy

- Cache Firestore queries with 5-minute TTL
- Cache map tiles using Leaflet's built-in caching
- Use service worker for offline support (optional)

### Image Optimization

- Compress images before upload (max 1920px width)
- Generate thumbnails for report cards
- Use WebP format when supported

### Real-time Optimization

- Limit real-time listeners to visible reports
- Detach listeners when components unmount
- Use pagination for large result sets (20 reports per page)

## Accessibility

- Semantic HTML elements throughout
- ARIA labels for interactive map elements
- Keyboard navigation support for all features
- Screen reader announcements for real-time updates
- Color contrast ratios meeting WCAG AA standards
- Focus indicators on all interactive elements

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## Development Workflow

### Project Structure

```
crime-reporting-platform/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── reports/
│   │   │   ├── map/
│   │   │   ├── moderation/
│   │   │   └── ui/
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── reportService.js
│   │   │   ├── voteService.js
│   │   │   ├── commentService.js
│   │   │   ├── aiService.js
│   │   │   └── storageService.js
│   │   ├── stores/
│   │   │   ├── authStore.js
│   │   │   ├── reportsStore.js
│   │   │   └── uiStore.js
│   │   ├── firebase/
│   │   │   └── config.js
│   │   └── utils/
│   │       ├── validation.js
│   │       ├── formatting.js
│   │       └── constants.js
│   ├── routes/
│   │   ├── +layout.svelte
│   │   ├── +page.svelte
│   │   ├── login/
│   │   ├── reports/
│   │   ├── map/
│   │   ├── profile/
│   │   └── admin/
│   └── app.html
├── static/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── firebase.json
├── firestore.rules
├── storage.rules
├── .env.example
├── package.json
├── svelte.config.js
├── tailwind.config.js
└── vite.config.js
```

### Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Deploy to Firebase
firebase deploy
```

## Security Considerations

### Input Validation

- Sanitize all user inputs to prevent XSS
- Validate coordinates are within valid ranges
- Limit file upload sizes (10MB for media)
- Validate file types (images and videos only)

### Authentication Security

- Use Firebase Authentication's built-in security
- Implement rate limiting for login attempts
- Use test phone numbers only in development
- Secure API keys using environment variables

### Data Privacy

- Store minimal personal information
- Allow users to delete their accounts and data
- Implement data retention policies
- Comply with GDPR/privacy regulations

### API Security

- Restrict Gemini API key to specific domains
- Implement rate limiting for AI requests
- Log and monitor API usage
- Handle API errors gracefully without exposing keys

