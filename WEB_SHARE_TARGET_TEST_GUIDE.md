# Web Share Target API Implementation - Test Guide

## Implementation Summary

✅ **All 4 implementation tasks completed:**

1. ✅ `public/manifest.json` - Added `share_target` configuration
2. ✅ `public/sw.js` - Created Service Worker (NEW FILE)
3. ✅ `index.html` - Replaced Service Worker registration code
4. ✅ `App.tsx` - Added URL parameter handling useEffect

---

## Testing Procedures

### 1. Local Development Testing

#### 1.1 Start Dev Server
```bash
npm run dev
# Browser will open at: http://localhost:3000/PERSONAL-Dashboard/
```

#### 1.2 Verify Service Worker Registration
1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in left sidebar
4. Verify `sw.js` shows "activated and running" status
5. Scope should be: `/PERSONAL-Dashboard/`

#### 1.3 Manual URL Parameter Test
Test the shared content handling directly:

**Test Case 1: Simple Text**
```
http://localhost:3000/PERSONAL-Dashboard/?shared=true&text=테스트항목
```
Expected:
- App loads and shows main tab
- IN-BOX section appears with "테스트항목" as a new item
- URL changes back to base path (parameter removed)
- IN-BOX section highlights with yellow ring for 3 seconds

**Test Case 2: Multi-line Content**
```
http://localhost:3000/PERSONAL-Dashboard/?shared=true&text=제목입니다%0A설명내용%0Ahttps://example.com
```
(URL-encoded: "제목입니다\n설명내용\nhttps://example.com")

Expected:
- Multi-line text appears as single item in IN-BOX

**Test Case 3: Special Characters**
```
http://localhost:3000/PERSONAL-Dashboard/?shared=true&text=특수문자%20테스트%21%40%23
```

Expected:
- Special characters properly decoded and displayed

#### 1.4 Check Browser Console
1. Open Console tab in DevTools
2. Look for these log messages:
   - `[PWA] Service Worker 등록 완료: /PERSONAL-Dashboard/`
   - `[SW] Service Worker installed`
   - `[SW] Service Worker activated`
   - `[App] 공유 항목 추가됨: <shared-text>`

---

### 2. Production Build Testing

#### 2.1 Build for Production
```bash
npm run build
```

Verify output:
- ✅ `dist/sw.js` exists
- ✅ `dist/manifest.json` contains `share_target` config
- ✅ `dist/index.html` contains Service Worker registration

#### 2.2 Preview Production Build
```bash
npm run preview
```

Test the same URL parameter tests from Section 1.3:
```
http://localhost:4173/PERSONAL-Dashboard/?shared=true&text=테스트
```

Expected: Identical behavior to dev server

---

### 3. Mobile Device Testing (HTTPS Required)

#### 3.1 Deploy to GitHub Pages
```bash
npm run deploy
# Access at: https://<username>.github.io/PERSONAL-Dashboard/
```

#### 3.2 Install as PWA on Mobile
1. Open mobile Chrome/Safari (both support Share Target API)
2. Navigate to: `https://<username>.github.io/PERSONAL-Dashboard/`
3. Browser menu → "Add to home screen" or "Install app"
4. Tap "Install" confirmation
5. Verify "최영현보드" appears on home screen

#### 3.3 Test System Share Integration
**Android:**
1. Open any app with shareable content (Chrome, Messages, Notes, etc.)
2. Tap share button
3. Scroll through share menu to find "최영현보드"
4. Tap "최영현보드"
5. App opens and shows shared content in IN-BOX

**iOS (Safari only):**
1. Open Safari or any app with web share support
2. Tap share icon
3. Look for "최영현보드" in share options
4. Tap it
5. App opens and shows shared content in IN-BOX

#### 3.4 Test Different Share Sources

**Test Scenario 1: Share from Web Browser**
- Open webpage in mobile browser
- Share → "최영현보드"
- Expected: Page title + URL in IN-BOX

**Test Scenario 2: Share from Text Editor/Notes**
- Open notes app
- Select and share some text
- Share → "최영현보드"
- Expected: Text appears in IN-BOX

**Test Scenario 3: Share from Social Media**
- Open SNS app (if supported)
- Share post text
- Share → "최영현보드"
- Expected: Post content in IN-BOX

---

### 4. Firestore Synchronization Test

#### 4.1 Verify Firestore Persistence
1. Share text to app on Mobile Device A
2. Item appears in IN-BOX with highlight effect
3. Open browser DevTools → Application → Local Storage
4. Check if data is synced to Firestore
5. On a different device/browser, sign in with same account
6. Navigate to the app
7. Same shared item should appear in IN-BOX

#### 4.2 Offline Behavior
1. Share content on mobile device
2. Item added to IN-BOX locally
3. Go offline (airplane mode)
4. Shared item remains in IN-BOX
5. Go online again
6. Data syncs to Firestore automatically

---

## Expected Behavior Flow

### Share Target API Flow
```
[Mobile User]
    ↓
[Tap Share Button]
    ↓
[System Share Menu]
    ↓
[Select "최영현보드"]
    ↓
[Service Worker receives POST] → /PERSONAL-Dashboard/share-target
    ↓
[Extract: title, text, url from FormData]
    ↓
[Combine into single text: title\ntext\nurl]
    ↓
[Redirect with params: ?shared=true&text=<combined>]
    ↓
[App detects URL params and loading completes]
    ↓
[Create new ListItem with shared text]
    ↓
[Add to mainTab.inboxSection]
    ↓
[Switch to main tab]
    ↓
[Remove URL params via history.replaceState]
    ↓
[Scroll to IN-BOX with smooth animation]
    ↓
[Highlight IN-BOX with yellow ring for 3 seconds]
    ↓
[Console log: "공유 항목 추가됨: <text>"]
```

---

## Key Implementation Details

### Service Worker (`public/sw.js`)
- Listens for POST requests to `/PERSONAL-Dashboard/share-target`
- Extracts `title`, `text`, `url` from FormData
- Combines them with newline separator
- Redirects to app with URL params
- HTTP 303 (See Other) status for POST→GET conversion

### Manifest Configuration (`public/manifest.json`)
```json
"share_target": {
  "action": "/PERSONAL-Dashboard/share-target",
  "method": "POST",
  "enctype": "application/x-www-form-urlencoded",
  "params": {
    "title": "title",
    "text": "text",
    "url": "url"
  }
}
```

### App Handler (`App.tsx`)
- Reads URL params: `shared=true&text=<text>`
- Only executes when data is loaded (`!loading`)
- Adds new ListItem to mainTab.inboxSection
- Updates activeTabId to switch to main tab
- Removes URL params to prevent re-execution
- Scrolls to IN-BOX and adds highlight effect

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Service Worker not registering | SW path incorrect or HTTPS required (mobile) | Check DevTools, verify `/PERSONAL-Dashboard/sw.js` path |
| Share option not appearing | manifest.json not properly served | Rebuild and verify `dist/manifest.json` has `share_target` |
| Shared item not appearing | URL params not detected or data not loaded | Check console logs, verify URL has `?shared=true&text=...` |
| Multiple items being added | useEffect running multiple times | Check dependencies array in useEffect |
| Scroll not working | Element not found or selector wrong | Verify SectionCard has `data-section-id` attribute |
| Highlight not showing | CSS classes not applied correctly | Check Tailwind CSS is loaded, verify class names |

---

## Browser Compatibility

| Feature | Chrome/Edge | Firefox | Safari | Mobile |
|---------|------------|---------|--------|--------|
| Service Worker | ✅ | ✅ | ✅ (iOS 14.5+) | ✅ |
| Share Target API | ✅ | ⚠️ Limited | ✅ (Safari only) | ✅ |
| PWA Install | ✅ | ✅ | ✅ | ✅ |
| History API | ✅ | ✅ | ✅ | ✅ |

---

## Performance Notes

- Service Worker installed with `skipWaiting()` for immediate activation
- useEffect dependencies: `[safeData, loading, updateData]`
- URL params removed immediately after processing to prevent memory leaks
- Scroll behavior uses 300ms timeout for smooth animation
- Highlight effect auto-removes after 3 seconds

---

## Files Modified

```
project/
├── public/
│   ├── manifest.json          ← Updated: added share_target
│   └── sw.js                  ← NEW: Service Worker
├── index.html                 ← Updated: Service Worker registration
├── App.tsx                    ← Updated: Added URL parameter handler + ListItem import
├── types.ts                   ← No changes (ListItem already defined)
├── vite.config.ts             ← No changes (base path already set)
└── dist/                       ← All files auto-generated from above
    ├── sw.js                  ← Generated
    └── manifest.json          ← Generated
```

---

## Next Steps

1. ✅ Test locally with dev server
2. ✅ Build and test production build
3. ✅ Deploy to GitHub Pages (HTTPS)
4. ✅ Test on actual mobile devices
5. ✅ Verify Firestore synchronization
6. ⭐ Monitor console logs for errors
7. 📝 Document any issues or edge cases

---

## Success Criteria

All of the following should be true:

- [ ] Service Worker registers without errors in DevTools
- [ ] URL parameter test adds item to IN-BOX
- [ ] App shows highlight effect on shared item
- [ ] URL params are removed after processing
- [ ] Production build includes `sw.js` and updated manifest
- [ ] Mobile device shows "최영현보드" in system share menu
- [ ] Shared content appears in IN-BOX with proper formatting
- [ ] Item syncs to Firestore for multi-device access
- [ ] No console errors or warnings
- [ ] Browser DevTools shows all expected log messages
