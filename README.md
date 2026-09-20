# TaskFlow (beginner build)

A simple to-do dashboard made with plain HTML, CSS, and JavaScript — no
frameworks, no backend. Everything is saved in the browser's `localStorage`.

## How to run it

1. Unzip the folder.
2. Double-click `index.html` (or open it in your browser).
3. The first time it opens, it'll ask for your name, a username, and a
   password — that becomes your account and your profile.
4. Next time you open it, use the same username/password to log back in.

## How it works

- `index.html` — the page structure (login form + the 4 app sections).
- `style.css` — all the styling.
- `script.js` — all the logic: login/signup, adding & completing tasks,
  the calendar, the stats charts, and the profile form.

All data (accounts + tasks) is stored per-browser in `localStorage`. There's
no server, so:
- Data won't sync between devices or browsers.
- Passwords are stored in plain text in the browser — fine for practice,
  not for a real product. Don't reuse a real password when testing it.

## Pages

- **Home** — greeting, add-task bar, Today/Upcoming/Completed tabs, and a
  side panel with today's progress and quick stats.
- **Calendar** — a month view; days with tasks show a dot, click a day to
  see its tasks below.
- **Stats** — completed/created/completion-rate/streak cards, a donut chart
  (completed vs pending vs overdue), and a bar chart of completions by
  weekday.
- **Profile** — edit your name, email, and password.
