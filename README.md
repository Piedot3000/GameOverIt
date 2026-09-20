# Game Over It - documentation
---

## 1. Overview

Game Over It is a personal video-game backlog tracker for a student who owns more games than they have time to
play. It keeps one list of everything they mean to play, are playing, have completed, or have given up on - the
job a spreadsheet does badly, because a spreadsheet cannot tell "bought it" apart from "playing it", and a store
wishlist disappears the moment you buy the game.

What makes it more than a list is Steam: connect a public Steam profile and the backlog can be seeded from the
games the account already owns, instead of hand-typing a library of two hundred rows. The user is a single
student.

## 2. Setup and installation

**What to install first**

| Tool | Version used here | Notes |
| --- | --- | --- |
| Node.js | 26.5.0 |
| npm | 12.0.1 | Ships with Node. |
| PostgreSQL | 16.2 | Any 16.x works. Either install, or use a hosted database. |

**Get the code and install dependencies**

```bash
git clone https://github.com/Piedot3000/GameOverIt.git
cd GameOverIt

cd server && npm install
cd ../client && npm install
```

**Environment and configuration**

TODO

## 3. How to run it

TODO

## 4. Features and usage

**The primary flow, once it is built.** Backlog -> *Add game* -> type a title and pick a status -> save -> the new row
appears in the list -> click it -> change the status to *playing* -> the change is saved and visible back in the
list. There are four screens:
- the backlog, add-a-game, game detail, and Steam - behind one shared layout, and every screen has a way back.

## 5. Project structure

Not written yet - it describes the client's folders, and the client has not been built.

## 6. Screenshots

TODO once app has built screens.

## 7. Known issues and next steps

1. **Nothing built yet.** nothing has been built for the app yet. Everything is on paper or a file that still needs implementation.

**Next steps, in order:** Finally start implementing code and get started on the actual app. 

