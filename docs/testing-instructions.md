# Test PartCue

Open **https://partcue.web.app** in a current Chrome, Edge, Firefox or Safari browser with WebGL2. No installation, payment or API key is needed. The browser workbench and the SPECS Lens have separate sessions.

## Your own job

1. Choose **Plan your own job**, enter a title and create the job. Choose **Start recording parts**.
2. Record `Grip screws`, origin `Grip base, two lower holes`, container `Bag A`, quantity `2`, note `Keep the washers together`.
3. Record `Rubber grip pad`, origin `Grip base`, container `Blue tray`, quantity `1`.
4. Choose **Ready to put it back?** The pad must be next because it was removed last. The diagram is illustrative; use the written references for your actual workspace.
5. Try selecting Grip screws. Progress stays at zero. Select Rubber grip pad, enter `2` and confirm. The quantity check refuses it. Enter `1` and confirm to advance once.
6. Pause, then resume. Select Grip screws again, enter `2` and confirm. Both groups are complete. Undo brings back the last return.

Up to 100 groups are supported per job. Names, origins, containers, quantities and notes are manually entered. The app does not recognize parts or verify physical installation. Follow the device manufacturer's assembly instructions where applicable.

## Practice enclosure

Create a new session and choose **Practice enclosure**, or use the practice bench on a fresh visit. Choose **Explore a recorded example** for a quick four-part return. Try a wrong part, a wrong quantity, pause/resume, undo and completion. To practice recording, create another practice session, start a teardown and select each part and a free tray well.

## Save and restore

1. Use **Sign in** and **Create account** with an email you own and a password of 12 to 128 characters. There are no shared or seeded credentials.
2. Choose **Save session**, then reload. The tab recovery copy should retain current work. Open **Saved sessions**, load the saved job and verify the names, quantities, references and phase.
3. Sign out. Saved job titles and account data should no longer be shown. A different account has its own saved jobs.
4. Save a job, open it in two tabs, and make a different edit in each. Save the first, then the second. The second must report a revision conflict rather than silently replacing the first save. Export the second tab's work before loading the latest saved version.

Verification and password recovery are available in the account dialog. Check your own inbox and spam folder for these messages. Automated tests verified action generation; real mailbox delivery was not independently inspected. Account deletion asks for the current password and removes saved jobs and the Auth profile. A minimal deletion marker without email or job content is retained to prevent an old token from restoring deleted work.

## Portable recovery

Export JSON, then import it. A valid file opens as a new session with a new ID and an imported title. Custom jobs retain their named references. Import an invalid JSON or unsupported schema file: an error should appear and the current job must remain unchanged. Guest work survives a reload in the same tab; export before closing the tab. Cloud saves require a network connection and are explicit.

## SPECS Lens preview

Open `lens/PartTrail/PartCue.esproj` in Lens Studio 5.24.1 or a compatible SPECS 27 version. Choose SPECS 27 / Interactive preview, set the bench, start recording and select one of the four authored parts and an empty tray well. Record all four, return in reverse, select the expected pickup and confirm the recorded quantity. Try a wrong part, pause/resume, undo and confirmed restart.

The Lens uses four authored parts and predefined origins. Browser custom jobs do not transfer automatically into the Lens. Hardware alignment, comfort and repair benefit still need device and user testing.

## Developer checks

With Node 22.16+ within Node 22:

```sh
npm ci
npm run build
npm test
npm run test:firebase
npm run build:hosting
```

Firebase tests start isolated Auth and Firestore emulators with demo-only identities. They require Java 21. The test helper detects the standard Apple Silicon Homebrew JDK location. See [validation](validation.md) for the exact results and [deployment](firebase-deployment.md) for repeatable publishing.
