# Cine Scope

> Cine Scope is an entertainment web application that shows the latest and trending movies and TV series.
> The user can login,search for certain movie or TV series, and save favorite movies and series.

## 🚀 Live Demo

The live demo [link](https://cine-scope-one.vercel.app/) deployed on Vercel.
The live demo [link](https://cine-scope.netlify.app/) deployed on Netlify.

## 🛠 Built With

### Tech Stack

- React.
- Vite.
- TypeScript.
- Redux Toolkit.
- React Router.
- React Paginate.
- Tailwind.
- Linters.

### Key Features

- Initialize the app using `Vite` with `TypeScript` and `Tailwind`.
- Uses [the movie database API](https://developer.themoviedb.org/reference/intro/getting-started) to get Movies and TV shows data and post Bookmarked items.
- Use `Redux-Toolkit` for fetching data and handling the global state of the app.
- Use `React-Paginate` for pages pagination.
- Use mobile-first design technique with `Tailwind`.
- Add search feature to search for movies and TV shows.
- Use `react-router` as the main router for the app.
- Add test cases using `Vitest` and `React-Testing-library`.
- Optimize the app for best performance, accessibility, and SEO.
- Use GitHub workflow and document my work professionally.

## 🗂 Project Structure

The backend lives in two top-level folders. This split is required by Vercel — it is not a leftover from the old Fastify server (that backend was fully replaced by the serverless setup):

- `api/` — HTTP entrypoints only. Vercel deploys **every file in this folder as a public serverless function** (`api/history.ts` → `/api/history`), so only route handlers may live here.
- `server/` — shared server-only code the functions import: the Better Auth config (`auth.ts`), the Drizzle client and schemas (`db/`), env loading (`env.ts`), auth emails (`mailer.ts`), and response helpers (`http.ts`). It must stay **outside** `api/`, otherwise Vercel would expose each helper as its own endpoint.
- `src/` — the React client. It never imports from `api/` or `server/`.

Imports flow one way: `api/*` → `server/*`, never the reverse. The `server/` paths are also referenced by `drizzle.config.ts`, the `auth:schema` script in `package.json`, and `tsconfig.server.json` — don't move these folders without updating all three.

## 💻 Getting Started

### Prerequisites

- Install [node.js](https://nodejs.org/en/).

### Setup

- Clone the project using git-bash or GitHub Desktop.
- Open the project folder with VSCode or any Editor.
- Open the terminal and navigate to the project folder.

### Usage

- Run this command `npm install` to install dependencies.
- Run this command `npm run dev` to start the dev server.

### Test

- Run this command `npm run test` to run all test cases.

## Author

👨‍💻 **Omar Muhammad**

- GitHub: [@Omar-Muhamad](https://github.com/Omar-Muhamad)
- Twitter: [@Eng_OmarMuhamad](https://twitter.com/Eng_OmarMuhamad)
- LinkedIn: [@eng-omarmuhammad](https://www.linkedin.com/in/eng-omarmuhammad/)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

Feel free to check the issues page.

## ⭐️ Show your support

Give a ⭐️ if you like this project!

## 📝 License

This project is [MIT](./MIT.md) licensed.
