## Inspiration

You put a repair down for a moment. When you come back, two nearly identical screws are waiting in different trays. You remember removing them. Which one belongs in the deeper hole?

A photograph can preserve a scene, but you still have to translate it back into the work in front of you. PartCue keeps the next pickup and its origin connected, right beside the task. Every part has a way home.

## What it does

The SPECS Lens records a manual teardown and guides the return in reverse order. One amber cue marks the pickup. One cyan cue marks its saved origin. An animated path connects them. Choose the expected part and confirm its quantity before the sequence advances.

Wrong parts and quantities leave progress unchanged. A wrong pickup also clears any older selection. Pause hides the work cues, resume restores the same next part, and undo corrects a return. Restart asks before clearing the session.

The actual Lens Studio preview uses four authored parts and predefined origins on a simulated mechanical enclosure. Every mark and return confirmation is explicit. Physical installation is not automatically verified.

The companion at **[partcue.web.app](https://partcue.web.app)** adds private job records. You can practice with the enclosure or record your own parts using named origins, trays, quantities and notes. Custom jobs use an illustrative diagram. Sign in to save, return to a job later, or export a portable JSON copy. Import validates a file before opening it as a new session. Browser records and Lens sessions remain separate.

Try the hosted workbench as a guest: choose **Plan your own job**, record two groups and begin the return. Try the wrong group, then select the expected one and confirm its exact quantity. [Full testing instructions](https://github.com/shi1720/partcue/blob/main/docs/testing-instructions.md) cover saving, recovery, import/export and Lens preview.

## How we built it

Created by **Shivam Gupta with AI coding assistance**. The Devpost Learn `plan-lens` skill shaped the design brief around one spatial interaction and observable preview criteria. The repository includes that planning record.

We built the Lens through Snap's standalone CLAD SPECS workflow and the official Lens Studio MCP. Spectacles Interaction Kit and UIKit provide actual interaction targets. Code-authored geometry keeps the parts and tray wells separate. Locally synthesized sound cues give brief feedback.

A shared, deterministic TypeScript state machine owns the sequence. Tests check that the Lens contains the exact same core source. Seven live functional and IK scenarios passed, including actual tray selection and confirmation with scripted fallback disabled.

The hosted companion uses Firebase Hosting, Authentication and Firestore on the free Spark configuration. Owner-scoped rules, bounded storage and revision checks protect saved work. Accounts include verification, password recovery and deletion. Automated tests and live cloud checks exercise the production adapter and rules.

## Challenges and what we learned

The hardest design decision was how little to show. The active task needs the next pickup, its origin and a clear confirmation. The complete history belongs in the record.

Preview tests exposed overlapping targets and controls rebuilding before an interaction released. We corrected the layout and lifecycle, then tested real UIKit and SIK targets. Adversarial testing also caught a subtler problem: a previously correct selection could remain armed after a wrong pickup. Fresh selection is now required.

Cloud testing brought another lesson: a successful response can arrive too late. A delayed load now preserves newer edits, and a delayed session list cannot expose titles from a previous account. Testing recovery changed the product as much as testing the happy path.

## Who it is for and what comes next

Repair shops and training benches are the first customer hypothesis. The web companion can already keep manual job records. The spatial experience still needs device testing for alignment, readability and comfort.

The next pilot should compare total task time with labeled mats, photographs and a plain reverse checklist, including the effort of recording. A proposed **$20 per active bench per month** is a pricing experiment, not demonstrated demand. PartCue has to earn its place by making the return easier.
