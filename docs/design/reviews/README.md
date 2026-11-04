# UI design review record

Two GPT-6.1 Sol reviewers at high reasoning effort assessed login, navigation, expanded profile, shared confirmation, homepage favorites and search. Every submitted review is retained, including score decreases. Scores are subjective; component and category details are in the linked reports.

Rounds 0–3 used fresh independent pairs. Rounds 4–6 returned to the original pair; rounds 7–9 use a fresh independent pair. Reviewers were not told a target score or shown the other reviewer’s feedback. Later rounds add narrow and English-control evidence, so the scope is broader than the baseline.

| Round |          Reviewer A |           Reviewer B | Revision                                                                                                            |
| ----- | ------------------: | -------------------: | ------------------------------------------------------------------------------------------------------------------- |
| 0     |   [8](round-0-a.md) | [7.37](round-0-b.md) | Baseline                                                                                                            |
| 1     | [8.7](round-1-a.md) |  [8.8](round-1-b.md) | Contrast, bounded login, modal scope, preference states, wrapping and search context                                |
| 2     | [8.8](round-2-a.md) |  [8.8](round-2-b.md) | Narrow branding/cards, preference affordances and scroll continuation                                               |
| 3     | [8.3](round-3-a.md) |  [8.7](round-3-b.md) | Accurate overflow cues, anchor-aware chevrons, shorter favorites and secondary login hierarchy                      |
| 4     | [8.9](round-4-a.md) | [8.43](round-4-b.md) | Visible compact Menu entry and more room for narrow content                                                         |
| 5     | [9.2](round-5-a.md) |  [8.6](round-5-b.md) | Menu identity/return, shared category context, complete notice preview and English-control evidence                 |
| 6     | [9.3](round-6-a.md) | [8.71](round-6-b.md) | Compact English utilities, consistent saved-item terminology, explicit removal action and quieter preference values |
| 7     | [8.7](round-7-a.md) |  [8.7](round-7-b.md) | Narrow metadata punctuation and independent fresh-pair assessment                                                   |
| 8     | [8.9](round-8-a.md) |    [9](round-8-b.md) | Full-width Menu default for unconfigured narrow screens, counted homepage disclosure, compact login utilities       |
| 9     |   [9](round-9-a.md) |    [9](round-9-b.md) | Clear narrow utility-link boundaries and discrete search category metadata                                          |

Reviewer B corrected round 5 arithmetic from 8.61 to 8.60; its original values and correction remain in the report. [Round 6 clarification](round-6-b-followup.md) distinguishes subjective deductions from recommended changes.

[Final evidence manifest](final-evidence.json) ties the published pairs to the exact base and runtime package hashes.

[scores.json](scores.json) records model/settings, component scores and capture hashes. Review screenshot references identify local artifact filenames; the PR supplies the final matching base/head media.

The live login was recaptured on November 4. Student shell/profile/home and dialog were inspected live with packaged builds. [Fixture coverage](../../../test/browser-fixtures/coverage.json) records substitutions and gaps, including the extra current survey entry absent from the retained legacy tree. Published screenshots use synthetic identity, offline state and real host assets; they do not expose the live session.

English-control captures use the Chinese legacy host. Other roles, an English host login, all destinations, zoom and assistive-technology behavior are not certified. Contrast and packaged keyboard checks support specific claims only.

Final round 9 suite scores are **9.0/10 from both reviewers**. Individual component scores remain separately recorded; the suite rating does not imply every component or category scored 9.

## Published comparisons

| Surface              | Before                                                                                    | After                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Login                | [Before](https://github.com/user-attachments/assets/c0f13888-1c2f-4d14-a7c2-af626985f21b) | [After](https://github.com/user-attachments/assets/5f12a2d6-8c3a-4243-b55d-ba9111e8323c) |
| Sidebar              | [Before](https://github.com/user-attachments/assets/45910997-91da-474f-a9e3-4c1ba7dc730b) | [After](https://github.com/user-attachments/assets/3fbfb284-ef28-4fb2-b4c5-cf23b3c92ae4) |
| Expanded profile     | [Before](https://github.com/user-attachments/assets/96297864-4963-4f7d-aa48-435e3081e718) | [After](https://github.com/user-attachments/assets/775b2d6e-97c4-48cc-ac9b-350dbe40dc31) |
| Shared dialog        | [Before](https://github.com/user-attachments/assets/e6893f3e-b020-4c55-95f4-aee0fc0eaa71) | [After](https://github.com/user-attachments/assets/4af8d21c-f595-4cb9-a015-3a1f79a8190d) |
| Homepage favorites   | [Before](https://github.com/user-attachments/assets/cb2c6881-6de6-4f0e-9d71-ebc46847e48d) | [After](https://github.com/user-attachments/assets/d29e22e8-448c-4a3f-8dc8-411d9c7508ce) |
| Homepage search      | [Before](https://github.com/user-attachments/assets/27238817-980b-40b2-8ec5-818883e2a2e5) | [After](https://github.com/user-attachments/assets/25c89bc1-7eab-4fb7-b0c9-dc07c560843e) |
| Narrow login         | [Before](https://github.com/user-attachments/assets/1ea0f72f-607a-4840-bc05-b581283785c5) | [After](https://github.com/user-attachments/assets/45eb2d0a-320e-426c-811c-4782892e7ac0) |
| Phone Menu favorites | [Before](https://github.com/user-attachments/assets/d40596c3-76ef-4a1f-9e31-879239e814da) | [After](https://github.com/user-attachments/assets/7b734857-de6f-4dec-a118-79be12adbc64) |
| Phone Menu search    | [Before](https://github.com/user-attachments/assets/7cadeaf2-d9b3-47e3-a31b-aa3637158cac) | [After](https://github.com/user-attachments/assets/c8e0d9d1-da8b-4a65-992c-8f82377812b8) |
