const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();
app.use(cors());
app.use(express.json());

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const SHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID";

app.get("/tasks", async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A2:G"
    });

    const rows = result.data.values || [];
    const tasks = rows.map(row => ({
      id: row[0],
      title: row[1],
      startDate: row[2],
      dueDate: row[3],
      subTasks: row[4],
      priority: row[5],
      status: row[6]
    }));

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const { title, startDate, dueDate, subTasks, priority } = req.body;

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "Sheet1!A:G",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          Date.now(),
          title,
          startDate,
          dueDate,
          subTasks,
          priority,
          "Pending"
        ]]
      }
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

