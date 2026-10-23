---
name: ship-it
description: Commit, push, create a pull request and request review for the current branch. WHEN: "commit push create pr review", "ship it", "open a PR for this".
---

# Ship it

Take the current working changes to a reviewed pull request.

## Steps

1. **Check the branch.** Run `git branch --show-current`. If on `main`, stop and ask which branch name to create.
2. **Validate.** Run `npm run test:ci` and `npx ng build`. Stop and report if either fails.
3. **Review.** Invoke the `code-review` agent on the changes. Fix any high-confidence issues it reports before continuing.
4. **Commit.** Stage only the files related to the task (never `.agents/` or `skills-lock.json` unless asked). Write a short imperative commit message and end it with:

   ```
   Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>
   ```

5. **Push.** `git push -u origin <branch>`.
6. **Create the PR.** Call `create_pull_request` with a concise title and a body covering what changed, why, and how it was tested. Target the default branch.
7. **Report.** Give the PR link and a one-line summary.

## Rules

- Never force-push and never push to `main`.
- Do not commit secrets or build output (`dist/`).
- If there is nothing to commit, say so and stop.
