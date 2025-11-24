# Implementation Plan

- [x] 1. Set up project structure and dependencies





  - Initialize SvelteKit project with TypeScript support
  - Install and configure Tailwind CSS
  - Install Shadcn/UI components
  - Install Firebase SDK (auth, firestore, storage)
  - Install Leaflet and marker clustering plugins
  - Install Google Generative AI SDK
  - Install fast-check for property-based testing
  - Create project directory structure (components, services, stores, routes)
  - Set up environment variables configuration
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 13.3, 14.1, 15.1_

- [x] 2. Configure Firebase and create initialization module





  - Create Firebase configuration file with environment variables
  - Initialize Firebase app, auth, firestore, and storage instances
  - Set up Firestore security rules
  - Set up Firebase Storage security rules
  - Configure Firebase hosting settings
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 3. Implement authentication service and components




  - [x] 3.1 Create AuthService with email/password and phone/OTP methods


    - Implement signUpWithEmail function
    - Implement signInWithEmail function
    - Implement signInWithPhone function
    - Implement confirmPhoneCode function
    - Implement signOut function
    - Implement getCurrentUser and onAuthStateChanged
    - _Requirements: 1.1, 1.2, 1.3, 13.5_

  - [x] 3.2 Create auth Svelte store for reactive state management


    - Implement authStore with Firebase auth state listener
    - Create derived stores for isAuthenticated and userRole
    - _Requirements: 1.5, 12.4_

  - [ ]* 3.3 Write property test for authentication state consistency
    - **Property 1: Authentication State Consistency**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5**

  - [x] 3.4 Create LoginForm component


    - Build email/password login UI
    - Build phone/OTP login UI with OTP input
    - Handle authentication errors and display messages
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.5 Create RegisterForm component


    - Build registration UI for email and phone options
    - Implement duplicate account prevention
    - Handle registration errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 3.6 Write unit tests for authentication components
    - Test LoginForm with valid/invalid credentials
    - Test RegisterForm validation
    - Test error handling flows
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Implement data models and validation utilities




  - [x] 4.1 Create TypeScript interfaces for all data models

    - Define User, Report, Vote, Comment, ModerationLog interfaces
    - Create input validation functions
    - Implement coordinate validation (lat/lng ranges)
    - _Requirements: 2.3_

  - [ ]* 4.2 Write property test for location data validity
    - **Property 6: Location Data Validity**
    - **Validates: Requirements 2.3**

  - [ ]* 4.3 Write unit tests for validation utilities
    - Test coordinate validation edge cases
    - Test input sanitization
    - _Requirements: 2.3_

- [x] 5. Implement storage service for media uploads




  - [x] 5.1 Create StorageService with upload/delete/getURL methods


    - Implement uploadFile with progress tracking
    - Implement deleteFile function
    - Implement getDownloadURL function
    - Add file size and type validation (10MB limit, images/videos only)
    - _Requirements: 2.2, 13.3_

  - [ ]* 5.2 Write property test for media storage consistency
    - **Property 5: Media Storage Consistency**
    - **Validates: Requirements 2.2**

  - [ ]* 5.3 Write unit tests for storage service
    - Test file upload with valid files
    - Test file size limit enforcement
    - Test file type validation
    - _Requirements: 2.2_

- [x] 6. Implement AI analysis service






  - [x] 6.1 Create AIService with Gemini API integration

    - Implement rate limiter (15 requests per minute)
    - Implement analyzeCrimeReport function for text analysis
    - Implement analyzeImage function for image analysis
    - Add error handling and fallback logic
    - Parse AI responses to extract severity, categories, confidence
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]* 6.2 Write property test for AI analysis idempotency
    - **Property 7: AI Analysis Idempotency**
    - **Validates: Requirements 2.4, 2.5**

  - [ ]* 6.3 Write unit tests for AI service
    - Test rate limiter with multiple requests
    - Test error handling when API fails
    - Test response parsing
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 7. Implement report service and store






  - [x] 7.1 Create ReportService with CRUD operations

    - Implement createReport with AI analysis integration
    - Implement getReport function
    - Implement getReports with filtering
    - Implement subscribeToReports with real-time listener
    - Implement updateReport and deleteReport
    - _Requirements: 2.1, 2.4, 2.5, 2.6_


  - [x] 7.2 Create reportsStore for reactive state management

    - Implement Firestore real-time listener
    - Add filter support (crime type, date range)
    - Handle listener lifecycle (subscribe/unsubscribe)
    - _Requirements: 2.6, 5.3, 12.4_

  - [ ]* 7.3 Write property test for real-time update propagation
    - **Property 4: Real-time Update Propagation**
    - **Validates: Requirements 2.6, 3.5, 4.2, 5.4**

  - [ ]* 7.4 Write property test for filter consistency
    - **Property 10: Filter Consistency**
    - **Validates: Requirements 5.3**

  - [ ]* 7.5 Write unit tests for report service
    - Test createReport flow with media and AI analysis
    - Test filtering logic
    - Test error handling
    - _Requirements: 2.1, 2.4, 2.5, 2.6_

- [x] 8. Implement voting service






  - [x] 8.1 Create VoteService with vote/removeVote/getUserVote methods




    - Implement vote function with Firestore transaction
    - Implement removeVote function
    - Implement getUserVote function
    - Ensure one vote per user per report (use userId as document ID)
    - Update report vote counts atomically
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 8.2 Write property test for vote uniqueness
    - **Property 2: Vote Uniqueness**
    - **Validates: Requirements 3.4**

  - [ ]* 8.3 Write property test for vote count consistency
    - **Property 3: Vote Count Consistency**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 8.4 Write unit tests for vote service
    - Test voting flow
    - Test vote changes
    - Test transaction handling
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 9. Implement comment service




  - [x] 9.1 Create CommentService with add/get/subscribe/delete methods


    - Implement addComment function
    - Implement getComments with ordering by createdAt
    - Implement subscribeToComments with real-time listener
    - Implement deleteComment function
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 9.2 Write property test for comment ordering
    - **Property 9: Comment Ordering**
    - **Validates: Requirements 4.3**

  - [ ]* 9.3 Write unit tests for comment service
    - Test comment creation
    - Test comment ordering
    - Test comment deletion
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 10. Create map components with Leaflet




  - [x] 10.1 Create LocationPicker component


    - Initialize Leaflet map with OpenStreetMap tiles
    - Add click handler to select location
    - Display selected coordinates
    - Emit location selection event
    - _Requirements: 2.3, 15.1, 15.2_

  - [x] 10.2 Create CrimeMap component


    - Initialize Leaflet map with OpenStreetMap tiles
    - Implement marker clustering for performance
    - Add markers for each report with popups
    - Handle marker click events
    - Implement real-time marker updates
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 15.1, 15.2, 15.3, 15.4_

  - [ ]* 10.3 Write property test for marker clustering performance
    - **Property 12: Marker Clustering Performance**
    - **Validates: Requirements 5.5, 9.4**

  - [ ]* 10.4 Write unit tests for map components
    - Test LocationPicker selection
    - Test CrimeMap marker rendering
    - Test filter application
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 11. Create report UI components





  - [x] 11.1 Create ReportForm component


    - Build form UI with Shadcn/UI components
    - Integrate LocationPicker for location selection
    - Add media upload with preview
    - Implement form validation
    - Call ReportService to create report with AI analysis
    - Show loading state during submission
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 11.2 Create ReportCard component


    - Display report details (title, description, author, timestamp)
    - Show AI analysis results (severity, categories)
    - Display vote counts
    - Show media thumbnails
    - Integrate VoteButtons component
    - Add real-time updates listener
    - _Requirements: 2.1, 2.4, 2.5, 3.1, 3.2_

  - [x] 11.3 Create ReportList component


    - Display list of ReportCard components
    - Implement filtering UI (crime type, date range)
    - Add pagination (20 reports per page)
    - Subscribe to reportsStore for real-time updates
    - _Requirements: 5.3_

  - [ ]* 11.4 Write unit tests for report components
    - Test ReportForm submission
    - Test ReportCard rendering
    - Test ReportList filtering
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_


- [x] 12. Create interaction components




  - [x] 12.1 Create VoteButtons component


    - Build upvote/downvote button UI
    - Show current vote counts
    - Highlight user's current vote
    - Call VoteService on button click
    - Handle vote changes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 12.2 Create CommentSection component


    - Display list of comments in chronological order
    - Build comment input form
    - Call CommentService to add comments
    - Subscribe to real-time comment updates
    - Add delete button for user's own comments
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 12.3 Write unit tests for interaction components
    - Test VoteButtons click handling
    - Test CommentSection display and input
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3_

- [ ] 13. Implement moderation features
  - [ ] 13.1 Create moderation service
    - Implement flagReport function
    - Implement removeComment function
    - Implement suspendUser function
    - Create moderation log entries
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 13.2 Create ModerationPanel component
    - Build moderation actions UI (flag, remove, suspend)
    - Show only to moderators/admins
    - Call moderation service functions
    - Display confirmation dialogs
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 13.3 Write property test for role-based access control
    - **Property 8: Role-Based Access Control**
    - **Validates: Requirements 6.1, 6.2, 6.3, 7.1, 7.2**

  - [ ]* 13.4 Write unit tests for moderation features
    - Test moderation actions
    - Test role-based visibility
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 14. Implement admin features
  - [ ] 14.1 Create user management service
    - Implement promoteToModerator function
    - Implement demoteToUser function
    - Update user roles in Firestore
    - Refresh user session after role change
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 14.2 Create UserManagement component
    - Build admin panel UI
    - Display user list with roles
    - Add role change buttons
    - Show only to admins
    - _Requirements: 7.1, 7.2_

  - [ ]* 14.3 Write unit tests for admin features
    - Test role promotion/demotion
    - Test admin-only visibility
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 15. Implement user profile features
  - [ ] 15.1 Create profile service
    - Implement getUserProfile function
    - Implement updateProfile function
    - Implement getUserReports function
    - Implement getUserActivity function (votes, comments)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 15.2 Create Profile component
    - Display user information (username, email, phone, role)
    - Build profile edit form
    - Display user's submitted reports
    - Display voting and commenting history
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 15.3 Write unit tests for profile features
    - Test profile display
    - Test profile updates
    - Test activity history
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 16. Create main application routes and layout
  - [ ] 16.1 Create root layout with navigation
    - Build navigation bar with auth state
    - Add login/logout buttons
    - Add links to main sections (feed, map, profile)
    - Show admin/moderator links based on role
    - _Requirements: 1.1, 1.5_

  - [ ] 16.2 Create home page route (/)
    - Display crime feed with ReportList
    - Add "Create Report" button
    - _Requirements: 2.1, 5.3_

  - [ ] 16.3 Create map page route (/map)
    - Display CrimeMap component
    - Add filter controls
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 16.4 Create login page route (/login)
    - Display LoginForm component
    - Redirect to home after successful login
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 16.5 Create register page route (/register)
    - Display RegisterForm component
    - Redirect to home after successful registration
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 16.6 Create profile page route (/profile)
    - Display Profile component
    - Require authentication
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 16.7 Create admin page route (/admin)
    - Display UserManagement component
    - Require admin role
    - _Requirements: 7.1, 7.2_

  - [ ]* 16.8 Write unit tests for routing
    - Test navigation
    - Test authentication guards
    - Test role-based access
    - _Requirements: 1.1, 1.5_

- [ ] 17. Implement session persistence
  - [ ]* 17.1 Write property test for session persistence
    - **Property 11: Session Persistence**
    - **Validates: Requirements 1.5**

  - [ ]* 17.2 Write unit tests for session handling
    - Test token refresh
    - Test session restoration
    - _Requirements: 1.5_

- [ ] 18. Add responsive design and accessibility
  - [ ] 18.1 Implement responsive layouts for all components
    - Add mobile-friendly styles with Tailwind breakpoints
    - Test on different screen sizes
    - Optimize map controls for touch devices
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 18.2 Add accessibility features
    - Add ARIA labels to interactive elements
    - Implement keyboard navigation
    - Add screen reader announcements for real-time updates
    - Ensure color contrast meets WCAG AA standards
    - Add focus indicators
    - _Requirements: 11.1, 11.2, 11.3_

- [ ] 19. Implement error handling and loading states
  - [ ] 19.1 Create error handling utilities
    - Implement global error handler
    - Create error display components
    - Add retry logic with exponential backoff
    - _Requirements: 9.2_

  - [ ] 19.2 Add loading states to all async operations
    - Add loading spinners to forms
    - Add skeleton loaders to lists
    - Show progress bars for uploads
    - _Requirements: 9.2_

  - [ ]* 19.3 Write unit tests for error handling
    - Test error display
    - Test retry logic
    - Test loading states
    - _Requirements: 9.2_

- [ ] 20. Optimize performance
  - [ ] 20.1 Implement code splitting
    - Lazy load map components
    - Lazy load admin/moderation panels
    - Split AI service into separate chunk
    - _Requirements: 9.1, 9.4_

  - [ ] 20.2 Implement caching strategies
    - Cache Firestore queries with TTL
    - Implement pagination for large result sets
    - Optimize image loading with compression
    - _Requirements: 9.1, 9.3, 9.4_

  - [ ] 20.3 Optimize real-time listeners
    - Limit listeners to visible reports
    - Detach listeners on component unmount
    - _Requirements: 9.3_

  - [ ]* 20.4 Write performance tests
    - Test initial page load time (< 2 seconds)
    - Test map performance with 100+ markers
    - Test real-time update latency (< 1 second)
    - _Requirements: 9.1, 9.3, 9.4_

- [ ] 21. Final checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property-based tests and verify they pass
  - Test the application manually for core workflows
  - Ask the user if questions arise
  - _Requirements: All_
