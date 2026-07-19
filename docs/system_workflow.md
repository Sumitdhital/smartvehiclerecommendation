# System Workflow Diagram

Vehicle showroom platform — Next.js (App Router) + Supabase (Postgres, Auth, Storage, Realtime) + Claude API.

## 1. High-level architecture

```mermaid
flowchart TB
    subgraph clients["Clients"]
        U["Buyer / Seller<br/>(Supabase user)"]
        A["Admin<br/>(admins table)"]
    end

    subgraph next["Next.js App"]
        MW["middleware.ts<br/>guards /admin/*"]
        subgraph pages["Public & user pages"]
            P1["/ , /results, /vehicle/[id]"]
            P2["/used, /rentals, /compare"]
            P3["/dashboard, /history"]
        end
        subgraph admin["Admin panel"]
            AP["/admin/* pages"]
        end
        subgraph api["Route handlers"]
            R1["/api/recommend"]
            R2["/api/auth/signup"]
            R3["/api/admin/*"]
        end
    end

    subgraph sb["Supabase"]
        AUTH["Auth<br/>(sessions, JWT)"]
        DB[("Postgres<br/>+ RLS + triggers")]
        ST["Storage<br/>listing-photos"]
        RT["Realtime<br/>notifications"]
    end

    CL["Claude API<br/>(ranking rationale)"]

    U --> pages
    A --> MW --> AP
    pages --> api
    AP --> R3

    pages -->|anon key, RLS| DB
    pages --> AUTH
    R1 --> CL
    R1 --> DB
    R2 -->|service role| AUTH
    R3 -->|service role| DB
    R3 --> ST
    DB --> RT --> pages
```

**Two independent auth systems.** Users authenticate through Supabase Auth and read/write under RLS with the anon key. Admins authenticate against an `admins` table, receive a signed `admin_session` cookie (`lib/admin-session.ts`, HMAC via Web Crypto so it runs on the edge), and their API routes use the service-role key to bypass RLS.

## 2. Recommendation flow

```mermaid
sequenceDiagram
    participant U as User
    participant H as Home / Results page
    participant API as /api/recommend
    participant TAX as tax-engine
    participant DB as Supabase
    participant CL as Claude API

    U->>H: budget, type, fuel, seats, brands
    H->>API: POST preferences
    API->>DB: select vehicles
    API->>TAX: on-road price per vehicle
    TAX-->>API: duty + VAT + total
    API->>API: filterAndScoreVehicles()
    API->>CL: top candidates + preferences
    CL-->>API: ranked list + explanations
    Note over API,CL: no API key → deterministic fallback text
    API-->>H: ranked vehicles
    H->>DB: upsert search_history
```

Budget filtering happens on the **on-road** price, not the ex-showroom price — `lib/tax-engine.ts` applies Nepal customs/excise/VAT before the budget constraint is tested.

## 3. Test drive & rental notifications

```mermaid
sequenceDiagram
    participant B as Buyer
    participant P as Vehicle / listing page
    participant DB as Postgres
    participant TG as Trigger
    participant RT as Realtime
    participant O as Owner's bell

    B->>P: Book a test drive
    P->>DB: insert test_drive_bookings
    DB->>TG: trg_reject_test_drive_on_sold_vehicle
    alt vehicle sold
        TG-->>P: raise error — booking rejected
    else available
        TG->>DB: insert notifications (owner_id)
        DB->>RT: change event
        RT-->>O: badge + list update
    end

    B->>P: Request a rental
    P->>DB: insert rental_requests
    DB->>TG: trg_notify_owner_on_rental_request
    TG->>DB: notify owner
    O->>DB: approve / reject
    DB->>TG: trg_notify_requester_on_rental_decision
    TG->>DB: notify requester
```

Notifications are never written by the client. Postgres triggers own that, so RLS can keep `notifications` read-only (plus mark-read) for the recipient.

## 4. Admin workflow

```mermaid
flowchart LR
    L["/admin/login"] -->|POST /api/admin/login| V{"credentials<br/>match admins row?"}
    V -->|no| L
    V -->|yes| C["set signed<br/>admin_session cookie"]
    C --> MW["middleware verifies<br/>on every /admin/*"]
    MW --> D["/admin dashboard"]

    D --> M1["Vehicles CRUD"]
    D --> M2["Used listings<br/>approve / reject"]
    D --> M3["Rentals"]
    D --> M4["Admins"]
    D --> BELL["Notification bell<br/>polls every 60s"]

    M1 & M2 & M3 & M4 --> SR["/api/admin/*<br/>service-role client"]
    BELL --> NR["/api/admin/notifications"]
    SR --> DB[("Postgres")]
    NR --> DB
    M2 --> ST["Storage: listing-photos"]
```

The admin bell **polls** (`AdminNotificationBell`, 60s) rather than using Realtime, because admins are not Supabase users and have no JWT for a realtime channel.

## 5. Used-listing lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: seller fills /used/new
    Draft --> Pending: submit + upload photos
    Pending --> Live: admin approves
    Pending --> Rejected: admin rejects
    Live --> Sold: owner marks sold
    Sold --> [*]
    Rejected --> [*]

    note right of Sold
        sold flag blocks new
        test-drive bookings
        via DB trigger
    end note
```
