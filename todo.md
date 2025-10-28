# CourierRun - To-Do List

## Completed ✅

- [x] Migrate from RefZone to CourierRun branding
- [x] Fix database queries to use actual Supabase schema (users, vehicles, roster_assignments)
- [x] Implement Resend email integration for roster notifications
- [x] Update dashboard with logistics metrics
- [x] Support empty roster drafts
- [x] Add organization-level multi-tenant filtering
- [x] Update documentation (README, .env.example)
- [x] Set up RLS policies at database level (calendar_events, rosters, etc.)

## CRITICAL - Security & Permissions 🔒

### Phase 1: Application-Level Permission Enforcement (IMMEDIATE)
- [ ] Add role-based permission utilities in TypeScript
- [ ] Update server actions to check permissions and return clear error messages
- [ ] Add user role to session context for client-side access
- [ ] Update UI components to conditionally show/hide features based on role
- [ ] Add permission checks before all state-changing operations
- [ ] Improve RLS policies to include 'admin' role where missing

### Phase 2: Enhanced Permission System
- [ ] Add audit trail for sensitive operations (who changed what, when)
- [ ] Implement permission-based component wrappers (CanAccess, RequireRole)
- [ ] Add "admin" role to all relevant RLS policies
- [ ] Create admin panel for role management

## HIGH PRIORITY - Next 2-4 Weeks 🚀

### Real-Time Driver Location Display (Mobile App Sends Data)
- [ ] Create driver location map view (team leaders only)
- [ ] Display live driver positions on map using existing driver_locations table
- [ ] Add driver status indicators (active, on break, offline)
- [ ] Implement Supabase Realtime subscription for location updates
- [ ] Show route progress and current stop information
- [ ] Add "last updated" timestamp for each driver location
- [ ] Create driver location history view (last 24 hours)

### Customer Delivery Notifications
- [ ] Create customers table and management UI
- [ ] Add customer email/SMS preferences
- [ ] Implement delivery status notification triggers
- [ ] Create notification templates (scheduled, in-transit, delivered)
- [ ] Add customer delivery tracking page (public, no login)
- [ ] Integrate Twilio for SMS notifications

## In Progress 🚧

- [ ] Wire up email notifications in roster publish flow
- [ ] Implement "Copy previous week" roster functionality
- [ ] Update calendar event types from referee to logistics
- [ ] Remove remaining referee components (chat widgets, etc.)

## MEDIUM PRIORITY - 1-3 Months 📊

### Route Optimization
- [ ] Implement AI-powered route optimization engine
- [ ] Integrate Google Maps Directions API for multi-stop routes
- [ ] Add traffic-aware routing with real-time updates
- [ ] Route deviation alerts and automatic re-routing
- [ ] Estimated time savings dashboard

### Analytics Dashboard Enhancement
- [ ] Driver performance metrics (on-time %, deliveries per day, etc.)
- [ ] Delivery success rates and failure analysis
- [ ] Fleet utilization reports
- [ ] Cost per delivery analytics
- [ ] Custom report builder with filters and exports
- [ ] Real-time delivery metrics dashboard

### AI-Powered Dispatch Assistant
- [ ] Smart driver-delivery assignment suggestions
- [ ] Workload balancing across drivers
- [ ] Skill-based routing (match driver expertise to delivery type)
- [ ] Automated conflict resolution suggestions

### Anomaly Detection & Alerts
- [ ] AI-based route deviation detection
- [ ] Driver idle time alerts (>30 min)
- [ ] Delivery time anomaly detection (2x expected time)
- [ ] Failed delivery pattern analysis
- [ ] Proactive customer communication triggers

## LONG-TERM - 3-6 Months 🔮

### Inventory & Package Management
- [ ] Create packages/parcels tracking system
- [ ] Barcode/QR code scanning integration
- [ ] Package status workflow (warehouse → in-transit → delivered)
- [ ] Warehouse integration and stock levels
- [ ] Package dimensions and weight tracking

### Customer Portal & CRM
- [ ] Customer accounts and profiles
- [ ] Delivery history per customer
- [ ] Saved delivery addresses
- [ ] Special delivery instructions
- [ ] Customer ratings and feedback system
- [ ] Automated customer communication preferences

### Vehicle Maintenance Tracking
- [ ] Maintenance schedule management
- [ ] Mileage tracking per vehicle
- [ ] Service history and costs
- [ ] Vehicle inspection checklists
- [ ] Maintenance due alerts

### AI Demand Forecasting
- [ ] Historical delivery pattern analysis
- [ ] Seasonal trend detection
- [ ] Weather impact on delivery volumes
- [ ] Staffing recommendation engine
- [ ] Capacity planning tools

## Future Enhancements 🌟

### Roster Management
- [ ] Roster templates for recurring schedules
- [ ] Bulk assignment tools
- [ ] Driver availability/time-off management
- [ ] Roster conflict detection and warnings
- [ ] Export rosters to PDF/CSV

## Test Coverage 🧪

Possible next steps:

1. Add unit tests for roster store and actions
2. Add tests for email notification functions
3. Add integration tests for dashboard data fetching
4. Wire pnpm test:run into CI to enforce quality gates
5. Consider adding MSW-powered API mocks for testing
