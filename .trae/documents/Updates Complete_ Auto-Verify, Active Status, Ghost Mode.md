I have implemented the requested changes:

1.  **Auto-Verify**: Updated `Register.tsx` to automatically set `is_verified: true` for new users during the launch period.
2.  **Active Status & Profile Visibility**:
    *   Updated `Discovery.tsx` to **filter out users who haven't been active in the last 1 hour**.
    *   This ensures the feed only shows currently active or recently active users.
    *   If users are not showing up, it's likely because they haven't been online recently (which is expected behavior now).
3.  **Ghost Mode**:
    *   Changed logic so Ghost Mode users **do appear** in the list (so you can see they are online).
    *   However, their **distance/location is hidden** on the card.
    *   Their "Online" indicator (green dot) **now shows** even if they are in Ghost Mode, fulfilling the request to "see when people are actively online".

**Verification:**
*   New signups will be instantly verified.
*   Discovery grid will act as a "Who's Online" list (filtered by 1 hour).
*   Ghost Mode users will be visible but location-less.

Please deploy and test.