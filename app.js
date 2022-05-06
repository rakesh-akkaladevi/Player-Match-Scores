const express = require("express");
const app = express();
app.use(express.json());

const sqlite3 = require("sqlite3");

const { open } = require("sqlite");

const path = require("path");
const dbpath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server runnung successfully at localhost:3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerToResponse = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};

const convertMatchToResponse = (object) => {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
};

//API GET PLAYERS

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details
    `;
  const players = await db.all(getPlayersQuery);
  response.send(players.map((item) => convertPlayerToResponse(item)));
});

//API GET PLAYER

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId}
    `;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerToResponse(player));
});

//API UPDATE PLAYER

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const putPlayerQuery = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};
    `;
  await db.run(putPlayerQuery);
  response.send("Player Details Updated");
});

//API GET MATCH

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};
    `;
  const match = await db.get(getMatchQuery);
  response.send(convertMatchToResponse(match));
});

//API-5 Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
    SELECT *
    FROM match_details NATURAL JOIN player_match_score 
    WHERE player_id = ${playerId};
    `;
  const matches = await db.all(getMatchesQuery);
  response.send(matches.map((item) => convertMatchToResponse(item)));
});

//API-6 Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT *
    FROM player_details NATURAL JOIN player_match_score
    WHERE match_id = ${matchId};
    `;
  const players = await db.all(getPlayersQuery);
  response.send(players.map((item) => convertPlayerToResponse(item)));
});

//API Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `
    SELECT player_id AS playerId, player_name AS playerName, SUM(score) AS totalScore, SUM(fours) AS totalFours, 
    SUM(sixes) AS totalSixes
    FROM player_match_score NATURAL JOIN player_details 
    WHERE player_id = ${playerId};
    `;
  const playerScore = await db.get(getStatsQuery);
  response.send(playerScore);
});

module.exports = app;
