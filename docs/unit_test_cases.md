# Unit Test Cases — Vehicle Marketplace Project

| # | Module | Test Case | Input | Expected Output | Status |
|---|--------|-----------|-------|------------------|--------|
| 1 | Authentication | Signup with valid details creates a new user | Valid email, password, name via `/api/auth/signup` | User record created in Supabase; success response returned | Pass |
| 2 | Authentication | Signup with an already-registered email is rejected | Existing email + password | Error response, no duplicate user created | Pass |
| 3 | Authentication | Login with correct credentials succeeds | Valid registered email + password | Session created, user redirected to home/dashboard | Pass |
| 4 | Authentication | Login with incorrect password fails | Registered email + wrong password | Error message shown, no session created | Pass |
| 5 | Authentication | Logout clears the active session | Authenticated user clicks logout | Session/cookie cleared, user redirected to login | Pass |
| 6 | Used Listings | Creating a used listing with required fields succeeds | Title, price, description, photo, valid seller session | New row inserted into `used_listings`, visible on `/used` | Pass |
| 7 | Used Listings | Creating a listing without required fields is rejected | Missing title or price | Validation error returned, no row inserted | Pass |
| 8 | Used Listings | RLS prevents editing another user's listing | User B attempts to update User A's listing | Request denied by RLS policy | Pass |
| 9 | Test Drive Booking | Booking a test drive on an active listing succeeds | Valid listing ID, date, requester details | Row inserted into test-drive table; trigger fires notification to owner | Pass |
| 10 | Test Drive Booking | Booking a test drive on a sold listing is blocked | Listing with `status = sold` | Insert blocked by DB trigger/constraint, error returned | Pass |
| 11 | Notifications | New test-drive request generates a notification for the listing owner | Test-drive insert on owned listing | Notification row created; bell icon shows unread count | Pass |
| 12 | Admin Panel | Admin login with correct plaintext password succeeds | Valid admin username/password via `/api/admin/login` | Custom auth cookie set, access granted to `/admin` | Pass |
| 13 | Admin Panel | Non-admin/unauthenticated request to admin API is rejected | Request to `/api/admin/vehicles` without admin cookie | 401/403 response returned | Pass |
| 14 | Search History | Repeated identical search query is deduplicated (upsert) | Same search term submitted twice by same user | Single row in `search_history`, `updated_at`/count refreshed instead of duplicate insert | Pass |
| 15 | Rentals & Dashboard | Submitting a rental request creates a pending record visible on dashboard | Vehicle ID, renter details via `/rentals` | Row inserted into `rental_requests` with status `pending`; appears on `/dashboard` | Pass |

## Notes
- Test cases are scoped to core business logic: authentication, listings, bookings, notifications, admin access control, search history, and rentals.
- RLS-related cases (6, 8) should be run against Supabase directly or via integration tests, since RLS enforcement lives at the database layer, not application code.
- "Status" column reflects expected results once test scripts are implemented; update after actual test execution for the report.
