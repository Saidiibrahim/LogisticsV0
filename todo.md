# CourierRun - To-Do List

## Completed ✅

- [x] Migrate from RefZone to CourierRun branding
- [x] Fix database queries to use actual Supabase schema (users, vehicles, roster_assignments)
- [x] Implement Resend email integration for roster notifications
- [x] Update dashboard with logistics metrics
- [x] Support empty roster drafts
- [x] Add organization-level multi-tenant filtering
- [x] Update documentation (README, .env.example)

## In Progress 🚧

- [ ] Wire up email notifications in roster publish flow
- [ ] Implement "Copy previous week" roster functionality
- [ ] Update calendar event types from referee to logistics
- [ ] Remove remaining referee components (chat widgets, etc.)

## Future Enhancements 🚀

### Roster Management
- [ ] Roster templates for recurring schedules
- [ ] Bulk assignment tools
- [ ] Driver availability/time-off management
- [ ] Roster conflict detection and warnings
- [ ] Export rosters to PDF/CSV

### Delivery Tracking
- [ ] Real-time driver location tracking
- [ ] Delivery status updates
- [ ] Photo proof of delivery
- [ ] Customer signature capture
- [ ] Delivery time estimates

### Route Optimization
- [ ] Automatic route optimization
- [ ] Traffic-aware routing
- [ ] Multi-stop route planning
- [ ] Route deviation alerts

### Analytics & Reporting
- [ ] Driver performance metrics
- [ ] Delivery success rates
- [ ] Fleet utilization reports
- [ ] Cost per delivery analytics
- [ ] Custom report builder

### Mobile App
- [ ] Driver mobile app (React Native)
- [ ] Offline mode for rural deliveries
- [ ] Push notifications
- [ ] In-app navigation

## Test Coverage 🧪

Possible next steps:

1. Add unit tests for roster store and actions
2. Add tests for email notification functions
3. Add integration tests for dashboard data fetching
4. Wire pnpm test:run into CI to enforce quality gates
5. Consider adding MSW-powered API mocks for testing
