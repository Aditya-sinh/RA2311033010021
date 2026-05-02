# Notification System Design

---

## Stage 1

### Core Actions the Notification Platform Should Support

1. Send a notification to a student
2. Fetch all notifications for a student
3. Fetch unread notifications for a student
4. Mark a notification as read
5. Mark all notifications as read
6. Delete a notification

---

### REST API Endpoints

#### 1. Get all notifications for a student

```
GET /api/notifications
```

**Headers:**
```json
{
  "studentID": "string (required)"
}
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "Placement | Event | Result",
      "message": "string",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:30Z"
    }
  ]
}
```

---

#### 2. Get unread notifications for a student

```
GET /api/notifications/unread
```

**Headers:**
```json
{
  "studentID": "string (required)"
}
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "Placement | Event | Result",
      "message": "string",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:30Z"
    }
  ]
}
```

---

#### 3. Send a notification to a student

```
POST /api/notifications
```

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "studentID": "string",
  "type": "Placement | Event | Result",
  "message": "string"
}
```

**Response:**
```json
{
  "id": "uuid",
  "message": "notification sent successfully"
}
```

---

#### 4. Mark a notification as read

```
PATCH /api/notifications/:id/read
```

**Headers:**
```json
{
  "studentID": "string (required)"
}
```

**Response:**
```json
{
  "message": "notification marked as read"
}
```

---

#### 5. Mark all notifications as read

```
PATCH /api/notifications/read-all
```

**Headers:**
```json
{
  "studentID": "string (required)"
}
```

**Response:**
```json
{
  "message": "all notifications marked as read"
}
```

---

#### 6. Delete a notification

```
DELETE /api/notifications/:id
```

**Headers:**
```json
{
  "studentID": "string (required)"
}
```

**Response:**
```json
{
  "message": "notification deleted successfully"
}
```

---

### Real-Time Notification Mechanism

For real-time delivery, the system uses **WebSockets** via `socket.io`.

When a student logs in, the frontend opens a WebSocket connection to the server. The server maintains a map of `studentID → socket`. When a new notification is created via `POST /api/notifications`, the server immediately emits the notification to the relevant student's socket if they are currently connected.

```
Student logs in → WebSocket connection established → server stores socketID mapped to studentID
New notification created → server checks if student is connected → emits event directly to their socket
```

If the student is offline, the notification is still saved to the database and delivered the next time they fetch notifications.

---

## Stage 2

### Recommended Database: PostgreSQL (Relational)

**Why PostgreSQL over NoSQL:**
Notifications have a predictable, fixed structure — every notification has a studentID, type, message, isRead flag, and timestamp. There are no variable or nested fields. Relational databases handle this well with strong consistency guarantees, which matters here because marking a notification as read must be reliable. PostgreSQL also has excellent support for indexes, which we will need as data grows.

---

### DB Schema

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE notification_type AS ENUM ('Placement', 'Event', 'Result');
```

---

### Problems as Data Volume Grows and Solutions

**Problem 1: Full table scans on large notifications table**
As the table grows to millions of rows, queries like `WHERE student_id = x AND is_read = false` scan every row.
Solution: Add a composite index on `(student_id, is_read, created_at)` so the database can jump directly to the relevant rows.

**Problem 2: Single table becomes a bottleneck**
At very high scale (tens of millions of rows), even indexed queries slow down.
Solution: Partition the notifications table by `created_at` (range partitioning by month). Queries for recent notifications only scan the current month's partition.

**Problem 3: Read-heavy load overwhelming the primary DB**
Fetching notifications is a read operation done by every student on every login.
Solution: Add a read replica. All SELECT queries go to the replica, writes go to the primary.

---

### SQL Queries Based on Stage 1 API Design

**Fetch all notifications for a student:**
```sql
SELECT id, type, message, is_read, created_at
FROM notifications
WHERE student_id = $1
ORDER BY created_at DESC;
```

**Fetch unread notifications for a student:**
```sql
SELECT id, type, message, created_at
FROM notifications
WHERE student_id = $1 AND is_read = FALSE
ORDER BY created_at DESC;
```

**Send a notification:**
```sql
INSERT INTO notifications (student_id, type, message)
VALUES ($1, $2, $3)
RETURNING id;
```

**Mark one notification as read:**
```sql
UPDATE notifications
SET is_read = TRUE
WHERE id = $1 AND student_id = $2;
```

**Mark all as read:**
```sql
UPDATE notifications
SET is_read = TRUE
WHERE student_id = $1 AND is_read = FALSE;
```

**Delete a notification:**
```sql
DELETE FROM notifications
WHERE id = $1 AND student_id = $2;
```

---

## Stage 3

### Query Analysis

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

**Is the query accurate?**
The query is logically correct but has two issues. First, `SELECT *` fetches all columns including large text fields, when the frontend likely only needs `id`, `type`, `message`, and `createdAt`. Second, with 5,000,000 rows and no index on `(studentID, isRead)`, PostgreSQL performs a full sequential scan of the entire table for every request.

**Why is it slow?**
At 50,000 students and 5,000,000 notifications, the average student has 100 notifications. But the database doesn't know that — without an index it reads all 5 million rows to find the matching ones. This gets worse as data grows.

**What to change:**
```sql
-- Add this index once
CREATE INDEX idx_notifications_student_unread
ON notifications (student_id, is_read, created_at DESC);

-- Rewrite the query
SELECT id, type, message, created_at
FROM notifications
WHERE student_id = 1042 AND is_read = FALSE
ORDER BY created_at DESC;
```

**Computation cost improvement:**
Before the index: O(n) where n is total rows — 5,000,000 row scan.
After the index: O(log n + k) where k is matching rows for that student — effectively instant.

---

**Is adding indexes on every column a good idea?**
No. Every index takes up disk space and slows down INSERT, UPDATE, and DELETE operations because the index must be updated every time data changes. Sending notifications is a write operation — if every column is indexed, each new notification triggers 6+ index updates. The right approach is to only index columns that appear in WHERE clauses and ORDER BY clauses of slow queries.

---

**Query to find all students who got a Placement notification in the last 7 days:**

```sql
SELECT DISTINCT student_id
FROM notifications
WHERE type = 'Placement'
AND created_at >= NOW() - INTERVAL '7 days';
```

---

## Stage 4

### Problem
Fetching notifications on every page load for every student creates a direct database hit per user per visit. At 50,000 students, peak login times cause thousands of simultaneous DB queries.

---

### Solutions and Tradeoffs

**Solution 1: In-memory caching with Redis**
Store each student's notification list in Redis with a TTL (time-to-live) of a few minutes. On page load, check Redis first. Only hit the database on a cache miss or when the cache expires.

Tradeoff: A student may see slightly stale notifications (up to TTL seconds old). Acceptable for most notifications but not ideal for urgent ones like placement alerts. Can be partially solved by invalidating the cache when a new notification is written for that student.

**Solution 2: Pagination**
Instead of loading all notifications at once, load only the first 20. The user requests more only if they scroll down.

Tradeoff: Simpler to implement with no extra infrastructure. Reduces per-query data transfer significantly. Does not reduce the number of queries, just their cost.

**Solution 3: WebSocket push instead of polling**
As designed in Stage 1, new notifications are pushed to the client in real time. The frontend does not need to re-fetch on every page load — it maintains a local state updated by socket events, and only does an initial fetch on first login.

Tradeoff: Requires maintaining persistent socket connections. More complex infrastructure but the best long-term solution for real-time feel without DB hammering.

**Recommended combination:** Pagination for the initial load + Redis cache with write-through invalidation + WebSocket push for new arrivals. This handles both the volume problem and the real-time requirement.

---

## Stage 5

### Shortcomings of the Proposed Implementation

```
function notify_all(student_ids, message):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

**Problem 1: Sequential processing**
The loop processes one student at a time. For 50,000 students, if each iteration takes 100ms, the full loop takes 5,000 seconds — over an hour. Students at the end of the list receive the notification much later than those at the start.

**Problem 2: No fault tolerance**
If `send_email` fails for student 200, the loop crashes or skips. There is no retry mechanism. The 200 students who did not receive the email have no way to be identified and re-notified.

**Problem 3: Tight coupling of operations**
Email sending, DB insert, and push notification happen together in one blocking sequence. If the email API is slow, it delays the DB insert and push notification for every student.

---

**Should saving to DB and sending email happen together?**
No. They should be decoupled. The DB insert should happen immediately and independently — it is fast and reliable. The email send should be handled asynchronously via a queue. This way, even if the email service is down, the notification is already in the database and will be delivered when the service recovers.

---

### Redesigned Approach

```
function notify_all(student_ids, message):
    // Step 1: bulk insert all notifications to DB immediately
    bulk_insert_to_db(student_ids, message)

    // Step 2: push all to queue for async email delivery
    for student_id in student_ids:
        email_queue.push({ student_id, message })

    // Step 3: WebSocket push to currently connected students
    push_to_connected_students(student_ids, message)

// Separate worker process:
function email_worker():
    while true:
        job = email_queue.pop()
        success = send_email(job.student_id, job.message)
        if not success:
            email_queue.push(job, retry_count + 1)  // retry with backoff
```

**Why this is better:**
- DB insert is bulk (one query for 50,000 rows instead of 50,000 queries)
- Email failures are retried automatically without losing track of who was missed
- DB and email are fully decoupled — DB is never blocked waiting for an email API
- WebSocket push is non-blocking and only targets online students

---

## Stage 6

### Priority Inbox Approach

Notifications are ranked by two factors: type weight and recency.

**Type weights:**
- Placement = 3 (highest)
- Result = 2
- Event = 1 (lowest)

**Scoring formula:**
```
score = typeWeight * (1 / hoursAgo + 1)
```

This ensures that a recent Placement notification always outranks an old one, and a recent Event can outrank an old Result if recent enough.

**Maintaining top 10 efficiently as new notifications arrive:**
A max-heap (priority queue) of size 10 is maintained in memory. When a new notification arrives via WebSocket, it is scored and compared against the minimum score in the heap. If it scores higher, it replaces the minimum. This means the heap never grows beyond 10 entries and each insertion is O(log 10) — effectively O(1).

This is far more efficient than re-sorting the entire notification list on every new arrival.

See `notification_app_be` folder for the working implementation.
