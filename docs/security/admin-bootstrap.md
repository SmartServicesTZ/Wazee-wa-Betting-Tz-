# Admin bootstrap and operational checklist

The Worker authorizes admin endpoints only when the authenticated user's row in D1 has role=admin. New Firebase-authenticated users are created with the default buyer role.

To activate the first admin safely:
1. Owner signs into the live site once, creating the user row in D1.
2. Retrieve that user's Firebase UID from the Firebase Authentication console.
3. Verify the UID with the owner.
4. Promote only that UID to admin in D1 through a controlled, audited administrative operation. Do not accept a client-supplied role.
5. Test that a normal buyer receives HTTP 403 from admin endpoints and the admin account succeeds.

This bootstrap is intentionally not automatic. No account is silently promoted to admin.

Current admin endpoints:
- GET /api/v1/admin/seller-applications
- POST /api/v1/admin/seller-applications/:id/decision
- POST /api/v1/admin/listings/:id/decision
