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

const SHEET_ID = "1_PKhTH4AWGUWcqekUPK6sFr2FYLdazgsx4YqkIXrvTg";
const SHEET_NAME = "Sheet1";

app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

// ✅ GET TASKS
app.get("/tasks", async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:G`
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADD TASK
app.post("/tasks", async (req, res) => {
  try {
    const { title, startDate, dueDate, subTasks, priority } = req.body;

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A:G`,
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
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE TASK STATUS (Pending → Completed)
app.put("/tasks/:id", async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    // Get all rows
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:G`
    });

    const rows = result.data.values || [];

    const rowIndex = rows.findIndex(row => row[0] === taskId);
    if (rowIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    const sheetRow = rowIndex + 2; // because A2

    // Update status column (G)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!G${sheetRow}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[status]]
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ DELETE TASK
app.delete("/tasks/:id", async (req, res) => {
  try {
    const taskId = req.params.id;

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A2:G`
    });

    const rows = result.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === taskId);

    if (rowIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: 0, // ⚠️ FIRST SHEET ONLY
                dimension: "ROWS",
                startIndex: rowIndex + 1,
                endIndex: rowIndex + 2
              }
            }
          }
        ]
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
